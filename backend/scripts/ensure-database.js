const { Client } = require('pg');
const { loadRootEnv } = require('./env-file');

async function ensureDatabase(databaseUrl) {
  const url = new URL(databaseUrl);
  const dbName = url.pathname.replace(/^\//, '');
  if (!dbName) throw new Error('DATABASE_URL must include a database name');

  // Connect to default postgres database to create new database
  const client = new Client({
    host: url.hostname,
    port: Number(url.port || 5432),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: 'postgres', // Connect to system database
  });

  try {
    await client.connect();

    // Check if database exists and create if not
    const result = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [dbName],
    );

    if (result.rows.length === 0) {
      await client.query(`CREATE DATABASE "${dbName}"`);
      console.log(`[ensure-db] Created database: ${dbName}`);
    } else {
      console.log(`[ensure-db] Database already exists: ${dbName}`);
    }
  } finally {
    await client.end();
  }

  console.log(`[ensure-db] Ensured database: ${dbName}`);
}

async function main() {
  loadRootEnv();
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set');
  }
  await ensureDatabase(databaseUrl);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
