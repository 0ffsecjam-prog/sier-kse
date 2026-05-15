#!/usr/bin/env bash
# Genera .env.docker con secrets aleatorios la primera vez.
# Si .env.docker ya existe, no hace nada (idempotente).
set -euo pipefail

cd "$(dirname "$0")/.."

if [ -f .env.docker ]; then
  echo "[bootstrap] .env.docker ya existe, no toco nada."
  exit 0
fi

if ! command -v openssl >/dev/null 2>&1; then
  echo "[bootstrap] Necesito openssl instalado para generar secrets. Abortando." >&2
  exit 1
fi

echo "[bootstrap] Generando .env.docker con secrets aleatorios..."

PG_PASS="$(openssl rand -base64 24 | tr -d '/+=' | head -c 24)"
NA_SECRET="$(openssl rand -base64 32)"
ENC_KEY="$(openssl rand -hex 32)"
ADMIN_PASS="$(openssl rand -base64 16 | tr -d '/+=' | head -c 16)"

cat > .env.docker <<EOF
# Auto-generado por scripts/bootstrap.sh — NO COMMITTEAR
# Si querés cambiar algo, editá este archivo y reiniciá la stack.
POSTGRES_USER=sier
POSTGRES_PASSWORD=${PG_PASS}
POSTGRES_DB=sier
DATABASE_URL=postgresql://sier:${PG_PASS}@db:5432/sier?schema=public

# URL pública desde donde se accede. Cambiala si servís detrás de un dominio.
NEXTAUTH_URL=http://localhost:3000
AUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=${NA_SECRET}
AUTH_SECRET=${NA_SECRET}
AUTH_TRUST_HOST=true

# Encripta las API keys guardadas en la DB con AES-256-GCM.
# Si perdés esta key, las API keys cargadas son irrecuperables.
ENCRYPTION_KEY=${ENC_KEY}

INITIAL_ADMIN_EMAIL=admin@local
INITIAL_ADMIN_PASSWORD=${ADMIN_PASS}
INITIAL_ADMIN_NAME=Admin

UPLOADS_DIR=/app/data/uploads
NODE_ENV=production
EOF

chmod 600 .env.docker

cat <<EOF

============================================================
  Listo. Credenciales del admin:
    Email:    admin@local
    Password: ${ADMIN_PASS}

  Quedaron guardadas en .env.docker (gitignored).
  Cuando levantes la app: http://localhost:3000
============================================================

EOF
