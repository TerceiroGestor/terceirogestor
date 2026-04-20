const path = require('path');
const { PrismaPg } = require('@prisma/adapter-pg');
const { loadRootEnv, readEnvFileValue } = require('./env-file');

function parseDatabaseUrl(databaseUrl) {
  let url;
  try {
    url = new URL(databaseUrl);
  } catch {
    throw new Error('DATABASE_URL is not a valid URL');
  }

  if (!['postgres:', 'postgresql:'].includes(url.protocol)) {
    throw new Error(
      'DATABASE_URL must start with postgresql:// or postgres://',
    );
  }

  const database = url.pathname.replace(/^\//, '');
  if (!database) {
    throw new Error('DATABASE_URL must include a database name');
  }

  return {
    connectionString: databaseUrl,
    database,
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
  const adapter = new PrismaPg(parseDatabaseUrl(databaseUrl));
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { PrismaClient } = require(
    path.join(__dirname, '..', 'src/generated/prisma'),
  );
  return new PrismaClient({ adapter });
}

module.exports = {
  createPrismaClientFromEnv,
  getDatabaseUrlFromEnv,
  parseDatabaseUrl,
};
