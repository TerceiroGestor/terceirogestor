  GNU nano 7.2                                                      scripts/update.sh
#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "== TerceiroGestor update =="

echo "[1/6] git pull"
git pull --ff-only

echo "[2/6] ensure mysql up"
docker compose up -d mysql

echo "[3/6] build images"
docker compose build --pull backend frontend

echo "[4/6] apply migrations (inside container)"
docker compose run --rm --no-deps backend npm run db:migrate:deploy

echo "[5/6] seed database (inside container)"
docker compose run --rm --no-deps backend npm run db:seed

echo "[6/6] recreate containers"
docker compose up -d --force-recreate backend frontend

echo "[7/7] status"
docker compose ps
