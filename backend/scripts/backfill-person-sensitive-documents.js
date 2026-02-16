const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
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
  const databaseUrl =
    process.env.DATABASE_URL || readEnvFileValue('DATABASE_URL');
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set (env or .env file).');
  }

  const masterKeyRaw =
    process.env.PII_MASTER_KEY || readEnvFileValue('PII_MASTER_KEY');
  const masterKey = parseMasterKey(masterKeyRaw);

  const adapter = new PrismaMariaDb(parseDatabaseUrl(databaseUrl));
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { PrismaClient } = require(path.join(process.cwd(), 'src/generated/prisma'));
  const prisma = new PrismaClient({ adapter });

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

