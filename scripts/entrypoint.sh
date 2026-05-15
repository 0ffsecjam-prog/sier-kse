#!/usr/bin/env bash
set -e

echo "[entrypoint] Applying Prisma migrations (deploy)..."
node ./node_modules/prisma/build/index.js migrate deploy

echo "[entrypoint] Seeding (idempotent)..."
node ./node_modules/tsx/dist/cli.mjs prisma/seed.ts || echo "[entrypoint] Seed step non-fatal, continuing."

echo "[entrypoint] Starting Next.js on 0.0.0.0:${PORT:-3000}..."
exec node ./node_modules/next/dist/bin/next start -H 0.0.0.0 -p "${PORT:-3000}"
