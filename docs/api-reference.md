# API Reference — Scouts YP

Base URL: `/api/v1` (vía nginx en local; misma imagen full-stack en Railway).

Autenticación: JWT en cookies httpOnly (`access_token`, `refresh_token`) **o**
header `Authorization: Bearer <token>`.

## Enums

| Enum | Valores |
|------|---------|
| `UserType` | `BENEFICIARIO`, `DIRIGENTE` |
| `Role` | `BENEFICIARIO`, `DIRIGENTE`, `ADMIN`, `SUPER_ADMIN` |
| `UserLevel` | `LOBATO`, `SCOUT`, `CAMINANTE`, `ROVER`, `JEFE` |

`Set.level` usa `UserLevel`: la sección guarda su rama (solo las cuatro juveniles).
Los valores guardados no se migraron; en la UI la rama se muestra como Manada
(`LOBATO`), Tropa (`SCOUT`), Comunidad (`CAMINANTE`) y Clan (`ROVER`) mediante
`branchNameForLevel`. La unidad chica se deriva con `unitNameForLevel` (Seisena,
Patrulla, Equipo y Clan respectivamente). No existe un enum `SetType`.

## Contrato de Firestore (frontend actual, Fase G pendiente)

Hasta que el frontend migre a la API, las colecciones que consume `@angular/fire` son:

| Colección | Campos relevantes | Notas |
|-----------|-------------------|-------|
| `groups` | `name`, `number`, `city`, `created_at`, `active_year`, `years` | `active_year` es el año del dashboard; `years` alimenta `/historial`. |
| `users` | `name`, `email`, `date_of_birth`, `group_id`, `created_at` | Identidad. El rol/nivel/sección por año está en `memberships`. |
| `memberships` | `user_id`, `group_id`, `year`, `type`, `level`, `set_id`, `active`, `created_at` | Uno por persona y año. |
| `sets` | `name`, `type`/`level`, `group_id`, `created_at`, `active` | `active: false` da de baja la sección sin borrar su histórico. |
| `activities` | `name`, `key`, `level`, `points`, `created_at`, `scheduled_at`, `year` | `getActivities(year?)` filtra por año; sin año usa el activo. |
| `activity-completion` | `activity_id`, `set_id`, `user_id`, `completed_at`, `earned_points`, `year` | Los puntos quedan separados por año. |

Los documentos históricos sin `year` se mapean a `2026` (`DEFAULT_YEAR`). El filtro
por año se aplica en memoria para no exigir backfill ni índices compuestos.

## Respuesta estándar

Éxito: `{ "success": true, "data": ... }`
Error: `{ "success": false, "error": { "message": "...", "details?" } }`

## Health

### `GET /health`
```
200 { "success": true, "data": { "status": "ok", "timestamp": "...", "uptime": 123, "database": "ok" } }
```

## Auth

### `POST /auth/register`
Body: `{ email, password, name, groupName, groupNumber, groupCity, type?, level? }`
Crea un Grupo nuevo (slug autogenerado) y el usuario `ADMIN` de ese grupo, en una
transacción. Es el único alta pública: los demás miembros los crea un dirigente.
Puede deshabilitarse con `ALLOW_PUBLIC_REGISTRATION=false` (responde `403`).
```
201 { "success": true, "data": { "user": {...}, "group": {...} } }  + Set-Cookie
409 { success:false, error.message: "Email already registered" }
```

### `POST /auth/login`
Body: `{ email, password }`
```
200 { "success": true, "data": { "user": {...} } }  + Set-Cookie
401 "Invalid email or password" / "Account is deactivated"
```

### `POST /auth/refresh`
Requiere cookie `refresh_token`. Rota el token (revoca el anterior).
```
200 { "success": true, "data": { "message": "Token refreshed" } }  + Set-Cookie
401 "Refresh token required" / "Invalid or expired refresh token"
```

