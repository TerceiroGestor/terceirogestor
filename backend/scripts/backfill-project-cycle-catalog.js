const fs = require('fs');
const path = require('path');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');

function readEnvFileValue(key) {
  try {
    const envPath = path.join(process.cwd(), '.env');
    const content = fs.readFileSync(envPath, 'utf8');
    const line = content
      .split(/\r?\n/)
      .map((l) => l.trim())
      .find((l) => l && !l.startsWith('#') && l.startsWith(`${key}=`));
    if (!line) return null;
    return line.slice(key.length + 1).trim().replace(/^"|"$/g, '');
  } catch {
    return null;
  }
}

function parseDatabaseUrl(databaseUrl) {
  let url;
  try {
    url = new URL(databaseUrl);
  } catch {
    throw new Error('DATABASE_URL is not a valid URL');
  }

  if (url.protocol !== 'mysql:') {
    throw new Error('DATABASE_URL must start with mysql://');
  }

  const database = url.pathname.replace(/^\//, '');
  if (!database) {
    throw new Error('DATABASE_URL must include a database name');
  }

  const allowPublicKeyRetrievalParam = url.searchParams.get('allowPublicKeyRetrieval');
  const allowPublicKeyRetrieval =
    allowPublicKeyRetrievalParam !== null
      ? allowPublicKeyRetrievalParam === 'true'
      : ['localhost', '127.0.0.1'].includes(url.hostname);
  const cachingRsaPublicKey = url.searchParams.get('cachingRsaPublicKey');

  return {
    host: url.hostname,
    port: url.port ? Number(url.port) : 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database,
    allowPublicKeyRetrieval,
    ...(cachingRsaPublicKey ? { cachingRsaPublicKey } : {}),
  };
}

function normalizeCycleName(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const databaseUrl = process.env.DATABASE_URL || readEnvFileValue('DATABASE_URL');
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set (env or .env file).');
  }

  const adapter = new PrismaMariaDb(parseDatabaseUrl(databaseUrl));
  const { PrismaClient } = require(path.join(process.cwd(), 'src/generated/prisma'));
  const prisma = new PrismaClient({ adapter });

  try {
    const projectCycles = await prisma.projectCycle.findMany({
      where: { catalogCycleId: null },
      orderBy: [{ tenantId: 'asc' }, { name: 'asc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        tenantId: true,
        name: true,
      },
    });

    const tenantIds = Array.from(new Set(projectCycles.map((item) => item.tenantId)));
    const existingCycles = await prisma.cycle.findMany({
      where: { tenantId: { in: tenantIds } },
      select: { id: true, tenantId: true, name: true },
      orderBy: [{ tenantId: 'asc' }, { name: 'asc' }],
    });

    const catalogByTenantAndName = new Map();
    for (const cycle of existingCycles) {
      catalogByTenantAndName.set(
        `${cycle.tenantId}:${normalizeCycleName(cycle.name)}`,
        cycle,
      );
    }

    let createdCatalogs = 0;
    let linkedProjectCycles = 0;
    let skippedBlankNames = 0;

    for (const projectCycle of projectCycles) {
      const normalizedName = normalizeCycleName(projectCycle.name);
      if (!normalizedName) {
        skippedBlankNames += 1;
        continue;
      }

      const key = `${projectCycle.tenantId}:${normalizedName}`;
      let catalogCycle = catalogByTenantAndName.get(key) || null;

      if (!catalogCycle) {
        if (!dryRun) {
          catalogCycle = await prisma.cycle.create({
            data: {
              tenantId: projectCycle.tenantId,
              name: projectCycle.name.trim(),
              isActive: true,
            },
            select: { id: true, tenantId: true, name: true },
          });
        } else {
          catalogCycle = {
            id: `dry-run:${createdCatalogs + 1}`,
            tenantId: projectCycle.tenantId,
            name: projectCycle.name.trim(),
          };
        }
        catalogByTenantAndName.set(key, catalogCycle);
        createdCatalogs += 1;
      }

      if (!dryRun) {
        await prisma.projectCycle.update({
          where: { id: projectCycle.id },
          data: { catalogCycleId: catalogCycle.id },
        });
      }

      linkedProjectCycles += 1;
    }

    // eslint-disable-next-line no-console
    console.log(
      JSON.stringify(
        {
          dryRun,
          totalProjectCyclesWithoutCatalog: projectCycles.length,
          createdCatalogs,
          linkedProjectCycles,
          skippedBlankNames,
        },
        null,
        2,
      ),
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[project-cycle-catalog-backfill] Failed:', err);
  process.exitCode = 1;
});
