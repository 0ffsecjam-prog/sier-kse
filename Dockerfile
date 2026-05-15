# syntax=docker/dockerfile:1.7
# Simple multi-stage build for sier-kse (Next.js + Prisma).
# Optimized for clarity and a 2-5 user internal app, not bytes.

# ---------- deps ----------
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm ci --no-audit --no-fund

# ---------- builder ----------
FROM node:22-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Placeholder for build-time (Next can read at build); runtime is set by docker-compose env_file.
ENV DATABASE_URL="postgresql://placeholder:placeholder@placeholder:5432/placeholder?schema=public"
RUN npx prisma generate && npm run build

# ---------- runner ----------
FROM node:22-alpine AS runner
RUN apk add --no-cache openssl bash libc6-compat
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

RUN addgroup -S nodejs -g 1001 && adduser -S nextjs -u 1001 -G nodejs

# Copy everything from the builder so prisma CLI + tsx + the .next build are all present.
# Slightly bigger image vs standalone, but no symlink / module-resolution gotchas.
COPY --from=builder --chown=nextjs:nodejs /app ./

RUN chmod +x ./scripts/entrypoint.sh \
 && mkdir -p /app/data/uploads \
 && chown -R nextjs:nodejs /app/data

USER nextjs
EXPOSE 3000
ENTRYPOINT ["./scripts/entrypoint.sh"]
