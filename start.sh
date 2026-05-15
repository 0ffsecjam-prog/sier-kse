#!/usr/bin/env bash
# Atajo: bootstrap (si hace falta) + docker compose up --build.
# Detecta automáticamente si tenés Compose v2 (plugin) o el viejo
# docker-compose (v1). Si tu Docker requiere sudo, corré: sudo ./start.sh
# Cualquier flag extra se pasa a "up". Ejemplos:
#   ./start.sh          → up con logs en foreground
#   ./start.sh -d       → up en background
set -e
cd "$(dirname "$0")"
./scripts/bootstrap.sh

# Preferimos Compose v2 (subcomando "docker compose"); si no, caemos a
# "docker-compose" v1 (binario separado).
if docker compose version >/dev/null 2>&1; then
  exec docker compose up --build "$@"
elif command -v docker-compose >/dev/null 2>&1; then
  exec docker-compose up --build "$@"
else
  cat >&2 <<'EOF'

No encontré ni "docker compose" (v2) ni "docker-compose" (v1) en este sistema.

Instalá uno de los dos:
  - Plugin v2 (recomendado): https://docs.docker.com/compose/install/linux/
  - Legacy v1 (Ubuntu/Debian):  sudo apt install docker-compose

Si Docker en tu máquina necesita sudo, probá:  sudo ./start.sh
EOF
  exit 1
fi
