#!/usr/bin/env bash
# Atajo: bootstrap (si hace falta) + docker compose up --build.
# Cualquier flag extra se pasa a docker compose up. Ejemplos:
#   ./start.sh          → up con logs en foreground
#   ./start.sh -d       → up en background
set -e
cd "$(dirname "$0")"
./scripts/bootstrap.sh
exec docker compose up --build "$@"
