const { createPrismaClientFromEnv } = require('./prisma-runtime');

// Attendance pre-dates the Encontro (ActionOccurrence) model (Fase 1 do
// plano SCFV): every row that exists today was recorded against the whole
// Atividade, not a specific date. For each affected action, this creates
// exactly one synthetic ActionOccurrence standing in for "the one and only
// encontro this attendance was ever about" and points the orphaned rows at
// it. Idempotent: the query that finds orphaned rows is the only thing that
// drives work, so a second run finds nothing left to do.
function resolveOccurrenceMoment(action) {
  if (action.executedStartAt) {
    return { start: action.executedStartAt, end: action.executedEndAt };
  }
  if (action.plannedStartAt) {
    return { start: action.plannedStartAt, end: action.plannedEndAt };
  }
  return { start: action.createdAt, end: null };
}

async function main() {
  const prisma = createPrismaClientFromEnv();

  let actionsBackfilled = 0;
  let attendancesUpdated = 0;
  let actionsSkipped = 0;

  try {
    // Raw query on purpose: this script's whole reason to exist is the
    // transitional window where occurrenceId is still nullable in the
    // database (between the "add column" and "make it NOT NULL" migrations
    // - see PLAN.md Fase 3). The generated Prisma Client reflects whatever
    // schema.prisma declares *today*, which by the time this ships is
    // already the final (required) shape, so the typed client no longer
    // allows filtering by occurrenceId = null at all. Going straight to SQL
    // keeps the script usable for its one real purpose - running it against
    // some other database that still has pre-Fase-3 data and hasn't taken
    // the second migration yet.
    const orphaned = await prisma.$queryRaw`
      SELECT DISTINCT "actionId" FROM "ProjectActionAttendance" WHERE "occurrenceId" IS NULL
    `;

    if (!orphaned.length) {
      // eslint-disable-next-line no-console
      console.log('[action-occurrences-backfill] Nothing to backfill.');
      return;
    }

    // eslint-disable-next-line no-console
    console.log(
      `[action-occurrences-backfill] Found ${orphaned.length} action(s) with orphaned attendance.`,
    );

    for (const { actionId } of orphaned) {
      const existingOccurrenceCount = await prisma.actionOccurrence.count({
        where: { actionId },
      });
      if (existingOccurrenceCount > 0) {
        // The plan only covers the simple case (no encontro yet). An action
        // that already has real encontros but also has attendance with no
        // occurrenceId is an inconsistent state that needs a human decision
        // (which encontro owns it?), not a blind backfill.
        // eslint-disable-next-line no-console
        console.warn(
          `[action-occurrences-backfill] Skipping action ${actionId}: already has ${existingOccurrenceCount} encontro(s) but also has attendance without occurrenceId.`,
        );
        actionsSkipped += 1;
        continue;
      }

      const action = await prisma.projectAction.findUnique({
        where: { id: actionId },
        select: {
          id: true,
          tenantId: true,
          executedStartAt: true,
          executedEndAt: true,
          plannedStartAt: true,
          plannedEndAt: true,
          createdAt: true,
        },
      });
      if (!action) {
        // eslint-disable-next-line no-console
        console.warn(
          `[action-occurrences-backfill] Skipping action ${actionId}: action no longer exists.`,
        );
        actionsSkipped += 1;
        continue;
      }

      const { start, end } = resolveOccurrenceMoment(action);
      const scheduledDate = new Date(
        Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()),
      );

      const occurrence = await prisma.actionOccurrence.create({
        data: {
          tenantId: action.tenantId,
          actionId: action.id,
          scheduledDate,
          startTime: start,
          endTime: end,
          status: 'DONE',
          notes: 'Encontro gerado automaticamente (migração da Fase 3 do SCFV) a partir de presença registrada antes do modelo de Encontro existir.',
        },
      });

      // No occurrenceId filter here: we already confirmed above this
      // action has zero encontros, so every one of its attendance rows is
      // necessarily orphaned - and that filter has the same "null no
      // longer typechecks" problem as the query above.
      const { count } = await prisma.projectActionAttendance.updateMany({
        where: { actionId },
        data: { occurrenceId: occurrence.id },
      });

      attendancesUpdated += count;
      actionsBackfilled += 1;
    }

    // eslint-disable-next-line no-console
    console.log(
      `[action-occurrences-backfill] Done. actions=${actionsBackfilled} attendances=${attendancesUpdated} skipped=${actionsSkipped}`,
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
