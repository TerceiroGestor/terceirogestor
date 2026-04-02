const { createPrismaClientFromEnv } = require('./prisma-runtime');

const NEW_PERMISSIONS = [
  { key: 'people.sensitive.read', description: 'Ler documentos sensiveis (LGPD)' },
  { key: 'people.sensitive.update', description: 'Atualizar documentos sensiveis (LGPD)' },
  { key: 'deposit.read', description: 'Read deposit' },
  { key: 'deposit.create', description: 'Create deposit' },
  { key: 'deposit.update', description: 'Update deposit' },
  { key: 'deposit.delete', description: 'Delete deposit' },
];

const ROLE_PERMISSION_MAP = [
  {
    roleNames: ['Admin', 'Administrador'],
    permissionKeys: NEW_PERMISSIONS.map((permission) => permission.key),
  },
  {
    roleNames: ['Gestor'],
    permissionKeys: ['deposit.read'],
  },
  {
    roleNames: ['Leitor'],
    permissionKeys: ['deposit.read'],
  },
];

async function main() {
  const prisma = createPrismaClientFromEnv();

  try {
    for (const permission of NEW_PERMISSIONS) {
      await prisma.permission.upsert({
        where: { key: permission.key },
        create: permission,
        update: { description: permission.description },
      });
    }

    const permissionRows = await prisma.permission.findMany({
      where: { key: { in: NEW_PERMISSIONS.map((p) => p.key) } },
      select: { id: true, key: true },
    });
    const permissionIdByKey = new Map(permissionRows.map((p) => [p.key, p.id]));

    const roles = await prisma.role.findMany({
      where: {
        name: {
          in: Array.from(
            new Set(ROLE_PERMISSION_MAP.flatMap((entry) => entry.roleNames)),
          ),
        },
      },
      select: { id: true, tenantId: true, name: true },
    });

    let created = 0;
    for (const role of roles) {
      const roleConfig = ROLE_PERMISSION_MAP.find((entry) =>
        entry.roleNames.includes(role.name),
      );
      if (!roleConfig) continue;

      const data = roleConfig.permissionKeys
        .map((key) => ({
          tenantId: role.tenantId,
          roleId: role.id,
          permissionId: permissionIdByKey.get(key),
        }))
        .filter((row) => row.permissionId);

      if (!data.length) continue;

      const result = await prisma.rolePermission.createMany({
        data,
        skipDuplicates: true,
      });
      created += result.count || 0;
    }

    // eslint-disable-next-line no-console
    console.log(`[permissions-backfill] Done. rolePermissionsCreated=${created}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[permissions-backfill] Failed:', err);
  process.exitCode = 1;
});
