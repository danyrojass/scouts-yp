# Session State — Scout YP Migration

## Estado actual: refactor de backend EN PAUSA

**Nov 11, 2026** — Se pausa la dockerización y el despliegue a un environment en la nube.
La aplicación que corre en **Vercel** (Angular + Firebase Auth + Firestore) es la que se
sigue usando y desarrollando. Las fases 4–8 quedan congeladas hasta nuevo aviso; el
código de `server/`, Docker y Railway se conserva tal cual.

Trabajo hecho en esta etapa (sobre la app de Vercel):

- **Carga histórica de actividades y puntajes**: `scripts/seed-activities.mjs`
  (`npm run seed:activities`). Inserta 8 actividades de nivel Scout y 24 completions
  (una por patrulla) en Firestore, con IDs determinísticos e idempotentes.
  Ver `README.md` → *Carga de datos históricos*.

## Last Session: Aug 3, 2026

### Completed

**Phase 0 — Backend Foundation** ✅
- `server/` scaffolding: Express + TypeScript + Prisma + Docker
- Prisma schema: 10 modelos (Organization, User, Group, Set, Activity, ActivityCompletion, Payment, Progression, RefreshToken)
- PostgreSQL running on port 5433 (Docker)
- Docker Compose: postgres + api + nginx
- Health endpoint: `GET /api/v1/health`
- Winston logger, Zod env validation, centralized error handling
- Custom exceptions (HttpException, NotFound, Unauthorized, Forbidden)

**Phase 1 — Auth Module** ✅
- Auth DTOs (RegisterDto, LoginDto) with class-validator
- Auth Service: register, login, refresh, logout, me
- JWT with httpOnly cookies (access 15min, refresh 7d)
- RefreshToken rotation (token model in Prisma)
- bcrypt password hashing (12 rounds)
- Auth middleware (JWT from cookie or header)
- Validation middleware (body)
- Tested: register, login, refresh, logout, me — all working

**Phase 2 — Users Module** ✅
- Users DTOs: CreateUserDto, UpdateUserDto, QueryUsersDto
- Users Service: findAll (paginated + filtered), findById, create, update, remove (soft delete)
- Users Controller: full CRUD
- Users Routes: with auth + tenant + role guards
- PaginationDto (reusable)
- Role guard middleware (requireRole)
- Tenant middleware (requireTenant)
- Query validation middleware (validateQuery)
- **Endpoints tested via Docker stack**: list, get, create, update, delete, validation, 404, 401

**Phase 3 — Groups Module** ✅
- Groups CRUD (controller, service, routes, DTOs)
- **Endpoints tested via Docker stack**: list, get, create, update, delete, search

**Phase 4 — Sets Module** ✅
- Sets CRUD (controller, service, routes, DTOs)
- Filtros: `type`, `groupId`, `search` por nombre; paginado
- Validación de tenant: el `groupId` debe pertenecer a la organización del JWT
- `GET /sets/:id` incluye grupo y `_count` de usuarios

**Phase 5 — Activities + Completions** ❌ (next)
**Phase 6 — Payments + Progression** ❌
**Phase 7 — Dashboard** ❌
**Phase 8 — Firebase Decommission** ❌ (frontend still on Firebase)

### Infrastructure Fixes (this session)

- **docker-entrypoint.sh CRLF → LF**: CRLF broke the shebang in Linux (`.gitattributes` added to enforce LF)
- **server/Dockerfile**: added `openssl libc6-compat` + `chown -R app:app /app` so Prisma can run as non-root
- **Prisma on Alpine**: added `binaryTargets = ["native", "linux-musl-openssl-3.0.x"]` to schema (query engine couldn't load)
- **tsup bundle:false → true**: build only emitted `index.js`; now produces a self-contained bundle
- **server/package.json**: added missing `dotenv` dependency
- **Express 4 async errors**: added `asyncHandler` wrapper (controllers were crashing the process on 404/409)
- **nginx cookie paths**: `proxy_cookie_path ~^/$ /api/` (was rewriting refresh cookie path to `/api/api/v1/auth`)
- **frontend package-lock.json**: regenerated (`npm install`) — was out of sync (missing `xlsx`, old `dotenv`)

### Railway Deployment (prepared)

- **`Dockerfile` (root)**: single full-stack container (nginx + node) — one domain, no CORS/cookie issues
- **`nginx/railway.conf`**: static frontend + proxy `/api/` to `127.0.0.1:3000` (placed in `/etc/nginx/http.d/`, Alpine package quirk)
- **`railway-entrypoint.sh`**: runs `prisma migrate deploy` → starts nginx → starts API
- **Validated locally**: health, frontend, and login all work through the full-stack image
- **README**: added deploy guide (Postgres plugin, JWT vars, HTTPS note)

### Infrastructure (Already Working)
- Docker Compose full stack (postgres + api + frontend + nginx)
- Multi-stage Dockerfiles (frontend + backend)
- NGINX reverse proxy config
- Makefile with dev/prod/railway commands
- Multi-tenant: every entity has organizationId
- Role-based authorization (BENEFICIARIO < DIRIGENTE < ADMIN)

### How to Resume

```bash
# Start the full Docker stack
make up

# Frontend
npm start

# API (dev mode)
cd server && npm run dev

# Test login
curl -X POST http://localhost/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@scouts.dev","password":"admin123"}'
```

Next phase: **Phase 5 — Activities + Completions**, then Payments/Progression, Dashboard, and finally **Phase 8 (Firebase decommission)**.

## Nov 12, 2026 — Fix frontend (Vercel)

- **Actividad → completaciones mostraban "Desconocida"** en la columna Sección.
  Causa: `ActivityDetailComponent.loadCompletions()` usaba `toPromise()` sobre
  `docData()` (listener de Firestore que **nunca completa**), así que el `Promise.all`
  jamás resolvía y el `setsMap` quedaba vacío. Fix: `firstValueFrom()` y filtrar
  `setId` nulos. Datos verificados contra Firestore: los `set_id` existen y son correctos.
- **Actividades agrupadas por nivel** en la lista (`/activities`) y en "Actividad
  Reciente" del dashboard. El header de cada grupo muestra el `SetType` asociado
  (`Lobato→Seisena`, `Scout→Patrulla`, `Caminante→Equipo`, `Rover→Clan`, `Jefe→—`).
  Helper compartido: `groupByLevel()` en `shared/utils/level-settype.util.ts`.
  También se corrigió el `track` de la tabla del dashboard (usaba `activityId`, que se
  repetía cuando varias secciones completaban la misma actividad).
- **Tabla de posiciones separada por tipo de sección** (Seisena, Patrulla, Equipo,
  Clan): cada grupo tiene su propio ranking y medallas, para comparar pares del mismo
  tipo. Se quitó la columna "Tipo" (ahora es el header de cada grupo).
