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
| `SetType` | `SEISENA`, `PATRULLA`, `EQUIPO`, `CLAN` |

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

### Body `POST /groups` / `PATCH /groups/:id`
`{ name (min 2), number (String, min 1), city (min 2), isActive? }` — todos opcionales en PATCH.
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
`type?` (`SEISENA`|`PATRULLA`|`EQUIPO`|`CLAN`), `search?` (name, case-insensitive),
`limit`, `offset`, `sortBy`, `sortOrder`.

### Body `POST /sets` / `PATCH /sets/:id`
`{ name (min 2), type (SetType) }` — en PATCH todos opcionales.

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
- `DIRIGENTE`+ puede registrar para cualquier usuario del grupo, indicando `setId`.

## Códigos de error comunes

| Código | Caso |
|--------|------|
| 400 | validación de body o query fallida (incluye `details`) |
| 401 | token faltante, inválido o expirado |
| 403 | rol insuficiente, usuario sin grupo o `SUPER_ADMIN` sin `X-Group-Id` |
| 404 | recurso no encontrado (scoped a grupo, no se filtra existencia cross-tenant) |
| 409 | email, `key` de actividad o completion duplicados; intento de dejar al grupo sin administradores |
| 500 | error no manejado |

## Notas de producción

- Cookie `refresh_token` tiene `Path=/api/v1/auth`; se envía solo a ese path.
- Cookie `access_token` tiene `Path=/api/` (vía nginx `proxy_cookie_path`) para cubrir todos los endpoints de la API.
- Los errores 500 no exponen mensajes internos en `NODE_ENV=production`.
