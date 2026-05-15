#!/usr/bin/env bash
# Backup de la DB y los uploads.
# Usage: ./scripts/backup.sh [destination_dir]
# Default destination: ./backups
set -euo pipefail

DEST="${1:-./backups}"
TS="$(date +%Y%m%d-%H%M%S)"
mkdir -p "$DEST"

if [ ! -f .env.docker ]; then
  echo "[backup] .env.docker no encontrado, abortando."
  exit 1
fi

# Cargar credenciales (sólo POSTGRES_*) del .env.docker
set -a
# shellcheck disable=SC1091
source .env.docker
set +a

SQL_FILE="$DEST/sier-kse-db-$TS.sql.gz"
UPLOADS_FILE="$DEST/sier-kse-uploads-$TS.tar.gz"

echo "[backup] Dumpeando DB a $SQL_FILE..."
docker compose exec -T db pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" | gzip > "$SQL_FILE"

if [ -d ./data/uploads ]; then
  echo "[backup] Empaquetando uploads a $UPLOADS_FILE..."
  tar -czf "$UPLOADS_FILE" -C ./data uploads
else
  echo "[backup] (no hay ./data/uploads, salteando)"
fi

echo "[backup] Listo."
ls -lh "$SQL_FILE" "$UPLOADS_FILE" 2>/dev/null || true
