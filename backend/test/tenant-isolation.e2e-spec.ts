import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { randomUUID } from 'crypto';
import { PrismaService } from '../src/core/prisma/prisma.service';
import {
  TestTenantContext,
  bearer,
  cleanupTenant,
  createE2eTestApp,
  provisionFullAccessTenant,
} from './support/tenant-isolation.setup';

/**
 * Item 6 da auditoria (docs/auditoria-riscos.md): teste e2e de vazamento
 * por módulo. Cria um recurso sob o Tenant A direto no banco (Prisma) e
 * tenta listar/ler/editar/excluir/anexar com o usuário do Tenant B — tudo
 * deve voltar 404, nunca os dados do outro tenant.
 *
 * Precisa de um Postgres real em DATABASE_URL (mesmo banco usado em
 * `npm run start:dev`); por isso não faz parte do `npm test` (unitário),
 * só do `npm run test:e2e`.
 */
describe('Isolamento entre tenants (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let tenantA: TestTenantContext;
  let tenantB: TestTenantContext;

  beforeAll(async () => {
    const ctx = await createE2eTestApp();
    app = ctx.app;
    prisma = ctx.prisma;
    tenantA = await provisionFullAccessTenant(prisma, ctx.jwtService, 'A');
    tenantB = await provisionFullAccessTenant(prisma, ctx.jwtService, 'B');
  }, 120_000);

  afterAll(async () => {
    await cleanupTenant(prisma, tenantA.tenant.id);
    await cleanupTenant(prisma, tenantB.tenant.id);
    await app.close();
  });

  function server(): App {
    return app.getHttpServer();
  }

  async function expectListDoesNotContain(listPath: string, id: string) {
    const res = await request(server())
      .get(listPath)
      .set('Authorization', bearer(tenantB));
    expect(res.status).toBe(200);
    expect(JSON.stringify(res.body)).not.toContain(id);
  }

  async function expectNotFoundAsOtherTenant(
    method: 'get' | 'patch' | 'delete' | 'post',
    path: string,
    body?: object,
  ) {
    const req = request(server())
      [method](path)
      .set('Authorization', bearer(tenantB));
    const res = body === undefined ? await req : await req.send(body);
    expect(res.status).toBe(404);
  }

  it('programs: lista, leitura, edição, exclusão e comentário não vazam entre tenants', async () => {
    const program = await prisma.program.create({
      data: {
        tenantId: tenantA.tenant.id,
        name: `E2E Program ${randomUUID()}`,
        type: 'OTHER',
      },
    });

    await expectListDoesNotContain('/programs', program.id);
    await expectNotFoundAsOtherTenant('get', `/programs/${program.id}`);
    await expectNotFoundAsOtherTenant('patch', `/programs/${program.id}`, {});
    await expectNotFoundAsOtherTenant(
      'post',
      `/programs/${program.id}/comments`,
      { body: 'probe' },
    );
    await expectNotFoundAsOtherTenant('delete', `/programs/${program.id}`);

    const stillThere = await prisma.program.findUnique({
      where: { id: program.id },
    });
    expect(stillThere).not.toBeNull();
  });

  it('projects: lista, leitura, edição, exclusão e comentário não vazam entre tenants', async () => {
    const program = await prisma.program.create({
      data: {
        tenantId: tenantA.tenant.id,
        name: `E2E Program for Project ${randomUUID()}`,
        type: 'OTHER',
      },
    });
    const project = await prisma.project.create({
      data: {
        tenantId: tenantA.tenant.id,
        programId: program.id,
        name: `E2E Project ${randomUUID()}`,
      },
    });

    await expectListDoesNotContain('/projects', project.id);
    await expectNotFoundAsOtherTenant('get', `/projects/${project.id}`);
    await expectNotFoundAsOtherTenant('patch', `/projects/${project.id}`, {});
    await expectNotFoundAsOtherTenant(
      'post',
      `/projects/${project.id}/comments`,
      { body: 'probe' },
    );
    await expectNotFoundAsOtherTenant('delete', `/projects/${project.id}`);

    const stillThere = await prisma.project.findUnique({
      where: { id: project.id },
    });
    expect(stillThere).not.toBeNull();
  });

  it('pantry: lista, leitura, edição, exclusão e comentário de item não vazam entre tenants', async () => {
    const item = await prisma.pantryItem.create({
      data: {
        tenantId: tenantA.tenant.id,
        name: `E2E Pantry Item ${randomUUID()}`,
        unit: 'kg',
        minStock: 1,
      },
    });

    await expectListDoesNotContain('/pantry/items', item.id);
    await expectNotFoundAsOtherTenant('get', `/pantry/items/${item.id}`);
    await expectNotFoundAsOtherTenant('patch', `/pantry/items/${item.id}`, {});
    await expectNotFoundAsOtherTenant(
      'post',
      `/pantry/items/${item.id}/comments`,
      { body: 'probe' },
    );
    await expectNotFoundAsOtherTenant('delete', `/pantry/items/${item.id}`);

    const stillThere = await prisma.pantryItem.findUnique({
      where: { id: item.id },
    });
    expect(stillThere).not.toBeNull();
  });

  it('deposit: lista, leitura, edição, exclusão e comentário de item não vazam entre tenants', async () => {
    const item = await prisma.depositItem.create({
      data: {
        tenantId: tenantA.tenant.id,
        name: `E2E Deposit Item ${randomUUID()}`,
        unit: 'kg',
        minStock: 1,
      },
    });

    await expectListDoesNotContain('/deposit/items', item.id);
    await expectNotFoundAsOtherTenant('get', `/deposit/items/${item.id}`);
    await expectNotFoundAsOtherTenant('patch', `/deposit/items/${item.id}`, {});
    await expectNotFoundAsOtherTenant(
      'post',
      `/deposit/items/${item.id}/comments`,
      { body: 'probe' },
    );
    await expectNotFoundAsOtherTenant('delete', `/deposit/items/${item.id}`);

    const stillThere = await prisma.depositItem.findUnique({
      where: { id: item.id },
    });
    expect(stillThere).not.toBeNull();
  });

  it('tasks: lista, leitura, edição e exclusão não vazam entre tenants', async () => {
    const task = await prisma.taskOrganizerTask.create({
      data: {
        tenantId: tenantA.tenant.id,
        title: `E2E Task ${randomUUID()}`,
      },
    });

    await expectListDoesNotContain('/tasks', task.id);
    await expectNotFoundAsOtherTenant('get', `/tasks/${task.id}`);
    await expectNotFoundAsOtherTenant('patch', `/tasks/${task.id}`, {});
    await expectNotFoundAsOtherTenant('delete', `/tasks/${task.id}`);

    const stillThere = await prisma.taskOrganizerTask.findUnique({
      where: { id: task.id },
    });
    expect(stillThere).not.toBeNull();
  });

  it('people: lista, leitura, edição e exclusão não vazam entre tenants', async () => {
    const person = await prisma.person.create({
      data: {
        tenantId: tenantA.tenant.id,
        fullName: `E2E Person ${randomUUID()}`,
      },
    });

    await expectListDoesNotContain('/people', person.id);
    await expectNotFoundAsOtherTenant('get', `/people/${person.id}`);
    await expectNotFoundAsOtherTenant('patch', `/people/${person.id}`, {});
    await expectNotFoundAsOtherTenant('delete', `/people/${person.id}`);

    const stillThere = await prisma.person.findUnique({
      where: { id: person.id },
    });
    expect(stillThere).not.toBeNull();
  });

  it('people-groups: lista, leitura, edição e exclusão não vazam entre tenants', async () => {
    const group = await prisma.peopleGroup.create({
      data: {
        tenantId: tenantA.tenant.id,
        name: `E2E Group ${randomUUID()}`,
      },
    });

    await expectListDoesNotContain('/people-groups', group.id);
    await expectNotFoundAsOtherTenant('get', `/people-groups/${group.id}`);
    await expectNotFoundAsOtherTenant(
      'patch',
      `/people-groups/${group.id}`,
      {},
    );
    await expectNotFoundAsOtherTenant('delete', `/people-groups/${group.id}`);

    const stillThere = await prisma.peopleGroup.findUnique({
      where: { id: group.id },
    });
    expect(stillThere).not.toBeNull();
  });

  it('actions (tipos de ação): lista, edição e exclusão não vazam entre tenants', async () => {
    const actionType = await prisma.activityType.create({
      data: {
        tenantId: tenantA.tenant.id,
        name: `E2E Action Type ${randomUUID()}`,
      },
    });

    await expectListDoesNotContain('/action-types', actionType.id);
    await expectNotFoundAsOtherTenant(
      'patch',
      `/action-types/${actionType.id}`,
      {},
    );
    await expectNotFoundAsOtherTenant(
      'delete',
      `/action-types/${actionType.id}`,
    );

    const stillThere = await prisma.activityType.findUnique({
      where: { id: actionType.id },
    });
    expect(stillThere).not.toBeNull();
  });

  it('o slug /t/:slug da URL nunca prevalece sobre o tenantId do JWT', async () => {
    // Token do Tenant B usado contra a URL com o slug do Tenant A: a
    // JwtStrategy deve rejeitar antes de qualquer controller rodar.
    const res = await request(server())
      .get(`/t/${tenantA.tenant.slug}/people`)
      .set('Authorization', bearer(tenantB));
    expect(res.status).toBe(401);
  });
});
