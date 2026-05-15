#!/usr/bin/env bash
# Restore desde un dump (.sql.gz) generado por scripts/backup.sh.
# Usage: ./scripts/restore.sh <backup-file.sql.gz>
set -euo pipefail

if [ $# -ne 1 ]; then
  echo "Uso: ./scripts/restore.sh <backup-file.sql.gz>"
  exit 1
fi

FILE="$1"
if [ ! -f "$FILE" ]; then
  echo "[restore] Archivo $FILE no existe."
  exit 1
fi

if [ ! -f .env.docker ]; then
  echo "[restore] .env.docker no encontrado, abortando."
  exit 1
fi

set -a
# shellcheck disable=SC1091
source .env.docker
set +a

echo "[restore] ATENCION: esto va a borrar y recrear la DB '$POSTGRES_DB'."
read -rp "¿Continuar? (escribí 'si' para confirmar): " CONFIRM
if [ "$CONFIRM" != "si" ]; then
  echo "[restore] Cancelado."
  exit 0
fi

echo "[restore] Recreando schema public..."
docker compose exec -T db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

echo "[restore] Aplicando dump..."
gunzip -c "$FILE" | docker compose exec -T db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"

echo "[restore] Listo."