### `POST /auth/logout`
Requiere cookie `refresh_token`. Revoca el token y limpia cookies.
```
200 { "success": true, "data": { "message": "Logged out" } }
```

### `GET /auth/me`
Requiere `authenticate`.
```
200 { "success": true, "data": { "user": { ..., "group": {...} } } }
404 "User not found"
```

### `PATCH /auth/password`
Requiere `authenticate`.
Body: `{ currentPassword (min 6), newPassword (min 8) }`
Cambia la contraseña y **invalida todas las sesiones** del usuario (incrementa
`tokenVersion`, borra sus refresh tokens).
```
200 { "success": true, "data": { "message": "Password changed. Please log in again" } }
401 "Current password is incorrect"
400 "New password must be different from the current one"
```

## Users

Todas requieren `authenticate` + `requireGroup` (scoped al grupo del JWT).

| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| GET | `/users` | cualquier autenticado | listado paginado/filtrado del grupo |
| GET | `/users/:id` | cualquier autenticado | detalle (404 si es de otro grupo) |
| POST | `/users` | `DIRIGENTE`+ | crear |
| PATCH | `/users/:id` | `DIRIGENTE`+ | editar |
| DELETE | `/users/:id` | `ADMIN`+ | soft delete (`isActive=false`) |

Reglas:
- `groupId` sale siempre del contexto, nunca del body.
- Un `DIRIGENTE` no puede crear ni editar usuarios `ADMIN`.
- Nadie puede asignar `SUPER_ADMIN`.
- `setId` debe pertenecer al mismo grupo.
- Si se asigna `setId`, el `level` del usuario se alinea con `set.level`; si se envía un
  `level` explícito que no coincide, `400`.
- Un `DIRIGENTE` no puede pertenecer a una sección (`400`) y su `level` debe ser
  `JEFE` (`400` si se envía otro).
- No se puede degradar/desactivar al último `ADMIN` activo (409).
- Cambiar `role` o `isActive` incrementa `tokenVersion` e invalida las sesiones del usuario.

### Query params `GET /users`
`type?`, `level?`, `setId?`, `search?` (name/email, case-insensitive),
`limit` (1–100, default 20), `offset` (≥0, default 0), `sortBy` (default `createdAt`),
`sortOrder` (`asc`|`desc`, default `desc`).

### Body `POST /users`
`{ email, password (min 6), name (min 2), type?, role?, level?, setId? }`

### Body `PATCH /users/:id`
Todos opcionales: `name?`, `type?`, `role?`, `level?`, `setId?`, `isActive?`

## Groups

### Grupo propio (tenant)

| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| GET | `/groups/me` | `ADMIN`+ | grupo del JWT con `_count` de users/sets/activities |
| PATCH | `/groups/me` | `ADMIN`+ | editar `name`, `number`, `city` del propio grupo |

### Plataforma (`SUPER_ADMIN`)

| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| GET | `/groups` | `SUPER_ADMIN` | listado global paginado |
| GET | `/groups/:id` | `SUPER_ADMIN` | detalle de cualquier grupo |
| POST | `/groups` | `SUPER_ADMIN` | crear grupo (slug autogenerado) |
| PATCH | `/groups/:id` | `SUPER_ADMIN` | editar, incluido `isActive` |
| DELETE | `/groups/:id` | `SUPER_ADMIN` | baja lógica (`isActive=false`) |

### Query params `GET /groups`
`search?` (name/number/city), `limit`, `offset`, `sortBy`, `sortOrder`.

### Body `POST /groups`
`{ name (min 2), number (String, min 1), city (min 2), admin: { email, password (min 6),
name (min 2) } }` — crea el grupo y su primer `ADMIN` en una transacción.
Si el email ya existe, `409`.

### Body `PATCH /groups/:id`
Todos opcionales: `name?`, `number?`, `city?`, `isActive?`.
`isActive` solo lo aplica el `SUPER_ADMIN` por la ruta de plataforma.

