#!/bin/sh
set -eu

if [ "${RUN_DB_PRESTART:-false}" = "true" ]; then
  echo "[docker-entrypoint] ensuring database exists"
  node scripts/ensure-database.js

  echo "[docker-entrypoint] applying prisma migrations"
  npx prisma migrate deploy
fi

echo "[docker-entrypoint] starting backend on port ${PORT:-8080}"
exec node dist/main