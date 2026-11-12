# API Reference — Scouts YP

Base URL: `/api/v1` (vía nginx en local; misma imagen full-stack en Railway).

Autenticación: JWT en cookies httpOnly (`access_token`, `refresh_token`) **o**
header `Authorization: Bearer <token>`.

## Enums

| Enum | Valores |
|------|---------|
| `UserType` | `BENEFICIARIO`, `DIRIGENTE` |
| `Role` | `BENEFICIARIO`, `DIRIGENTE`, `ADMIN` |
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
Body: `{ email, password, name, organizationName?, type?, level? }`
Crea organización propia (slug autogenerado) y usuario `ADMIN`.
```
201 { "success": true, "data": { "user": {...} } }  + Set-Cookie
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
200 { "success": true, "data": { "user": {...} } }
404 "User not found"
```

## Users

Todas requieren `authenticate` + `requireTenant` (scoped a la organización del JWT).

| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| GET | `/users` | cualquier autenticado | listado paginado/filtrado |
| GET | `/users/:id` | cualquier autenticado | detalle |
| POST | `/users` | `DIRIGENTE`, `ADMIN` | crear |
| PATCH | `/users/:id` | `DIRIGENTE`, `ADMIN` | editar |
| DELETE | `/users/:id` | `ADMIN` | soft delete (`isActive=false`) |

### Query params `GET /users`
`type?`, `level?`, `groupId?`, `setId?`, `search?` (name/email, case-insensitive),
`limit` (1–100, default 20), `offset` (≥0, default 0), `sortBy` (default `createdAt`),
`sortOrder` (`asc`|`desc`, default `desc`).

### Body `POST /users`
`{ email, password (min 6), name (min 2), type?, role?, level?, groupId?, setId? }`

### Body `PATCH /users/:id`
Todos opcionales: `name?`, `type?`, `role?`, `level?`, `groupId?`, `setId?`, `isActive?`

## Groups

Todas requieren `authenticate` + `requireTenant`.

| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| GET | `/groups` | cualquier autenticado | listado paginado |
| GET | `/groups/:id` | cualquier autenticado | detalle con `_count` de users/sets |
| POST | `/groups` | `DIRIGENTE`, `ADMIN` | crear |
| PATCH | `/groups/:id` | `DIRIGENTE`, `ADMIN` | editar |
| DELETE | `/groups/:id` | `ADMIN` | borrado físico |

### Query params `GET /groups`
`search?` (name/number/city), `limit`, `offset`, `sortBy`, `sortOrder`.

### Body `POST /groups` / `PATCH /groups/:id`
`{ name (min 2), number (String, min 1), city (min 2) }` — todos opcionales en PATCH.

## Sets

Todas requieren `authenticate` + `requireTenant`.

| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| GET | `/sets` | cualquier autenticado | listado paginado/filtrado |
| GET | `/sets/:id` | cualquier autenticado | detalle con grupo y `_count` de users |
| POST | `/sets` | `DIRIGENTE`, `ADMIN` | crear |
| PATCH | `/sets/:id` | `DIRIGENTE`, `ADMIN` | editar |
| DELETE | `/sets/:id` | `ADMIN` | borrado físico |

### Query params `GET /sets`
`type?` (`SEISENA`|`PATRULLA`|`EQUIPO`|`CLAN`), `groupId?`, `search?` (name,
case-insensitive), `limit`, `offset`, `sortBy`, `sortOrder`.

### Body `POST /sets` / `PATCH /sets/:id`
`{ name (min 2), type (SetType), groupId }` — en PATCH todos opcionales.

El `groupId` debe pertenecer a la misma organización; si no, responde `404 "Group not found"`.

## Códigos de error comunes

| Código | Caso |
|--------|------|
| 400 | validación de body o query fallida (incluye `details`) |
| 401 | token faltante, inválido o expirado |
| 403 | rol insuficiente (`ForbiddenException`) |
| 404 | recurso no encontrado (scoped a tenant) |
| 409 | email duplicado |
| 500 | error no manejado |

## Notas de producción

- Cookie `refresh_token` tiene `Path=/api/v1/auth`; se envía solo a ese path.
- Cookie `access_token` tiene `Path=/api/` (vía nginx `proxy_cookie_path`) para cubrir todos los endpoints de la API.
- Los errores 500 no exponen mensajes internos en `NODE_ENV=production`.