### Acceso de plataforma a rutas de grupo
El `SUPER_ADMIN` debe enviar el header `X-Group-Id: <groupId>` en `/users`, `/sets` y
`/groups/me`. Sin el header responde `403`; si el grupo no existe o está inactivo, `404`.
Cada acceso queda auditado en el log.

## Sets

Todas requieren `authenticate` + `requireGroup` (scoped al grupo del JWT).

| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| GET | `/sets` | cualquier autenticado | listado paginado/filtrado del grupo |
| GET | `/sets/:id` | cualquier autenticado | detalle con `_count` de users (404 si es de otro grupo) |
| POST | `/sets` | `DIRIGENTE`+ | crear |
| PATCH | `/sets/:id` | `DIRIGENTE`+ | editar |
| DELETE | `/sets/:id` | `ADMIN`+ | borrado físico |

### Query params `GET /sets`
`level?` (`LOBATO`|`SCOUT`|`CAMINANTE`|`ROVER`), `search?` (name, case-insensitive),
`limit`, `offset`, `sortBy` (`createdAt`|`updatedAt`|`name`|`level`), `sortOrder`.

### Body `POST /sets` / `PATCH /sets/:id`
`{ name (min 2), level (UserLevel) }` — en PATCH todos opcionales.

- `level` es la rama de la sección; no admite `JEFE` (`400`).
- Cambiar el `level` de una sección con miembros de otro nivel responde `409`.
- Al asignar un usuario a la sección, su `level` se alinea con `set.level`.

El `groupId` sale del contexto de autenticación; no se acepta en el body.

## Activities

Todas requieren `authenticate` + `requireGroup` (scoped al grupo del JWT).

| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| GET | `/activities` | cualquier autenticado | listado paginado/filtrado del grupo |
| GET | `/activities/:id` | cualquier autenticado | detalle (404 si es de otro grupo) |
| POST | `/activities` | `DIRIGENTE`+ | crear |
| PATCH | `/activities/:id` | `DIRIGENTE`+ | editar |
| DELETE | `/activities/:id` | `ADMIN`+ | borrado físico; arrastra sus completions |

### Query params `GET /activities`
`level?` (`LOBATO`|`SCOUT`|`CAMINANTE`|`ROVER`|`JEFE`), `search?` (name/key,
case-insensitive), `limit`, `offset`, `sortBy`
(`createdAt`|`updatedAt`|`name`|`key`|`level`|`points`|`scheduledAt`), `sortOrder`.

### Body `POST /activities` / `PATCH /activities/:id`
`{ name (min 2), key (min 2), level (UserLevel), points (int ≥ 0), description?,
scheduledAt? (ISO 8601) }` — en PATCH todos opcionales y `scheduledAt: null` lo limpia.

`key` es único por grupo: si se repite, `409`.

## Completions

Todas requieren `authenticate` + `requireGroup` (scoped al grupo del JWT).

| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| GET | `/completions` | cualquier autenticado | listado paginado/filtrado del grupo |
| POST | `/completions` | cualquier autenticado | registrar una completion |

### Query params `GET /completions`
`activityId?`, `userId?`, `setId?`, `limit`, `offset`, `sortBy`
(`completedAt`|`earnedPoints`, default `completedAt`), `sortOrder`.

### Body `POST /completions`
`{ activityId, userId?, setId?, earnedPoints?, completedAt? (ISO 8601) }`

- `userId` omitido → se registra para el usuario autenticado.
- `earnedPoints` omitido → usa `activity.points`; no puede superarlos (`400`).
- Un usuario no puede completar dos veces la misma actividad (`409`).
- `BENEFICIARIO` solo puede registrarse a sí mismo y a su propio `setId` (`403`).
- Actividad, usuario y set deben pertenecer al grupo (`404`).
- El `level` de la sección debe coincidir con el `level` de la actividad (`400`).
- `DIRIGENTE`+ puede registrar para cualquier usuario del grupo, indicando `setId`.

