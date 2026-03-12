  GNU nano 7.2                                                      scripts/update.sh
#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "== TerceiroGestor update =="

SKIP_SEED="${SKIP_SEED:-0}"
if [[ "${1:-}" == "--skip-seed" ]]; then
  SKIP_SEED="1"
fi

wait_for_mysql() {
  local container="mysql-terceirogestor"
  local max_attempts=60
  local sleep_seconds=2

  echo "Waiting for MySQL to be healthy..."
  for ((i=1; i<=max_attempts; i++)); do
    if ! docker inspect "$container" >/dev/null 2>&1; then
      echo "  - MySQL container not found yet (attempt $i/$max_attempts)"
      sleep "$sleep_seconds"
      continue
    fi

    local status
    status="$(docker inspect -f '{{.State.Health.Status}}' "$container" 2>/dev/null || true)"
    if [[ "$status" == "healthy" ]]; then
      echo "  - MySQL is healthy"
      return 0
    fi
    echo "  - MySQL status: ${status:-unknown} (attempt $i/$max_attempts)"
    sleep "$sleep_seconds"
  done

  echo "MySQL did not become healthy in time."
  return 1
}

echo "[1/7] git pull"
git pull --ff-only

echo "[2/7] ensure mysql up"
docker compose up -d mysql
wait_for_mysql

echo "[3/7] build images"
docker compose build --pull backend frontend

echo "[4/7] apply migrations (inside container)"
docker compose run --rm --no-deps backend npm run db:migrate:deploy

if [[ "$SKIP_SEED" != "1" ]]; then
  echo "[5/7] seed database (inside container)"
  docker compose run --rm --no-deps backend npm run db:seed
else
  echo "[5/7] seed database (skipped)"
fi

echo "[6/7] recreate containers"
docker compose up -d --force-recreate backend frontend

echo "[7/7] status"
docker compose ps
