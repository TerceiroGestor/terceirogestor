import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { App } from 'supertest/types';
import { randomUUID } from 'crypto';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/core/prisma/prisma.service';

export type TestTenantContext = {
  tenant: { id: string; slug: string; name: string };
  userId: string;
  token: string;
};

/**
 * Sobe a aplicação inteira (mesmo pipeline de main.ts) contra o banco real
 * apontado por DATABASE_URL, para testes e2e de isolamento entre tenants.
 */
export async function createTenantIsolationTestApp(): Promise<{
  app: INestApplication<App>;
  prisma: PrismaService;
  jwtService: JwtService;
}> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app: INestApplication<App> = moduleRef.createNestApplication();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidUnknownValues: true,
    }),
  );
  await app.init();

  return {
    app,
    prisma: app.get(PrismaService),
    jwtService: app.get(JwtService),
  };
}

/**
 * Cria um tenant isolado com um usuário com acesso total (todas as
 * permissions do catálogo), para testar vazamento entre tenants sem que
 * um 403 de permissão (em vez de 404 de isolamento) confunda o resultado.
 */
export async function provisionFullAccessTenant(
  prisma: PrismaService,
  jwtService: JwtService,
  label: string,
): Promise<TestTenantContext> {
  const suffix = randomUUID().slice(0, 8);

  const tenant = await prisma.tenant.create({
    data: {
      name: `E2E Tenant ${label} ${suffix}`,
      slug: `e2e-tenant-${label.toLowerCase()}-${suffix}`,
    },
    select: { id: true, slug: true, name: true },
  });

  const role = await prisma.role.create({
    data: { tenantId: tenant.id, name: 'E2E Full Access' },
    select: { id: true },
  });

  const permissions = await prisma.permission.findMany({
    select: { id: true },
  });
  if (permissions.length > 0) {
    await prisma.rolePermission.createMany({
      data: permissions.map((permission) => ({
        tenantId: tenant.id,
        roleId: role.id,
        permissionId: permission.id,
      })),
    });
  }

  const user = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      name: `E2E User ${label}`,
      email: `e2e-${label.toLowerCase()}-${suffix}@example.com`,
      passwordHash: 'not-used-in-this-test',
      isActive: true,
    },
    select: { id: true },
  });

  await prisma.userRole.create({
    data: { tenantId: tenant.id, userId: user.id, roleId: role.id },
  });

  const token = await jwtService.signAsync({
    sub: user.id,
    tenantId: tenant.id,
    tenantSlug: tenant.slug,
    email: `e2e-${label.toLowerCase()}-${suffix}@example.com`,
    name: `E2E User ${label}`,
    tenantName: tenant.name,
  });

  return { tenant, userId: user.id, token };
}

export function bearer(ctx: TestTenantContext) {
  return `Bearer ${ctx.token}`;
}

/**
 * Nenhuma FK de tenantId tem onDelete: Cascade (de propósito — evita
 * apagar dado de instituição por engano). Apaga na ordem certa só o que
 * este helper de teste criou, pra não acumular tenant de teste no banco
 * local a cada execução do `test:e2e`.
 */
export async function cleanupTenant(prisma: PrismaService, tenantId: string) {
  await prisma.project.deleteMany({ where: { tenantId } });
  await prisma.program.deleteMany({ where: { tenantId } });
  await prisma.pantryItem.deleteMany({ where: { tenantId } });
  await prisma.depositItem.deleteMany({ where: { tenantId } });
  await prisma.taskOrganizerTask.deleteMany({ where: { tenantId } });
  await prisma.person.deleteMany({ where: { tenantId } });
  await prisma.peopleGroup.deleteMany({ where: { tenantId } });
  await prisma.peopleSegment.deleteMany({ where: { tenantId } });
  await prisma.actionType.deleteMany({ where: { tenantId } });
  await prisma.rolePermission.deleteMany({ where: { tenantId } });
  await prisma.userRole.deleteMany({ where: { tenantId } });
  await prisma.role.deleteMany({ where: { tenantId } });
  await prisma.user.deleteMany({ where: { tenantId } });
  // PrismaService audita toda escrita de domínio automaticamente (ver
  // core/prisma/prisma.service.ts) — inclusive os deletes acima, que
  // acabam de gerar suas próprias linhas de AuditLog. Por isso essa
  // limpeza só pode vir por último, imediatamente antes do delete do
  // Tenant, senão a FK RESTRICT de AuditLog bloqueia o delete.
  await prisma.auditLog.deleteMany({ where: { tenantId } });
  await prisma.tenant.delete({ where: { id: tenantId } });
}
