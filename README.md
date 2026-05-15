# sier-kse

Sistema interno de gestión para una empresa que instala cámaras en canchas deportivas (pádel, fútbol, tenis, etc.) y cobra por las descargas de los videos de los partidos.

**No maneja video** — sólo lleva la cuenta de canchas, instalaciones, costos, descargas y ROI. Pensado para 2-5 usuarios internos, self-hosted, dockerizado.

## Funcionalidades

- Login multi-usuario con roles `ADMIN` (todo) / `VIEWER` (solo lectura)
- Portfolio de canchas (CRUD + carga manual y por xlsx/CSV) con adjuntos (PDF, fotos)
- Mapa interactivo (Leaflet + OpenStreetMap) con pin por cancha coloreado por estado
- Toggle de "cancha activa en la nube" con log histórico de cambios
- Costos de instalación por línea + descargas mensuales con snapshot de precio/share
- Calculadora de ROI interactiva + tabla con payback por cancha
- Dashboard con KPIs (canchas por estado, descargas/revenue del mes, top 5)
- Export a xlsx de canchas, descargas, costos y ROI
- Panel admin para usuarios, API keys (encriptadas AES-256-GCM) y settings globales

## Stack

- **Next.js 15** App Router (server components + server actions)
- **PostgreSQL 16** + **Prisma 6**
- **NextAuth v5** (Credentials provider, JWT sessions)
- **Tailwind** + componentes estilo shadcn/ui
- **Leaflet** + react-leaflet
- **ExcelJS** para xlsx
- TypeScript estricto, Zod para validar todo

## Requisitos

- Docker + Docker Compose v2
- (opcional, para dev local) Node 22+ y npm

## Primera puesta en marcha

```bash
# 1. Copiar la plantilla de env y completar secrets
cp .env.example .env.docker

# 2. Generar los secrets que faltan (y editar .env.docker para reemplazar los placeholders)
openssl rand -base64 32   # → NEXTAUTH_SECRET y AUTH_SECRET
openssl rand -hex 32      # → ENCRYPTION_KEY

# 3. Levantar todo: DB + app + migraciones + seed
docker compose up --build
```

Eso es todo. No hace falta correr Postgres aparte: el `docker compose up`
crea dos containers (`sier-kse-db` y `sier-kse-app`) en una red interna
privada, espera a que Postgres pase el healthcheck (`pg_isready`), y la
app corre automáticamente:

1. `prisma migrate deploy` — crea las tablas
2. `prisma/seed.ts` — siembra los deportes base y el usuario admin
3. `next start` — sirve en `0.0.0.0:3000`

Abrí <http://localhost:3000> (o `http://<ip-del-host>:3000` desde otra
máquina en la LAN) y logueate con `INITIAL_ADMIN_EMAIL` /
`INITIAL_ADMIN_PASSWORD` de tu `.env.docker`.

Para correr en background: `docker compose up -d --build`.
Para parar: `docker compose down` (los datos persisten en `./data/`).

## Acceso por red

- El compose binda `0.0.0.0:3000` → el panel queda visible para cualquier máquina en la LAN
- Si servís detrás de un dominio público, actualizá `NEXTAUTH_URL` / `AUTH_URL` y agregá un reverse proxy (nginx/Caddy) con TLS por delante
- Asegurate de abrir el puerto 3000 en el firewall del host

## Persistencia

Toda la persistencia vive en `./data/` y está fuera de git:

- `./data/postgres/` — datafiles de Postgres (bind mount)
- `./data/uploads/` — adjuntos PDF / imágenes

`git pull`, `git checkout` y `git reset --hard` **no tocan `./data/`**. Lo único que puede borrarlos es `rm -rf data/`.

## Backups

```bash
# Volcado SQL + tar de uploads en ./backups/
./scripts/backup.sh

# Restore (¡recrea la DB!)
./scripts/restore.sh ./backups/sier-kse-db-20260514-153022.sql.gz
```

Programalo en `cron`:

```cron
0 3 * * * cd /opt/sier-kse && ./scripts/backup.sh /backups/sier-kse > /var/log/sier-kse-backup.log 2>&1
```

## Encriptación de API keys

Las API keys (Google Maps, OAuth, etc.) que cargás desde el panel admin se cifran con **AES-256-GCM** usando `ENCRYPTION_KEY` antes de guardarlas en la DB.

**Si perdés `ENCRYPTION_KEY` las keys guardadas son irrecuperables.** Backeá el `.env.docker` por separado.

Al crear una key, el valor completo se muestra una sola vez con botón "copiar". Después solo se ven los últimos 4 caracteres.

## Desarrollo local sin Docker

```bash
# Postgres local en otro puerto/host, ajustar DATABASE_URL
cp .env.example .env
# editar .env

npm install
npx prisma migrate deploy
npx tsx prisma/seed.ts
npm run dev
```

## Importar canchas desde xlsx

En `/venues/import` (admin). Columnas reconocidas (en español o inglés, case-insensitive):

| Columna | Aliases | Requerida |
|---|---|---|
| Nombre | `nombre`, `name` | sí |
| Dirección | `direccion`, `address` | sí |
| Latitud | `latitud`, `lat`, `latitude` | sí |
| Longitud | `longitud`, `lng`, `longitude` | sí |
| Deporte | `deporte`, `sport` | sí |
| Ciudad | `ciudad`, `city` | no |
| País | `pais`, `country` | no |
| Estado | `estado`, `status` | no |
| Dueño | `dueno`, `owner`, `contacto` | no |
| Teléfono | `telefono`, `phone` | no |
| Email | `email`, `mail` | no |
| Notas | `notas`, `notes` | no |

Mismo flujo en `/downloads/import` para registros mensuales (columnas: cancha, año, mes, descargas, precio, share, notas).

## Smoke test end-to-end

1. Bootstrap limpio (con `.env.docker` ya creado): `docker compose up --build`
2. Logueate como admin → ver `/dashboard` con KPIs en cero
3. Crear 3 canchas con coordenadas reales → ver pins en `/map`
4. En una cancha: agregar 5 costos (~$3000), 3 meses de descargas (100/150/200 a $5, 70% share)
5. En `/roi` (o en el detalle de la cancha) ver payback ~3 meses
6. Subir un PDF en el tab "Adjuntos" → bajarlo → cerrar sesión → confirmar que `/api/uploads/<id>` da 401
7. Toggle de cloud activa off/on → 2 entradas en el tab "Logs nube"
8. Crear un usuario `viewer` → loguear con él → confirmar que `/admin/*` redirige a `/dashboard`
9. Crear una API key → ver el secret una sola vez → recargar → solo se ve `****XXXX`
10. Exports en `/reports` → cada xlsx abre en Excel/LibreOffice sin warnings
11. `docker compose down && docker compose up` → datos persisten, login sigue funcionando

## Estructura del repo

```
sier-kse/
├── Dockerfile, docker-compose.yml, .env.example
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── scripts/
│   ├── entrypoint.sh        # migrate deploy + seed + next start
│   ├── backup.sh
│   └── restore.sh
├── data/                    # gitignored — DB + uploads
└── src/
    ├── app/                 # Next App Router (login, dashboard, venues, map, ...)
    ├── components/          # UI primitives + dominio
    ├── server/
    │   ├── actions/         # server actions por dominio
    │   ├── auth/            # NextAuth config + helpers
    │   ├── db/              # Prisma client
    │   └── services/        # roi, import/export xlsx
    └── lib/                 # crypto, env, utils, schemas zod
```
