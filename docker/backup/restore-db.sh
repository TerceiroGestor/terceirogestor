#!/bin/sh
set -eu

file="${1:-}"
if [ -z "${file}" ] || [ "${file}" = "--latest" ]; then
  file="${BACKUP_DIR}/${MYSQL_DATABASE}-db-latest.sql.gz"
fi

if [ ! -f "${file}" ]; then
  echo "Arquivo de backup do banco nao encontrado: ${file}" >&2
  exit 1
fi

export MYSQL_PWD="${MYSQL_PASSWORD}"

gzip -dc "${file}" | mysql \
  --host="${MYSQL_HOST}" \
  --port="${MYSQL_PORT}" \
  --user="${MYSQL_USER}" \
  "${MYSQL_DATABASE}"

echo "Banco restaurado a partir de ${file}"
