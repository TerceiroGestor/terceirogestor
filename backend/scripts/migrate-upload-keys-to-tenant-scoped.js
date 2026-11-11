// One-time migration for docs/auditoria-riscos.md item 3.2 ("reorganizar a
// chave física do arquivo para tenantId/modulo/uuid"): moves every
// existing upload from the flat <category>/<filename> layout into
// <category>/<tenantId>/<filename>, and rewrites every DB field that
// stores one of these paths to match. Safe to re-run: an already-migrated
// value (its remainder after the category prefix contains a "/") is
// skipped, so running this twice is a no-op the second time.
//
// Does not touch AuditLog.before/after - those are historical snapshots,
// not live references the app serves through /uploads today, and
// rewriting audit history is a bigger (and separate) decision than a
// storage-layout migration.
//
// Files not referenced by any DB row (already-orphaned attachments - see
// docs/backlog.md) are left at their old path; nothing will serve them at
// the new layout, but nothing served them reliably before either.
const fs = require('fs');
const path = require('path');
const { createPrismaClientFromEnv } = require('./prisma-runtime');

const UPLOAD_ROOT = path.join(process.cwd(), 'uploads');

// { model: Prisma client property, field, category }. Mirrors the
// categories in src/core/files/upload-paths.ts and every model/field in
// schema.prisma that stores one of these paths (grep: `Url$|Path$`).
const FIELD_MIGRATIONS = [
  { model: 'user', field: 'avatarUrl', category: 'avatars' },
  { model: 'person', field: 'avatarUrl', category: 'avatars' },
  { model: 'pantryDonor', field: 'avatarUrl', category: 'avatars' },
  { model: 'depositDonor', field: 'avatarUrl', category: 'avatars' },
  {
    model: 'personHealthCondition',
    field: 'documentUrl',
    category: 'health',
  },
  { model: 'personMedication', field: 'documentUrl', category: 'health' },
  {
    model: 'personMedication',
    field: 'permissionDocumentUrl',
    category: 'health',
  },
  // Tenant has no separate tenantId column - the row IS the tenant.
  { model: 'tenant', field: 'logoUrl', category: 'tenants', ownIdIsTenantId: true },
  { model: 'personAttachment', field: 'filePath', category: 'people' },
  { model: 'personRecordAttachment', field: 'filePath', category: 'people' },
  { model: 'programAttachment', field: 'filePath', category: 'programs' },
  { model: 'projectAttachment', field: 'filePath', category: 'projects' },
  {
    model: 'projectActionAttachment',
    field: 'filePath',
    category: 'action-attachments',
  },
  { model: 'pantryItemAttachment', field: 'filePath', category: 'pantry' },
  { model: 'pantryDonorAttachment', field: 'filePath', category: 'pantry' },
  { model: 'pantryEntryAttachment', field: 'filePath', category: 'pantry' },
  { model: 'pantryExitAttachment', field: 'filePath', category: 'pantry' },
  { model: 'depositItemAttachment', field: 'filePath', category: 'deposit' },
  { model: 'depositDonorAttachment', field: 'filePath', category: 'deposit' },
  { model: 'depositEntryAttachment', field: 'filePath', category: 'deposit' },
  { model: 'depositExitAttachment', field: 'filePath', category: 'deposit' },
  { model: 'taskOrganizerAttachment', field: 'filePath', category: 'tasks' },
];

function parseOldPathFilename(value, category) {
  const prefix = `/uploads/${category}/`;
  if (typeof value !== 'string' || !value.startsWith(prefix)) return null;
  const rest = value.slice(prefix.length);
  // Already migrated (`<tenantId>/<filename>`) or empty - nothing to do.
  if (!rest || rest.includes('/')) return null;
  return rest;
}

function moveIfPresent(category, filename, tenantId) {
  const oldPath = path.join(UPLOAD_ROOT, category, filename);
  const newDir = path.join(UPLOAD_ROOT, category, tenantId);
  const newPath = path.join(newDir, filename);

  if (fs.existsSync(oldPath)) {
    fs.mkdirSync(newDir, { recursive: true });
    fs.renameSync(oldPath, newPath);
    return true;
  }
  if (fs.existsSync(newPath)) {
    return true; // already moved by a previous (interrupted) run
  }
  return false;
}

async function migrateField(prisma, { model, field, category, ownIdIsTenantId }) {
  const client = prisma[model];
  const rows = await client.findMany({
    select: ownIdIsTenantId
      ? { id: true, [field]: true }
      : { id: true, tenantId: true, [field]: true },
  });

  let migrated = 0;
  let missingOnDisk = 0;

  for (const row of rows) {
    const filename = parseOldPathFilename(row[field], category);
    if (!filename) continue;

    const tenantId = ownIdIsTenantId ? row.id : row.tenantId;
    const foundOnDisk = moveIfPresent(category, filename, tenantId);
    if (!foundOnDisk) {
      missingOnDisk++;
      console.warn(
        `[migrate-upload-keys] ${model}.${field} id=${row.id}: arquivo nao encontrado em uploads/${category}/${filename} - atualizando so o caminho no banco.`,
      );
    }

    await client.update({
      where: { id: row.id },
      data: { [field]: `/uploads/${category}/${tenantId}/${filename}` },
    });
    migrated++;
  }

  if (migrated > 0 || rows.length > 0) {
    console.log(
      `[migrate-upload-keys] ${model}.${field}: migrated=${migrated} missingOnDisk=${missingOnDisk} totalRows=${rows.length}`,
    );
  }
}

// ProjectAction.photoPaths is a Json array of paths, not a single String
// field - handled separately from FIELD_MIGRATIONS.
async function migrateProjectActionPhotoPaths(prisma) {
  const rows = await prisma.projectAction.findMany({
    where: { photoPaths: { not: null } },
    select: { id: true, tenantId: true, photoPaths: true },
  });

  let migrated = 0;
  for (const row of rows) {
    const paths = Array.isArray(row.photoPaths) ? row.photoPaths : [];
    let changed = false;

    const nextPaths = paths.map((value) => {
      const filename = parseOldPathFilename(value, 'actions');
      if (!filename) return value;
      changed = true;
      moveIfPresent('actions', filename, row.tenantId);
      return `/uploads/actions/${row.tenantId}/${filename}`;
    });

    if (changed) {
      await prisma.projectAction.update({
        where: { id: row.id },
        data: { photoPaths: nextPaths },
      });
      migrated++;
    }
  }

  if (migrated > 0 || rows.length > 0) {
    console.log(
      `[migrate-upload-keys] projectAction.photoPaths: migrated=${migrated} totalRows=${rows.length}`,
    );
  }
}

async function main() {
  const prisma = createPrismaClientFromEnv();
  try {
    for (const entry of FIELD_MIGRATIONS) {
      await migrateField(prisma, entry);
    }
    await migrateProjectActionPhotoPaths(prisma);
    console.log('[migrate-upload-keys] Done.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('[migrate-upload-keys] Failed:', err);
  process.exitCode = 1;
});
