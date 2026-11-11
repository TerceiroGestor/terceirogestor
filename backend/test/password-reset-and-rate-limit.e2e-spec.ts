import { createHash, randomUUID } from 'crypto';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AuthService } from '../src/core/auth/auth.service';
import { PrismaService } from '../src/core/prisma/prisma.service';
import {
  TestTenantContext,
  cleanupTenant,
  createE2eTestApp,
  provisionFullAccessTenant,
} from './support/tenant-isolation.setup';

/**
 * Item 3.4 da auditoria (docs/auditoria-riscos.md / PLAN.md Parte 3.4):
 * "conferir o rate limit em login, cadastro, esqueci a senha e reset (os
 * 4 decorators já existem) e a expiração do token de reset." Precisa de
 * Postgres real; só roda via `npm run test:e2e`.
 */

// auth.service.ts#hashToken - replicated here (sha256 hex) so the test can
// insert a PasswordResetToken row whose hash matches a token it controls,
// without reaching into the service's private method or depending on an
// email being sent (SMTP isn't configured in this environment).
function hashResetToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

describe('Expiração do token de reset de senha (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let tenant: TestTenantContext;

  beforeAll(async () => {
    const ctx = await createE2eTestApp();
    app = ctx.app;
    prisma = ctx.prisma;
    tenant = await provisionFullAccessTenant(prisma, ctx.jwtService, 'ResetExpiry');
  }, 120_000);

  afterAll(async () => {
    // PasswordResetToken.userId cascades on delete, so cleanupTenant's own
    // user.deleteMany already takes the rows created below with it.
    await cleanupTenant(prisma, tenant.tenant.id);
    await app.close();
  });

  function server(): App {
    return app.getHttpServer();
  }

  async function createResetToken(overrides: {
    expiresAt: Date;
    consumedAt?: Date | null;
    revokedAt?: Date | null;
  }) {
    const token = randomUUID();
    await prisma.passwordResetToken.create({
      data: {
        tenantId: tenant.tenant.id,
        userId: tenant.userId,
        tokenHash: hashResetToken(token),
        expiresAt: overrides.expiresAt,
        consumedAt: overrides.consumedAt ?? null,
        revokedAt: overrides.revokedAt ?? null,
      },
    });
    return token;
  }

  it('rejeita um token de reset expirado', async () => {
    const token = await createResetToken({
      expiresAt: new Date(Date.now() - 60_000),
    });

    const res = await request(server())
      .post('/auth/reset-password')
      .send({ token, password: 'NovaSenha@123' });

    expect(res.status).toBe(400);
  });

  it('rejeita um token de reset já revogado', async () => {
    const token = await createResetToken({
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      revokedAt: new Date(),
    });

    const res = await request(server())
      .post('/auth/reset-password')
      .send({ token, password: 'NovaSenha@123' });

    expect(res.status).toBe(400);
  });

  it('rejeita um token de reset já consumido', async () => {
    const token = await createResetToken({
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      consumedAt: new Date(),
    });

    const res = await request(server())
      .post('/auth/reset-password')
      .send({ token, password: 'NovaSenha@123' });

    expect(res.status).toBe(400);
  });

  it('aceita um token válido, troca a senha e o torna inutilizável numa segunda tentativa', async () => {
    const token = await createResetToken({
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    });

    const okRes = await request(server())
      .post('/auth/reset-password')
      .send({ token, password: 'NovaSenha@123' });
    expect(okRes.status).toBe(201);

    const user = await prisma.user.findUniqueOrThrow({
      where: { id: tenant.userId },
      select: { email: true },
    });
    const loginRes = await request(server()).post('/auth/login').send({
      tenantId: tenant.tenant.id,
      email: user.email,
      password: 'NovaSenha@123',
    });
    expect(loginRes.status).toBe(201);

    const reuseRes = await request(server())
      .post('/auth/reset-password')
      .send({ token, password: 'OutraSenha@456' });
    expect(reuseRes.status).toBe(400);
  });

  it('ao solicitar um novo reset, revoga qualquer token anterior ainda válido do mesmo usuário', async () => {
    const authService = app.get(AuthService);
    const oldToken = await createResetToken({
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    });
    const oldHash = hashResetToken(oldToken);

    const user = await prisma.user.findUniqueOrThrow({
      where: { id: tenant.userId },
      select: { email: true },
    });
    await authService.requestPasswordReset({
      tenantId: tenant.tenant.id,
      email: user.email,
    });

    const oldRow = await prisma.passwordResetToken.findUnique({
      where: { tokenHash: oldHash },
      select: { revokedAt: true },
    });
    expect(oldRow?.revokedAt).not.toBeNull();
  });
});

describe('Rate limit nos 4 fluxos de autenticação/cadastro (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let tenant: TestTenantContext;
  const runId = randomUUID().slice(0, 8);

  beforeAll(async () => {
    const ctx = await createE2eTestApp();
    app = ctx.app;
    prisma = ctx.prisma;
    tenant = await provisionFullAccessTenant(prisma, ctx.jwtService, 'RateLimit');
  }, 120_000);

  afterAll(async () => {
    await prisma.tenantRegistration.deleteMany({
      where: { tenantName: { startsWith: `E2E RateLimit ${runId}` } },
    });
    await cleanupTenant(prisma, tenant.tenant.id);
    await app.close();
  });

  function server(): App {
    return app.getHttpServer();
  }

  it('bloqueia POST /auth/login com 429 após o limite (20 por 10min)', async () => {
    const email = `rate-limit-login-${runId}@example.com`;
    let lastStatus = 0;
    for (let i = 0; i < 21; i++) {
      const res = await request(server()).post('/auth/login').send({
        tenantId: tenant.tenant.id,
        email,
        password: 'senha-errada-nao-importa',
      });
      lastStatus = res.status;
      if (i < 20) {
        expect(res.status).not.toBe(429);
      }
    }
    expect(lastStatus).toBe(429);
  });

  it('bloqueia POST /auth/forgot-password com 429 após o limite (10 por hora)', async () => {
    const email = `rate-limit-forgot-${runId}@example.com`;
    let lastStatus = 0;
    for (let i = 0; i < 11; i++) {
      const res = await request(server()).post('/auth/forgot-password').send({
        tenantId: tenant.tenant.id,
        email,
      });
      lastStatus = res.status;
      if (i < 10) {
        expect(res.status).not.toBe(429);
      }
    }
    expect(lastStatus).toBe(429);
  });

  it('bloqueia POST /auth/reset-password com 429 após o limite (20 por hora)', async () => {
    let lastStatus = 0;
    for (let i = 0; i < 21; i++) {
      const res = await request(server())
        .post('/auth/reset-password')
        .send({ token: `token-invalido-${i}`, password: 'NovaSenha@123' });
      lastStatus = res.status;
      if (i < 20) {
        expect(res.status).not.toBe(429);
      }
    }
    expect(lastStatus).toBe(429);
  });

  it('bloqueia POST /registration/tenant/request com 429 após o limite (10 por hora)', async () => {
    let lastStatus = 0;
    for (let i = 0; i < 11; i++) {
      const res = await request(server())
        .post('/registration/tenant/request')
        .send({
          tenantName: `E2E RateLimit ${runId} ${i}`,
          adminName: 'Admin E2E',
          adminEmail: `rate-limit-register-${runId}-${i}@example.com`,
          adminPassword: 'SenhaValida@123',
        });
      lastStatus = res.status;
      if (i < 10) {
        expect(res.status).not.toBe(429);
      }
    }
    expect(lastStatus).toBe(429);
  });
});
