# Session State — Scout YP Migration

## Nov 22, 2026 — Favicon actualizado

- Se reemplazó `public/favicon.svg` por una **flor de lis simple y simétrica**
  (pétalo central, pétalos laterales, barra y base), elegida entre cuatro
  alternativas (escudo 62, carpa, flor de lis simple, fogón).
- Se mantuvieron el verde institucional `#1B5E20`, el dorado `#FFD54F`, el
  `role="img"` y el `aria-label`. `src/index.html` sigue referenciando el mismo
  archivo, así que no hubo que tocar el HTML.

## Nov 22, 2026 — Terminología de ramas en la UI

- Se agregó `branchNameForLevel` en `src/app/shared/utils/level.util.ts`: los
  valores guardados (`Lobato/Scout/Caminante/Rover`) se muestran como
  **Manada / Tropa / Comunidad / Clan** en badges, filtros, selects y títulos.
- Las unidades chicas no cambiaron (`unitNameForLevel`): Seisena / Patrulla /
  Equipo / Clan. Rover sigue mostrando "Clan" como unidad.
- Decisión confirmada con el PO: **sólo etiquetas visibles**, sin migrar datos
  de Firestore ni tocar reglas; el mapeo histórico `type: "Clan" → ROVER` queda
  intacto.
- 4 tests nuevos en `level.util.spec.ts`. Docs actualizados: `CLAUDE.md`,
  `SYSTEM_PROMPT.md`, `docs/architecture.md` (decisión 9), `docs/api-reference.md`,
  `docs/glossary.md`.

## Nov 22, 2026 — Resumen destacado del dashboard

- `welcome-card`: muestra `nombre · Grupo N` y un acceso directo a
  `/activities/complete` ("Completar actividad").
- Indicador de actividades completadas con barra de progreso y porcentaje
  (`progressPercent`).
- Nuevas cards: **Próxima actividad** (la futura más cercana; si no hay, la
  última con etiqueta "Última actividad") y **Próximos cumpleaños** (hasta 5
  en los próximos 60 días).
- Lógica extraída a `src/app/dashboard/utils/dashboard-highlights.util.ts` con
  11 tests nuevos (maneja año bisiesto y fechas vencidas). Total: 42 tests.
- `angular.json`: budget de estilos por componente subido a 10/12 kB (el CSS
  del dashboard quedó en 8.9 kB y el build de producción fallaba en Vercel).
- Datos reales verificados: las 12 actividades están pasadas (última el
  21/11) y hay un cumpleaños el 28/12.

## Nov 22, 2026 — Identidad visual y métrica de secciones

- Favicon nuevo: `public/favicon.svg`, flor de lis dorada sobre fondo verde institucional.
  `src/index.html` lo referencia, usa `lang="es"`, título `Scout YP 62` y
  `theme-color` verde. Se verificó que el SVG renderiza en el build.
- Dashboard: el cuarto indicador ya no muestra los puntos totales del grupo. Para
  dirigentes muestra **cantidad de secciones**; para beneficiarios, el nombre de
  **su sección**. La tabla de posiciones sigue mostrando puntos por sección.

## Nov 22, 2026 — Despliegue en modo grupo único (Scout YP 62)

- El deploy de Vercel es para un solo grupo: se mantiene el modelo `Group`/`groupId`
  en los datos (no se migra nada) pero se desactivan las pantallas de registro y
  gestión de grupos.
- `environment.config.singleGroupMode: true` oculta el link "Grupos" y el registro;
  las rutas `/groups` y `/register` redirigen al dashboard.
- Todo usuario creado (formulario o importación CSV) hereda el `groupId` del
  dirigente autenticado. El formulario de usuario ya no permite elegir grupo.
- `UserService.getUsers()` y `SetService.getSets()` filtran en el query por el grupo
  del usuario logueado: ya no traen documentos de otros grupos para filtrar en cliente.
- Dashboard: un usuario histórico sin `group_id` ya no deja el tablero vacío.
- `firestore.rules`: lectura para autenticados, escritura sólo para dirigentes y
  dentro de su grupo (usuarios/secciones); `groups` y colecciones nuevas quedan
  cerradas a escritura. Requiere `firebase deploy --only firestore:rules`.

## Nov 22, 2026 — Suite de tests verde y mejoras de usabilidad

- Se creó `src/app/testing/mocks/firebase.mocks.ts`: provee `createMockAuth()` y
  `createMockFirestore()`, necesarios por los specs de auth, login, register y navbar
  que no compilaban. El suite completo pasa: **31/31**.
- `AuthService` inyecta `FIREBASE_SIGN_IN` (token cuyo default es la función modular
  original). Permite testear `login()` sin cambiar el comportamiento en producción.
- Completar actividad: botón "Marcar / Desmarcar todos", los puntos de miembros ya
  completados se pueden editar (batch `update`), Guardar se habilita ante cualquier
  cambio real y el mensaje distingue guardadas / actualizadas / quitadas.
- Dashboard: "Actividad Reciente" puede expandirse para ver las 12 actividades
  (`Mostrar N actividades más` / `Mostrar menos`).

## Nov 21, 2026 — Corrección de conteo y puntos por patrulla (hotfix del PR #12)

- Los documentos históricos de `sets` en Firestore tienen `type: "Patrulla"|"Seisena"|...`
  y **no** tienen `level`. Eso hacía que el cálculo por nivel diera 0 actividades por
  sección y el dashboard mostrara `0/12`. `firestoreToSet` ahora deriva `Set.level`
  desde `type` (alias Seisena/Patrulla/Equipo/Clan y también Lobato/Scout/Caminante/Rover).
