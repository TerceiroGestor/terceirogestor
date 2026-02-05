import * as bcrypt from 'bcrypt';
import { createPrismaAdapter } from './prisma-adapter';
import { PrismaClient } from '../generated/prisma/client';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set');
}

const adapter = createPrismaAdapter(databaseUrl);
const prisma = new PrismaClient({ adapter });

async function main() {
  const tenantId = '11111111-1111-1111-1111-111111111111';
  const tenant = await prisma.tenant.upsert({
    where: { id: tenantId },
    update: { name: 'Instituicao Exemplo' },
    create: { id: tenantId, name: 'Instituicao Exemplo' },
  });

  const permissions = [
    { key: 'people.read', description: 'Ler pessoas' },
    { key: 'people.create', description: 'Criar pessoas' },
    { key: 'people.update', description: 'Atualizar pessoas' },
    { key: 'people.delete', description: 'Excluir pessoas' },
    { key: 'users.read', description: 'Ler usuários' },
    { key: 'users.create', description: 'Criar usuários' },
    { key: 'users.update', description: 'Atualizar usuários' },
    { key: 'users.delete', description: 'Excluir usuários' },
    { key: 'roles.manage', description: 'Gerenciar perfis e permissões' },
    { key: 'tenants.read', description: 'Ler dados da instituição' },
  ];

  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { key: permission.key },
      update: { description: permission.description },
      create: permission,
    });
  }

  const adminRole = await prisma.role.upsert({
    where: {
      tenantId_name: {
        tenantId: tenant.id,
        name: 'Admin',
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'Admin',
      description: 'Administrador da instituição',
    },
  });

  const allPermissions = await prisma.permission.findMany();
  for (const permission of allPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        tenantId_roleId_permissionId: {
          tenantId: tenant.id,
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        tenantId: tenant.id,
        roleId: adminRole.id,
        permissionId: permission.id,
      },
    });
  }

  const passwordHash = await bcrypt.hash('Admin@123', 10);
  const adminUser = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: tenant.id,
        email: 'admin@exemplo.com',
      },
    },
    update: {
      passwordHash,
      isActive: true,
    },
    create: {
      tenantId: tenant.id,
      email: 'admin@exemplo.com',
      passwordHash,
      isActive: true,
    },
  });

  await prisma.userRole.upsert({
    where: {
      tenantId_userId_roleId: {
        tenantId: tenant.id,
        userId: adminUser.id,
        roleId: adminRole.id,
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      userId: adminUser.id,
      roleId: adminRole.id,
    },
  });

  const people = [
    {
      id: '22222222-2222-2222-2222-222222222222',
      fullName: 'Ana Pereira',
      document: '111.222.333-44',
    },
    {
      id: '33333333-3333-3333-3333-333333333333',
      fullName: 'Carlos Souza',
      document: '222.333.444-55',
    },
    {
      id: '44444444-4444-4444-4444-444444444444',
      fullName: 'Marina Lima',
      document: '333.444.555-66',
    },
  ];

  for (const person of people) {
    await prisma.person.upsert({
      where: {
        id: person.id,
      },
      update: {},
      create: {
        id: person.id,
        tenantId: tenant.id,
        fullName: person.fullName,
        document: person.document,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
