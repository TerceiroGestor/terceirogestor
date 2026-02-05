import { PrismaMySQL } from '@prisma/adapter-mysql';
import * as bcrypt from 'bcrypt';
import mysql from 'mysql2/promise';
import { PrismaClient } from '../generated/prisma/client';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set');
}

const pool = mysql.createPool(databaseUrl);
const adapter = new PrismaMySQL(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { name: 'Instituicao Exemplo' },
    update: {},
    create: { name: 'Instituicao Exemplo' },
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
    { fullName: 'Ana Pereira', document: '111.222.333-44' },
    { fullName: 'Carlos Souza', document: '222.333.444-55' },
    { fullName: 'Marina Lima', document: '333.444.555-66' },
  ];

  for (const person of people) {
    await prisma.person.upsert({
      where: {
        id: `${tenant.id}-${person.document ?? person.fullName}`,
      },
      update: {},
      create: {
        id: `${tenant.id}-${person.document ?? person.fullName}`,
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
