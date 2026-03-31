#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "== system_development update =="

SKIP_SEED="${SKIP_SEED:-0}"
if [[ "${1:-}" == "--skip-seed" ]]; then
  SKIP_SEED="1"
fi

prepare_backend_env_file() {
  local source_file="backend/.env"
  local target_file="backend/.env.docker"

  if [[ ! -f "$source_file" ]]; then
    return 0
  fi

  : > "$target_file"

  while IFS= read -r line || [[ -n "$line" ]]; do
    if [[ -z "${line// }" || "$line" =~ ^[[:space:]]*# || "$line" != *=* ]]; then
      printf '%s\n' "$line" >> "$target_file"
      continue
    fi

    local key="${line%%=*}"
    local value="${line#*=}"

    if [[ ${#value} -ge 2 ]]; then
      if [[ "$value" == \"*\" && "$value" == *\" ]]; then
        value="${value:1:${#value}-2}"
      elif [[ "$value" == \'*\' && "$value" == *\' ]]; then
        value="${value:1:${#value}-2}"
      fi
    fi

    if [[ "$value" == *"'"* ]]; then
      printf '%s=%s\n' "$key" "$value" >> "$target_file"
      continue
    fi

    printf "%s='%s'\n" "$key" "$value" >> "$target_file"
  done < "$source_file"

  export BACKEND_ENV_FILE="./backend/.env.docker"
}

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

prepare_backend_env_file

echo "[1/8] git pull"
git pull --ff-only

echo "[2/8] ensure mysql up"
docker compose up -d mysql backup
wait_for_mysql

echo "[3/8] build images"
docker compose build --pull backend frontend

echo "[4/8] apply migrations (inside container)"
docker compose run --rm --no-deps backend npm run db:migrate:deploy

if [[ "$SKIP_SEED" != "1" ]]; then
  echo "[5/8] seed database (inside container)"
  docker compose run --rm --no-deps backend npm run db:seed
else
  echo "[5/8] seed database (skipped)"
fi

echo "[6/8] backfill core permissions"
docker compose run --rm --no-deps backend npm run permissions:backfill

echo "[7/8] recreate containers"
docker compose up -d --force-recreate backend frontend backup

echo "[8/8] status"
docker compose ps
