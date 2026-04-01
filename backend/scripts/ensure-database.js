const mariadb = require("mariadb");
const { loadRootEnv } = require("./env-file");

async function ensureDatabase(databaseUrl) {
  const url = new URL(databaseUrl);
  const dbName = url.pathname.replace(/^\//, "");
  if (!dbName) throw new Error("DATABASE_URL must include a database name");

  const connection = await mariadb.createConnection({
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: "mysql",
  });

  try {
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    );
  } finally {
    await connection.end();
  }

  console.log(`[ensure-db] Ensured database: ${dbName}`);
}

async function main() {
  loadRootEnv();
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }
  await ensureDatabase(databaseUrl);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
