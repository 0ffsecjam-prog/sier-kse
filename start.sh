#!/usr/bin/env bash
# Atajo: bootstrap (si hace falta) + docker compose up --build.
#
# Detecta automáticamente:
#   - Si tenés Compose v2 (plugin "docker compose") o v1 ("docker-compose").
#   - Si tu usuario puede hablar con el daemon de Docker. Si no, te dice
#     cómo arreglarlo (sudo o agregarte al grupo docker) sin generar
#     .env.docker a medias.
#
# Uso:
#   ./start.sh          → up con logs en foreground
#   ./start.sh -d       → up en background
#   sudo ./start.sh     → si Docker requiere root en tu máquina
#
# Cualquier flag extra se pasa a "up".
set -e
cd "$(dirname "$0")"

# 1) Resolver qué comando de Compose usar.
if docker compose version >/dev/null 2>&1; then
  COMPOSE=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE=(docker-compose)
else
  cat >&2 <<'EOF'

No encontré ni "docker compose" (v2) ni "docker-compose" (v1) en este sistema.

Instalá uno de los dos:
  - Plugin v2 (recomendado): https://docs.docker.com/compose/install/linux/
  - Legacy v1 (Ubuntu/Debian):  sudo apt install docker-compose

EOF
  exit 1
fi

# 2) Verificar que podemos hablar con el daemon ANTES de bootstrappear.
# Capturamos stderr para poder distinguir "no hay daemon corriendo"
# de "no tengo permisos para el socket".
if ! docker info >/dev/null 2>&1; then
  docker_err="$(docker info 2>&1 || true)"
  if echo "$docker_err" | grep -qi "permission denied"; then
    cat >&2 <<EOF

No tengo permisos para hablar con el daemon de Docker en este sistema.
(Error: $(echo "$docker_err" | grep -iE "permission denied" | head -1))

Tenés dos opciones:

  A) Correr este script con sudo (rápido, una sola vez):
       sudo ./start.sh

  B) Agregar tu usuario al grupo "docker" (recomendado, persistente):
       sudo usermod -aG docker "\$USER"
       # cerrá sesión y volvé a entrar (o reiniciá) para que tome efecto
       ./start.sh

No generé .env.docker todavía, así que podés re-ejecutar tranquilo cuando
arregles los permisos.

EOF
    exit 1
  fi

  if echo "$docker_err" | grep -qiE "cannot connect to the docker daemon|failed to connect to the docker|daemon is running|no such file or directory.*docker"; then
    cat >&2 <<EOF

El daemon de Docker no parece estar corriendo.

Probá arrancarlo:
  - systemd:        sudo systemctl start docker
  - Docker Desktop: abrí la app y esperá a que diga "Engine running"

Después volvé a correr: ./start.sh

EOF
    exit 1
  fi

  # Otro error que no supimos clasificar: lo mostramos crudo.
  echo "[start] docker info falló con un error inesperado:" >&2
  echo "$docker_err" >&2
  exit 1
fi

# 3) Bootstrap idempotente (genera .env.docker la primera vez).
./scripts/bootstrap.sh

# 4) Levantar la stack.
exec "${COMPOSE[@]}" up --build "$@"
