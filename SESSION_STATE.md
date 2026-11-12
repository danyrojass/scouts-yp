# Session State — Scout YP Migration

## Estado actual: backend multi-grupo (Fases A–E completas)

**Nov 12, 2026** — El backend pasó de "un grupo autogestionado" a **plataforma
multi-grupo**: `Group` es el tenant y cada usuario pertenece a un solo grupo, salvo
el `SUPER_ADMIN` de plataforma. Detalle de la sesión al final del documento; plan en
`C:\Users\danyr\.opencode\plan\multi-grupo-multitenant.md`.

## Historial

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

**Phase 5 — Activities + Completions** ✅
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

## Nov 12, 2026 — Plataforma multi-grupo (backend, Fases A–C)

### Modelo nuevo

- **`Group` = tenant**. Se eliminaron `Organization` y el `Group` anidado; ahora
  `Group` tiene `name`, `number`, `city`, `slug` único e `isActive`.
- **`User.groupId`** (`String?`) apunta al grupo; `email` es único global.
  `groupId` solo puede ser nulo para `SUPER_ADMIN` (constraint SQL
  `users_group_required`).
- **Roles**: `BENEFICIARIO < DIRIGENTE < ADMIN` (por grupo) + `SUPER_ADMIN`
  (plataforma, sin grupo).
- **`User.tokenVersion`**: se incrementa al cambiar rol, grupo o estado; los JWT
  viejos dejan de valer sin esperar al vencimiento.
- Todas las entidades (`sets`, `activities`, `activity_completions`, `payments`,
  `progressions`) tienen `groupId` e índice.

### Auth y contexto

- `POST /auth/register` crea `Group` + usuario `ADMIN` **en una transacción**; es el
  único alta pública. Los demás miembros los crea un dirigente.
- JWT con `groupId` y `tokenVersion`. `authenticate` valida `isActive` y
  `tokenVersion` contra la base.
- `requireGroup` resuelve `req.groupId`: para roles de grupo sale **siempre del JWT**;
  `SUPER_ADMIN` debe enviar `X-Group-Id`, validado contra la base y auditado en el log.
- `requireRole(...roles)` exige rol exacto; `requireAtLeast(role)` usa la jerarquía.
- Login y refresh rechazan usuarios/grupos inactivos.

### Scoping y reglas

- `users`, `sets` y `groups` scopeados por `groupId`; cross-tenant responde **404**
  (no se filtra la existencia de recursos de otro grupo).
- `groupId` no se acepta en body/query (el DTO lo rechaza con 400).
- `setId` debe pertenecer al mismo grupo.
- `DIRIGENTE` no crea ni edita `ADMIN`; nadie asigna `SUPER_ADMIN` por API.
- No se puede degradar/desactivar al último `ADMIN` activo del grupo (409).
- `GET/PATCH /groups/me` para `ADMIN`; listado/alta/edición/baja global de grupos
  solo `SUPER_ADMIN`.

### Migración y seed

- Se **regeneró** la migración inicial (`20261112000000_init`) porque el backend no
  tenía datos productivos. Incluye el `CHECK` de grupo obligatorio.
- `prisma/seed.ts`: grupo demo + `admin@scouts.dev` / `admin123` y
  `superadmin@scouts.dev` / `superadmin123`.
- **DBs existentes con el esquema viejo** (incluida la dev `scouts_yp`) requieren
  `npx prisma migrate reset` antes de aplicar la nueva migración.

### Verificación

- `tsc --noEmit` OK.
- Pruebas manuales contra la API en un puerto aislado y DB temporal
  (`scouts_yp_tenant_test`): registro, scoping, cross-tenant 404, `setId` ajeno 404,
  reglas de rol (403), último admin (409), invalidación de sesión (401),
  `SUPER_ADMIN` con/sin `X-Group-Id`, `/groups/me` y rutas de plataforma.
- Documentación actualizada: `README.md`, `docs/architecture.md`,
  `docs/glossary.md`, `docs/api-reference.md`, `CLAUDE.md`.

### Fase E — Activities + Completions

- Nuevos módulos `activities` y `completions`, ambos scoped por `groupId`.
- **Activities**: CRUD; `POST`/`PATCH` `DIRIGENTE`+, `DELETE` `ADMIN`+; `key` única
  por grupo (409). Filtros `level`/`search` y `sortBy` con allowlist.
- **Completions**: listado con filtros `activityId`/`userId`/`setId` y alta.
  `earnedPoints` no puede superar `activity.points` (400); una completion por
  `[activityId, userId]` (409); `BENEFICIARIO` solo registra para sí mismo y su
  propio `setId` (403); actividad/usuario/set deben ser del grupo (404).
- `ActivityCompletion.activity` con `ON DELETE CASCADE` y `.set` con
  `ON DELETE SET NULL`; la migración inicial se regeneró con esos FKs.
- Verificado en DB temporal + API aislada: duplicados, puntos inválidos, reglas de
  beneficiario, cross-tenant 404, filtros/orden y borrado en cascada.

### Pendiente

- **Fase D**: import xlsx sin columna de grupo e invitaciones (opcional).
- **Fase F**: Payments/Progression/Dashboard scoped.
- **Fase G (Phase 8)**: frontend Firestore → API, `roleGuard`, registro sin selector
  de grupo, puente de contraseñas desde Firebase Auth.
- **Fase H**: suite cross-tenant automatizada, rate limit y cierre de `firestore.rules`.
- Antes del próximo deploy: resetear/migrar la DB dev.
