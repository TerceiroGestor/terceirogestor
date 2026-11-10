import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { App } from 'supertest/types';
import { AuthService } from '../src/core/auth/auth.service';
import { REFRESH_COOKIE_NAME } from '../src/core/auth/http/auth-http';
import { PrismaService } from '../src/core/prisma/prisma.service';
import {
  TestTenantContext,
  cleanupTenant,
  createE2eTestApp,
  provisionFullAccessTenant,
} from './support/tenant-isolation.setup';

/**
 * Item 7 da auditoria (docs/auditoria-riscos.md): o access token passou de
 * 8h para 15min (auth.module.ts / registration.module.ts). Critério de
 * aceite: token expirado é rejeitado; refresh continua renovando a sessão
 * normalmente.
 *
 * Precisa de um Postgres real em DATABASE_URL; só roda via
 * `npm run test:e2e`.
 */
describe('Expiração do access token (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let authService: AuthService;
  let tenant: TestTenantContext;

  beforeAll(async () => {
    const ctx = await createE2eTestApp();
    app = ctx.app;
    prisma = ctx.prisma;
    jwtService = ctx.jwtService;
    authService = app.get(AuthService);
    tenant = await provisionFullAccessTenant(prisma, jwtService, 'Expiry');
  }, 120_000);

  afterAll(async () => {
    await cleanupTenant(prisma, tenant.tenant.id);
    await app.close();
  });

  function server(): App {
    return app.getHttpServer();
  }

  it('assina o access token para expirar em ~15 minutos, não 8 horas', () => {
    const decoded = jwtService.decode<{ iat: number; exp: number }>(
      tenant.token,
    );
    const lifetimeSeconds = decoded.exp - decoded.iat;
    expect(lifetimeSeconds).toBeGreaterThan(14 * 60);
    expect(lifetimeSeconds).toBeLessThanOrEqual(15 * 60);
  });

  it('rejeita um access token expirado com 401, mesmo sendo assinado corretamente', async () => {
    const expiredToken = await jwtService.signAsync(
      {
        sub: tenant.userId,
        tenantId: tenant.tenant.id,
        tenantSlug: tenant.tenant.slug,
        email: 'does-not-matter@example.com',
      },
      { expiresIn: '-10s' },
    );

    const res = await request(server())
      .get('/people')
      .set('Authorization', `Bearer ${expiredToken}`);

    expect(res.status).toBe(401);
  });

  it('refresh continua renovando a sessão com um access token novo e válido', async () => {
    const session = await authService.createSessionForUser(
      tenant.userId,
      tenant.tenant.id,
    );

    const refreshRes = await request(server())
      .post('/auth/refresh')
      .set('Cookie', `${REFRESH_COOKIE_NAME}=${session.refreshToken}`);

    expect(refreshRes.status).toBe(201);
    const { accessToken: newAccessToken } = refreshRes.body as {
      accessToken: string;
    };
    expect(typeof newAccessToken).toBe('string');
    expect(newAccessToken.length).toBeGreaterThan(0);

    const protectedRes = await request(server())
      .get('/people')
      .set('Authorization', `Bearer ${newAccessToken}`);
    expect(protectedRes.status).toBe(200);
  });
});
