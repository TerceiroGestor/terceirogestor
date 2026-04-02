const crypto = require('crypto');
const { loadRootEnv, readEnvFileValue } = require('./env-file');
const { createPrismaClientFromEnv } = require('./prisma-runtime');

function parseMasterKey(raw) {
  const trimmed = String(raw || '').trim();
  if (!trimmed) throw new Error('PII_MASTER_KEY is not set.');
  const bytes = Buffer.from(trimmed, 'base64');
  if (bytes.length < 32) {
    throw new Error('PII_MASTER_KEY must be at least 32 bytes (base64).');
  }
  return bytes;
}

function deriveTenantKey(masterKey, tenantId) {
  const salt = Buffer.from(String(tenantId), 'utf8');
  const info = Buffer.from('terceirogestor:pii:v1', 'utf8');
  return crypto.hkdfSync('sha256', masterKey, salt, info, 32);
}

function encryptJson(key, payload) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const input = Buffer.from(JSON.stringify(payload), 'utf8');
  const dataEnc = Buffer.concat([cipher.update(input), cipher.final()]);
  const tag = cipher.getAuthTag();
  return { dataEnc, iv, tag };
}

function digitsOrNull(value, expectedLen) {
  const trimmed = String(value || '').trim();
  if (!trimmed) return null;
  const digits = trimmed.replace(/\D/g, '');
  if (!digits) return null;
  if (expectedLen && digits.length !== expectedLen) return null;
  return digits;
}

async function main() {
  loadRootEnv();

  const masterKeyRaw =
    process.env.PII_MASTER_KEY || readEnvFileValue('PII_MASTER_KEY');
  const masterKey = parseMasterKey(masterKeyRaw);
  const prisma = createPrismaClientFromEnv();

  let migrated = 0;
  const startedAt = Date.now();

  try {
    const people = await prisma.person.findMany({
      where: {
        OR: [
          { document: { not: null } },
          { rg: { not: null } },
          { nis: { not: null } },
        ],
      },
      select: { id: true, tenantId: true, document: true, rg: true, nis: true },
    });

    // eslint-disable-next-line no-console
    console.log(`[pii-backfill] Found ${people.length} person(s) with legacy docs.`);

    for (const person of people) {
      const payload = {
        cpf: digitsOrNull(person.document, 11),
        rg: person.rg ? String(person.rg).trim() : null,
        nis: digitsOrNull(person.nis, 11),
        cns: null,
      };

      const key = deriveTenantKey(masterKey, person.tenantId);
      const encrypted = encryptJson(key, payload);

      await prisma.$transaction([
        prisma.personSensitiveDocument.upsert({
          where: { personId: person.id },
          create: {
            tenantId: person.tenantId,
            personId: person.id,
            schemaVersion: 1,
            dataEnc: encrypted.dataEnc,
            iv: encrypted.iv,
            tag: encrypted.tag,
          },
          update: {
            schemaVersion: 1,
            dataEnc: encrypted.dataEnc,
            iv: encrypted.iv,
            tag: encrypted.tag,
          },
        }),
        prisma.person.update({
          where: { id: person.id },
          data: { document: null, rg: null, nis: null },
        }),
      ]);

      migrated += 1;
    }

    const elapsedMs = Date.now() - startedAt;
    // eslint-disable-next-line no-console
    console.log(`[pii-backfill] Done. migrated=${migrated} elapsed=${elapsedMs}ms`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[pii-backfill] Failed:', err);
  process.exitCode = 1;
});
