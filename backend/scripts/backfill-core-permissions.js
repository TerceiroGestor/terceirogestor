const fs = require('fs');
const path = require('path');
const { createPrismaClientFromEnv } = require('./prisma-runtime');

function loadCorePermissionsModule() {
  const distCandidates = [
    path.join(
      __dirname,
      '..',
      'dist',
      'modules',
      'permissions',
      'core-permissions.js',
    ),
    path.join(
      __dirname,
      '..',
      'dist',
      'src',
      'modules',
      'permissions',
      'core-permissions.js',
    ),
  ];

  for (const candidate of distCandidates) {
    if (fs.existsSync(candidate)) {
      return require(candidate);
    }
  }

  try {
    require('ts-node/register/transpile-only');
    const sourceCandidate = path.join(
      __dirname,
      '..',
      'src',
      'modules',
      'permissions',
      'core-permissions.ts',
    );
    if (fs.existsSync(sourceCandidate)) {
      return require(sourceCandidate);
    }
  } catch {
    // Ignore and fall through to the explicit error below.
  }

  throw new Error(
    'Nao foi possivel carregar o catalogo de permissoes. Execute o build do backend antes do backfill.',
  );
}

const {
  CORE_PERMISSIONS,
  CORE_ROLE_PERMISSION_TEMPLATES,
} = loadCorePermissionsModule();

async function main() {
  const prisma = createPrismaClientFromEnv();

  try {
    for (const permission of CORE_PERMISSIONS) {
      await prisma.permission.upsert({
        where: { key: permission.key },
        create: permission,
        update: { description: permission.description },
      });
    }

    const permissionRows = await prisma.permission.findMany({
      where: { key: { in: CORE_PERMISSIONS.map((permission) => permission.key) } },
      select: { id: true, key: true },
    });
    const permissionIdByKey = new Map(permissionRows.map((p) => [p.key, p.id]));

    const roles = await prisma.role.findMany({
      where: {
        name: {
          in: Array.from(
            new Set(
              CORE_ROLE_PERMISSION_TEMPLATES.flatMap((entry) => entry.roleNames),
            ),
          ),
        },
      },
      select: { id: true, tenantId: true, name: true },
    });

    let created = 0;
    for (const role of roles) {
      const roleConfig = CORE_ROLE_PERMISSION_TEMPLATES.find((entry) =>
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
    console.log(
      `[permissions-backfill] Done. permissionsSynced=${CORE_PERMISSIONS.length} rolePermissionsCreated=${created}`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[permissions-backfill] Failed:', err);
  process.exitCode = 1;
});
