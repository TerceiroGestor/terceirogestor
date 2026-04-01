#!/bin/sh
set -eu

timestamp="$(date +%Y%m%d-%H%M%S)"
prefix="${BACKUP_DIR}/${MYSQL_DATABASE}"
db_file="${prefix}-db-${timestamp}.sql.gz"
uploads_file="${prefix}-uploads-${timestamp}.tar.gz"
latest_db="${prefix}-db-latest.sql.gz"
latest_uploads="${prefix}-uploads-latest.tar.gz"

mkdir -p "${BACKUP_DIR}" /uploads

export MYSQL_PWD="${MYSQL_PASSWORD}"

mysqldump \
  --host="${MYSQL_HOST}" \
  --port="${MYSQL_PORT}" \
  --user="${MYSQL_USER}" \
  --single-transaction \
  --quick \
  "${MYSQL_DATABASE}" | gzip -c > "${db_file}"

tar -czf "${uploads_file}" -C /uploads .

cp -f "${db_file}" "${latest_db}"
cp -f "${uploads_file}" "${latest_uploads}"

find "${BACKUP_DIR}" -type f -name "${MYSQL_DATABASE}-db-*.sql.gz" ! -name "*-latest.sql.gz" -mtime +"${BACKUP_KEEP_DAYS}" -delete
find "${BACKUP_DIR}" -type f -name "${MYSQL_DATABASE}-uploads-*.tar.gz" ! -name "*-latest.tar.gz" -mtime +"${BACKUP_KEEP_DAYS}" -delete

echo "Backup concluido:"
echo "  - ${db_file}"
echo "  - ${uploads_file}"
