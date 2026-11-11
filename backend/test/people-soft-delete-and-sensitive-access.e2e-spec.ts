import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaService } from '../src/core/prisma/prisma.service';
import {
  TestTenantContext,
  bearer,
  cleanupTenant,
  createE2eTestApp,
  provisionFullAccessTenant,
} from './support/tenant-isolation.setup';

/**
 * Dois bugs reais do módulo people, achados numa varredura em
 * 2026-11-12:
 *
 * 1. `DELETE /people/:id` fazia hard delete puro, mas ~16 sub-recursos
 *    (contato, condição de saúde, renda, relação familiar...) não têm
 *    `onDelete: Cascade` - qualquer pessoa com dado real vinculado
 *    estourava violação de FK. Corrigido com exclusão lógica (soft
 *    delete) via `Person.status`.
 * 2. Condição de saúde e medicação (dado de saúde, sensível sob a LGPD)
 *    usavam as permissões genéricas `people.read`/`people.update` e
 *    nunca geravam `PersonSensitiveAccessLog`, ao contrário de
 *    `sensitive-documents` (documentos/CPF/RG), que já tinha os dois.
 *
 * Precisa de Postgres real; só roda via `npm run test:e2e`.
 */
describe('people: exclusão lógica e controle de dado sensível (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let tenant: TestTenantContext;

  beforeAll(async () => {
    const ctx = await createE2eTestApp();
    app = ctx.app;
    prisma = ctx.prisma;
    jwtService = ctx.jwtService;
    tenant = await provisionFullAccessTenant(prisma, jwtService, 'PeopleBugs');
  }, 120_000);

  afterAll(async () => {
    // Person nao tem onDelete: Cascade pra essas tabelas (e' literalmente
    // o bug 1) - cleanupTenant() faz prisma.person.deleteMany() no fim, e
    // estouraria a mesma violacao de FK se essas linhas ainda existissem.
    await prisma.personSensitiveAccessLog.deleteMany({
      where: { tenantId: tenant.tenant.id },
    });
    await prisma.personHealthCondition.deleteMany({
      where: { tenantId: tenant.tenant.id },
    });
    await prisma.personMedication.deleteMany({
      where: { tenantId: tenant.tenant.id },
    });
    await prisma.personContact.deleteMany({
      where: { tenantId: tenant.tenant.id },
    });
    await cleanupTenant(prisma, tenant.tenant.id);
    await app.close();
  });

  function server(): App {
    return app.getHttpServer();
  }

  async function createPerson(fullName: string): Promise<string> {
    const res = await request(server())
      .post('/people')
      .set('Authorization', bearer(tenant))
      .send({ fullName });
    expect(res.status).toBe(201);
    return (res.body as { id: string }).id;
  }

  async function createLimitedUser(permissionKeys: string[]) {
    const suffix = randomUUID().slice(0, 8);
    const role = await prisma.role.create({
      data: { tenantId: tenant.tenant.id, name: `E2E Limited ${suffix}` },
      select: { id: true },
    });
    const permissions = await prisma.permission.findMany({
      where: { key: { in: permissionKeys } },
      select: { id: true },
    });
    await prisma.rolePermission.createMany({
      data: permissions.map((permission) => ({
        tenantId: tenant.tenant.id,
        roleId: role.id,
        permissionId: permission.id,
      })),
    });
    const email = `e2e-limited-${suffix}@example.com`;
    const user = await prisma.user.create({
      data: {
        tenantId: tenant.tenant.id,
        name: `E2E Limited User ${suffix}`,
        email,
        passwordHash: 'not-used-in-this-test',
        isActive: true,
      },
      select: { id: true },
    });
    await prisma.userRole.create({
      data: { tenantId: tenant.tenant.id, userId: user.id, roleId: role.id },
    });
    const token = await jwtService.signAsync({
      sub: user.id,
      tenantId: tenant.tenant.id,
      tenantSlug: tenant.tenant.slug,
      email,
    });
    return token;
  }

  describe('exclusão lógica (soft delete)', () => {
    it('exclui uma pessoa com dado relacionado sem quebrar (antes estourava violação de FK)', async () => {
      const personId = await createPerson(`E2E Delete ${randomUUID()}`);

      // Antes da correção, qualquer sub-recurso sem onDelete: Cascade
      // (ex.: contato) fazia o DELETE estourar erro de FK do Prisma.
      await prisma.personContact.create({
        data: {
          tenantId: tenant.tenant.id,
          personId,
          role: 'SELF',
          type: 'EMAIL',
          value: `contato-${randomUUID()}@example.com`,
        },
      });

      const delRes = await request(server())
        .delete(`/people/${personId}`)
        .set('Authorization', bearer(tenant));
      expect(delRes.status).toBe(200);
      expect(delRes.body).toEqual({ deleted: true });

      const listRes = await request(server())
        .get('/people')
        .set('Authorization', bearer(tenant));
      const ids = (listRes.body.data as Array<{ id: string }>).map(
        (person) => person.id,
      );
      expect(ids).not.toContain(personId);

      const getRes = await request(server())
        .get(`/people/${personId}`)
        .set('Authorization', bearer(tenant));
      expect(getRes.status).toBe(404);

      // O contato continua no banco - historico preservado, nao apagado.
      const contact = await prisma.personContact.findFirst({
        where: { personId },
      });
      expect(contact).not.toBeNull();

      const row = await prisma.person.findUnique({ where: { id: personId } });
      expect(row?.status).toBe('Excluido');
    });

    it('excluir de novo (ou algo inexistente) devolve 404, não um "sucesso" duplicado', async () => {
      const personId = await createPerson(`E2E Delete Twice ${randomUUID()}`);

      await request(server())
        .delete(`/people/${personId}`)
        .set('Authorization', bearer(tenant))
        .expect(200);

      await request(server())
        .delete(`/people/${personId}`)
        .set('Authorization', bearer(tenant))
        .expect(404);
    });
  });

  describe('controle de dado sensível em condição de saúde e medicação', () => {
    it('ler e criar condição de saúde grava PersonSensitiveAccessLog', async () => {
      const personId = await createPerson(`E2E Health ${randomUUID()}`);

      const createRes = await request(server())
        .post(`/people/${personId}/health-conditions`)
        .set('Authorization', bearer(tenant))
        .send({ type: 'Asma' });
      expect(createRes.status).toBe(201);

      const listRes = await request(server())
        .get(`/people/${personId}/health-conditions`)
        .set('Authorization', bearer(tenant));
      expect(listRes.status).toBe(200);

      const logs = await prisma.personSensitiveAccessLog.findMany({
        where: { personId },
        orderBy: { createdAt: 'asc' },
      });
      expect(logs.map((log) => log.action)).toEqual(['UPDATE', 'READ']);
      expect(logs.every((log) => log.userId === tenant.userId)).toBe(true);
    });

    it('ler e criar medicação grava PersonSensitiveAccessLog', async () => {
      const personId = await createPerson(`E2E Medication ${randomUUID()}`);

      const createRes = await request(server())
        .post(`/people/${personId}/medications`)
        .set('Authorization', bearer(tenant))
        .send({ medication: 'Paracetamol' });
      expect(createRes.status).toBe(201);

      const listRes = await request(server())
        .get(`/people/${personId}/medications`)
        .set('Authorization', bearer(tenant));
      expect(listRes.status).toBe(200);

      const logs = await prisma.personSensitiveAccessLog.findMany({
        where: { personId },
      });
      expect(logs).toHaveLength(2);
    });

    it('rejeita health-conditions/medications para um papel só com people.read/people.update genérico', async () => {
      const personId = await createPerson(`E2E NoSensitive ${randomUUID()}`);
      const limitedToken = await createLimitedUser([
        'people.read',
        'people.create',
        'people.update',
        'people.delete',
      ]);

      // Cadastro comum continua acessível com a permissão genérica.
      await request(server())
        .get(`/people/${personId}`)
        .set('Authorization', `Bearer ${limitedToken}`)
        .expect(200);

      // Dado sensível, não.
      await request(server())
        .get(`/people/${personId}/health-conditions`)
        .set('Authorization', `Bearer ${limitedToken}`)
        .expect(403);

      await request(server())
        .post(`/people/${personId}/medications`)
        .set('Authorization', `Bearer ${limitedToken}`)
        .send({ medication: 'Paracetamol' })
        .expect(403);
    });
  });
});
