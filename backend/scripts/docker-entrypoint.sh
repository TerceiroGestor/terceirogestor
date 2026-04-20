#!/bin/sh
set -eu

if [ "${RUN_DB_PRESTART:-false}" = "true" ]; then
  echo "[docker-entrypoint] ensuring database exists"
  node scripts/ensure-database.js

  if find prisma/migrations -mindepth 1 -maxdepth 1 -type d | grep -q .; then
    echo "[docker-entrypoint] applying prisma migrations"
    npx prisma migrate deploy
  else
    echo "[docker-entrypoint] no prisma migrations found, syncing schema with db push"
    npx prisma db push
  fi
fi

echo "[docker-entrypoint] starting backend on port ${PORT:-8080}"
exec node dist/main