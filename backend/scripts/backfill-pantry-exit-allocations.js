const { createPrismaClientFromEnv } = require('./prisma-runtime');

function resolveSortExpiry(expiryDate) {
  if (!expiryDate) return Number.MAX_SAFE_INTEGER;
  const date = new Date(expiryDate);
  const value = date.getTime();
  return Number.isNaN(value) ? Number.MAX_SAFE_INTEGER : value;
}

async function main() {
  const prisma = createPrismaClientFromEnv();

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
