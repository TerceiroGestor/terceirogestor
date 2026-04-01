const path = require('path');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');
const { loadRootEnv, readEnvFileValue } = require('./env-file');

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

  const allowPublicKeyRetrievalParam = url.searchParams.get(
    'allowPublicKeyRetrieval',
  );
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

function resolveSortExpiry(expiryDate) {
  if (!expiryDate) return Number.MAX_SAFE_INTEGER;
  const date = new Date(expiryDate);
  const value = date.getTime();
  return Number.isNaN(value) ? Number.MAX_SAFE_INTEGER : value;
}

async function main() {
  loadRootEnv();

  const databaseUrl =
    process.env.DATABASE_URL || readEnvFileValue('DATABASE_URL');
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set (env or .env file).');
  }

  const adapter = new PrismaMariaDb(parseDatabaseUrl(databaseUrl));

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { PrismaClient } = require(path.join(__dirname, '..', 'src/generated/prisma'));
  const prisma = new PrismaClient({ adapter });

  const startedAt = Date.now();
  let createdAllocations = 0;
  let processedExits = 0;

  try {
    const exits = await prisma.pantryExit.findMany({
      where: { allocations: { none: {} } },
      orderBy: [
        { tenantId: 'asc' },
        { itemId: 'asc' },
        { sector: 'asc' },
        { exitDate: 'asc' },
      ],
      select: {
        id: true,
        tenantId: true,
        itemId: true,
        sector: true,
        quantity: true,
        exitDate: true,
      },
    });

    if (!exits.length) {
      // eslint-disable-next-line no-console
      console.log('[pantry-backfill] No exits to backfill.');
      return;
    }

    // eslint-disable-next-line no-console
    console.log(`[pantry-backfill] Found ${exits.length} exit(s) without allocations.`);

    const groups = new Map();
    for (const exit of exits) {
      const key = `${exit.tenantId}::${exit.itemId}::${exit.sector}`;
      const current = groups.get(key) || [];
      current.push(exit);
      groups.set(key, current);
    }

    for (const [key, groupExits] of groups.entries()) {
      const [tenantId, itemId, sector] = key.split('::');

      const entries = await prisma.pantryEntry.findMany({
        where: { tenantId, itemId, sector },
        select: {
          id: true,
          quantity: true,
          entryDate: true,
          expiryDate: true,
        },
        orderBy: [{ entryDate: 'asc' }],
      });

      if (!entries.length) {
        throw new Error(
          `[pantry-backfill] No entries found for group ${key}, but exits exist.`,
        );
      }

      const entryIds = entries.map((e) => e.id);
      const allocationGroups = await prisma.pantryExitAllocation.groupBy({
        by: ['entryId'],
        where: { tenantId, entryId: { in: entryIds } },
        _sum: { quantity: true },
      });

      const allocatedByEntry = new Map(
        allocationGroups.map((g) => [g.entryId, Number(g._sum.quantity ?? 0)]),
      );

      const sortedEntries = [...entries].sort((a, b) => {
        const aExpiry = resolveSortExpiry(a.expiryDate);
        const bExpiry = resolveSortExpiry(b.expiryDate);
        if (aExpiry !== bExpiry) return aExpiry - bExpiry;
        return new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime();
      });

      for (const exit of groupExits) {
        let remainingToAllocate = Number(exit.quantity);
        const allocations = [];

        for (const entry of sortedEntries) {
          if (remainingToAllocate <= 0) break;
          const allocated = allocatedByEntry.get(entry.id) || 0;
          const available = Number(entry.quantity) - allocated;
          if (available <= 0) continue;

          const qty = Math.min(available, remainingToAllocate);
          if (qty <= 0) continue;

          allocations.push({ entryId: entry.id, quantity: qty });
          allocatedByEntry.set(entry.id, allocated + qty);
          remainingToAllocate -= qty;
        }

        if (remainingToAllocate > 0) {
          throw new Error(
            `[pantry-backfill] Insufficient stock to backfill exit ${exit.id} in group ${key}. Remaining: ${remainingToAllocate}`,
          );
        }

        if (allocations.length) {
          await prisma.pantryExitAllocation.createMany({
            data: allocations.map((allocation) => ({
              tenantId,
              exitId: exit.id,
              entryId: allocation.entryId,
              quantity: allocation.quantity,
            })),
          });
          createdAllocations += allocations.length;
        }

        processedExits += 1;
      }
    }

    const elapsedMs = Date.now() - startedAt;
    // eslint-disable-next-line no-console
    console.log(
      `[pantry-backfill] Done. exits=${processedExits} allocations=${createdAllocations} elapsed=${elapsedMs}ms`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
