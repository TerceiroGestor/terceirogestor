import { PrismaMariaDb } from '@prisma/adapter-mariadb';

type AdapterInput = {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  allowPublicKeyRetrieval?: boolean;
  cachingRsaPublicKey?: string;
};

function parseDatabaseUrl(databaseUrl: string): AdapterInput {
  let url: URL;
  try {
    url = new URL(databaseUrl);
  } catch (error) {
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

export function createPrismaAdapter(databaseUrl: string) {
  const config = parseDatabaseUrl(databaseUrl);
  return new PrismaMariaDb(config);
}