- "Actividad Reciente" ya no genera una fila agregada con todas las patrullas y sus
  puntos sumados. Ahora muestra la actividad como encabezado y una fila por sección
  con **sus** puntos (`↳ Aguara +2`, `↳ Halcón +2`, `↳ Lobo +1`). Las completaciones
  históricas son una por patrulla y actividad, atribuidas al dirigente.

## Nov 21, 2026 — Dashboard y completado de actividades (frontend Firestore)

- Nueva regla compartida en `completion-stats.util.ts`: una sección completó una
  actividad si todos sus integrantes tienen completación o si existe el registro
  histórico cargado por un dirigente. El dashboard cuenta actividades distintas
  (no registros): tabla de posiciones `completadas/total del nivel` y "Actividad
  Reciente" agrupada por actividad con las secciones que la completaron.
- `/activities/complete` reemplaza el formulario de un solo registro por una lista
  de miembros de la sección derivada del nivel de la actividad, con puntos por
  miembro y guardado atómico en un batch de Firestore. Acepta `?activityId=` para
  llegar preseleccionado desde el listado y el detalle.
- Los puntos totales del leaderboard ahora son la suma de puntos por miembro (antes
  era un registro por sección). Backend y datos históricos sin cambios.

## Estado actual: backend multi-grupo (Fases A–F completas)

**Nov 13, 2026 — ADR 6: secciones por nivel.** Se eliminó `SetType`: `Set.type` pasó a
`Set.level` (`UserLevel`, solo ramas juveniles) y el nombre visible de la unidad se deriva
de `UNIT_NAME_BY_LEVEL` (Lobato → Seisena, Scout → Patrulla, Caminante → Equipo,
Rover → Clan). Reglas nuevas: el nivel del usuario se alinea con el de su sección; un
`DIRIGENTE` no puede tener sección; una sección no puede ser `JEFE`; aprobar una
progresión acepta `setId` para reasignar o limpiar la sección; una completion exige que
la sección sea del mismo nivel que la actividad. Backend y frontend compilan; docs
actualizadas (`architecture.md`, `api-reference.md`, `glossary.md`, `CLAUDE.md`).

### Dónde retomar (estado al 13 Nov 2026)

- Rama `refactor-backend`, último commit `17030d5 refactor: secciones por nivel sin SetType`.
  Árbol limpio.
- Verificado: `prisma validate`, `prisma generate`, `server: tsc --noEmit` y
  `frontend: ng build --configuration development`.
- El cliente Prisma ya está regenerado. El `tsx watch` local se detuvo para liberar el
  DLL del query engine; hay que levantarlo de nuevo si se retoma el backend en caliente.
- **Pendiente inmediato:** resetear/migrar la DB dev (la migración inicial se regeneró) y
  rebuildear el stack Docker, que hoy corre código viejo (pre-refactor).
- **Pendiente grande:** Fase G (migrar el frontend de Firestore a la API). Mientras tanto
  la app productiva en Vercel sigue leyendo `set.type` desde Firestore: no deployar solo
  el frontend nuevo sin migrar los datos.
- Otros pendientes: Fase H (tests cross-tenant, rate limit, auditoría de `SUPER_ADMIN`,
  cierre de `firestore.rules`) y Fase D (import xlsx en backend, opcional).
- Deuda anotada: `User.type` duplica información de `User.role`; no se tocó en este ADR.

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
**Phase 6 — Payments + Progression** ✅
**Phase 7 — Dashboard** ✅ (agregados en el frontend sobre endpoints scoped)
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
  Helper compartido: `groupByLevel()` en `shared/utils/level.util.ts` (entonces
  `level-settype.util.ts`; desde el ADR 6 la unidad se deriva de `Set.level`).
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

### Fase F — Payments + Progressions + Dashboard

- **Payments** (`/payments`): alta `DIRIGENTE+`, baja `ADMIN+`, listado con
  `userId`/`search`/`from`/`to`. `BENEFICIARIO` solo ve sus propios pagos.
  `amount` es `Decimal` y se serializa como string.
- **Progressions** (`/progressions`): alta pendiente `DIRIGENTE+` (`fromLevel` se
  toma del usuario y `toLevel` debe ser superior), aprobación `DIRIGENTE+` que
  actualiza el nivel del usuario en la misma transacción, baja `ADMIN+`.
  `BENEFICIARIO` solo ve sus propias progresiones. Re-aprobar o detectar un nivel
  desactualizado devuelve 409.
- **Dashboard**: sin endpoint propio. Los agregados de la Fase 7 se calculan en el
  frontend sobre `users`, `sets`, `activities` y `completions`, ya scoped por grupo.
- Verificado en DB temporal: roles, privacidad por beneficiario, cross-tenant 404,
  filtros/orden, aprobación con cambio de nivel y conflictos 409.

### Pendiente

- **Fase D**: import xlsx sin columna de grupo e invitaciones (opcional).
- **Fase G (Phase 8)**: frontend Firestore → API, `roleGuard`, registro sin selector
  de grupo, puente de contraseñas desde Firebase Auth.
- **Fase H**: suite cross-tenant automatizada, rate limit y cierre de `firestore.rules`.
- Antes del próximo deploy: resetear/migrar la DB dev.
