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

function getDatabaseUrlFromEnv() {
  loadRootEnv();

  const databaseUrl =
    process.env.DATABASE_URL || readEnvFileValue('DATABASE_URL');
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set (env or .env file).');
  }

  return databaseUrl;
}

function createPrismaClientFromEnv() {
  const databaseUrl = getDatabaseUrlFromEnv();
  const adapter = new PrismaMariaDb(parseDatabaseUrl(databaseUrl));
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { PrismaClient } = require(path.join(
    __dirname,
    '..',
    'src/generated/prisma',
  ));
  return new PrismaClient({ adapter });
}

module.exports = {
  createPrismaClientFromEnv,
  getDatabaseUrlFromEnv,
  parseDatabaseUrl,
};