## Payments

Todas requieren `authenticate` + `requireGroup` (scoped al grupo del JWT).

| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| GET | `/payments` | cualquier autenticado | listado paginado/filtrado |
| GET | `/payments/:id` | cualquier autenticado | detalle (404 si es de otro grupo o de otro usuario) |
| POST | `/payments` | `DIRIGENTE`+ | registrar pago |
| DELETE | `/payments/:id` | `ADMIN`+ | borrado físico |

### Query params `GET /payments`
`userId?`, `search?` (concept), `from?`/`to?` (ISO 8601 sobre `paidAt`), `limit`,
`offset`, `sortBy` (`createdAt`|`paidAt`|`amount`|`concept`), `sortOrder`.

`BENEFICIARIO` solo ve y lee sus propios pagos (el resto 404).

### Body `POST /payments`
`{ userId, amount (número positivo, 2 decimales), concept (min 2), currency? (ISO 4217,
default `ARS`), paidAt? (ISO 8601) }`

`amount` se serializa como string decimal (comportamiento de Prisma `Decimal`).

## Progressions

Todas requieren `authenticate` + `requireGroup` (scoped al grupo del JWT).

| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| GET | `/progressions` | cualquier autenticado | listado paginado/filtrado |
| GET | `/progressions/:id` | cualquier autenticado | detalle (404 si es de otro grupo o usuario) |
| POST | `/progressions` | `DIRIGENTE`+ | registrar ascenso pendiente |
| PATCH | `/progressions/:id/approve` | `DIRIGENTE`+ | aprobar y actualizar el nivel del usuario |
| DELETE | `/progressions/:id` | `ADMIN`+ | borrado físico |

### Query params `GET /progressions`
`userId?`, `status?` (`pending`|`approved`), `limit`, `offset`, `sortBy`
(`createdAt`|`approvedAt`), `sortOrder`.

`BENEFICIARIO` solo ve sus propias progresiones.

### Body `POST /progressions`
`{ userId, toLevel (UserLevel) }`

`fromLevel` se toma del nivel actual del usuario; `toLevel` debe ser superior (`400`).
Aprobar dos veces o aprobar una progresión cuyo `fromLevel` ya no coincide con el nivel
actual devuelve `409`.

### Body `PATCH /progressions/:id/approve`
`{ setId? (string | null) }` — sección de la nueva rama.

- `setId` con una sección de otro nivel → `400`; si no es del grupo → `404`.
- `setId: null` desasigna la sección.
- Si se omite, se conserva la sección actual **solo** si su `level` coincide con
  `toLevel`; si no coincide, `400` (hay que reasignar explícitamente).
- Pasar a `JEFE` limpia la sección.

## Dashboard

No hay endpoint de dashboard: los agregados (puntos, ranking por tipo de sección,
actividad reciente) se calculan en el frontend sobre `users`, `sets`, `activities` y
`completions`, todos ya scoped por `groupId`.

## Códigos de error comunes

| Código | Caso |
|--------|------|
| 400 | validación de body o query fallida (incluye `details`) |
| 401 | token faltante, inválido o expirado |
| 403 | rol insuficiente, usuario sin grupo o `SUPER_ADMIN` sin `X-Group-Id` |
| 404 | recurso no encontrado (scoped a grupo, no se filtra existencia cross-tenant) |
| 409 | email, `key` de actividad o completion duplicados; progresión ya aprobada o nivel desactualizado; cambio de nivel de sección con miembros inconsistentes; intento de dejar al grupo sin administradores |
| 500 | error no manejado |

## Notas de producción

- Cookie `refresh_token` tiene `Path=/api/v1/auth`; se envía solo a ese path.
- Cookie `access_token` tiene `Path=/api/` (vía nginx `proxy_cookie_path`) para cubrir todos los endpoints de la API.
- Los errores 500 no exponen mensajes internos en `NODE_ENV=production`.
