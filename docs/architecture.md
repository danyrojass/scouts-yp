# Arquitectura — Scouts YP

## Visión general

Aplicación web de gestión scout (beneficiarios, grupos, secciones, actividades) con
arquitectura **multi-tenant**: cada organización es dueña de sus datos y todo query
está scoped por `organizationId` extraído del JWT.

El proyecto está en un refactor que **migra de Firebase** (auth + Firestore) a una
**API propia** (Express + PostgreSQL). El backend ya está migrado; el frontend aún
consume Firebase (Phase 8).

```
┌──────────────┐      /api/v1/*      ┌──────────────┐      ┌─────────────┐
│   Browser    │ ───────────────────►│    nginx     │─────►│   Angular   │
│  (Angular)   │                     │ (reverse px) │      │  (static)   │
└──────────────┘                     └──────┬───────┘      └─────────────┘
                                            │ /api/v1/*
                                            ▼
                                     ┌──────────────┐      ┌─────────────┐
                                     │   Express    │─────►│ PostgreSQL  │
                                     │ (Prisma)     │      │  (Prisma)   │
                                     └──────────────┘      └─────────────┘
```

## Despliegue — dos topologías

### 1. Docker Compose (multi-servicio) — `docker-compose.yml`

4 contenedores en la red `scouts-network`:

| Servicio   | Imagen / build               | Puerto | Rol |
|------------|------------------------------|--------|-----|
| `postgres` | `postgres:16-alpine`         | 5433 (host) | base de datos |
| `api`      | `server/Dockerfile`          | 3000 (interno) | API Express |
| `frontend` | `frontend.Dockerfile`        | 80 (interno) | Angular estático (nginx) |
| `nginx`    | `nginx:alpine`               | 80/443 | reverse proxy + TLS |

- `nginx/nginx.conf` proxya `/api/` → `api:3000` y el resto → `frontend:80`.
- La cookie `refresh_token` se conserva en `/api/v1/auth`; la de access se reescribe a `/api/` (`proxy_cookie_path ~^/$ /api/`).
- `api` corre migraciones al arrancar (`server/docker-entrypoint.sh`).
- Base de datos persistida en el volumen `pgdata`; backups a `backups/`.

### 2. Imagen full-stack (Railway/cloud) — `Dockerfile` raíz

Un solo contenedor: nginx sirve el frontend y proxya `/api/` a `127.0.0.1:3000`
(misma imagen, mismo dominio). Evita problemas de CORS y cookies cross-origin.

- `nginx/railway.conf` va a `/etc/nginx/http.d/` (el paquete `nginx` de Alpine incluye `http.d/*.conf` dentro de `http {}`; `conf.d/*.conf` va en contexto raíz).
- `railway-entrypoint.sh`: migraciones → arranca nginx → arranca node (PID 1).
- Railway inyecta `DATABASE_URL` desde el plugin PostgreSQL; `PORT` queda 3000 (interno) y nginx escucha 80.

## Backend (`server/`)

- **Lenguaje**: TypeScript ESM, imports con `.js`.
- **Framework**: Express 4. **Importante**: los handlers async SIEMPRE se envuelven con `asyncHandler` (`src/common/middleware/async-handler.ts`); Express 4 no captura rechazos de promesas y el proceso muere con un 404/409.
- **ORM**: Prisma (`prisma/schema.prisma`, 10 modelos). `binaryTargets` incluye `linux-musl-openssl-3.0.x` (Alpine + OpenSSL 3).
- **Build**: `tsup` con `bundle: true` → `dist/index.js` autocontenido (deps externas resueltas desde `node_modules`).
- **Validación**: DTOs con `class-validator` (`validateDto` para body, `validateQuery` para query params).
- **Errores**: excepciones propias (`HttpException`, `NotFound`, `Unauthorized`, `Forbidden`) manejadas centralizadamente en `error-handler.ts`.
- **Logs**: Winston (`common/logger/logger.ts`).
- **Config**: Zod + dotenv (`config/env.ts`); variables inválidas abortan el arranque.

### Módulos

| Módulo | Estado | Archivos |
|--------|--------|----------|
| `health` | ✅ | health.controller/routes |
| `auth` | ✅ | register, login, refresh, logout, me |
| `users` | ✅ | CRUD + soft delete |
| `groups` | ✅ | CRUD + búsqueda |
| `sets` | ✅ | CRUD + filtros (type/groupId/search) |
| `activities` + `completions` | ❌ | Phase 5 |
| `payments` + `progression` | ❌ | Phase 6 |
| `dashboard` | ❌ | Phase 7 |

## Frontend (`src/`)

- Angular 20 standalone, lazy loading, `authGuard`.
- Servicios de features (`auth`, `users`, `groups`, `sets`, `activities`) todavía usan `@angular/fire` (Phase 8 pendiente).
- `set-env.js` genera `environment.prod.ts` a partir de variables `FIREBASE_*`.

## Autenticación

- JWT: `access_token` (15 min) + `refresh_token` (7 días) en cookies httpOnly, `SameSite=Lax`, `Secure` en producción.
- Rotación de refresh tokens: cada refresh revoca el anterior y emite uno nuevo (tabla `refresh_tokens`).
- El middleware `authenticate` acepta cookie `access_token` **o** header `Authorization: Bearer <token>`.
- `requireTenant` inyecta `req.organizationId`; `requireRole(...roles)` valida el rol del JWT.

## Decisiones clave (ADR)

1. **Multi-tenant por `organizationId`** en cada entidad; registro crea organización propia.
2. **Cookies httpOnly en lugar de localStorage** para mitigar XSS.
3. **Contenedor full-stack para Railway** (single domain) para no romper cookies httpOnly entre servicios.
4. **Soft delete de usuarios** (`isActive=false`) en vez de borrado físico; grupos sí se borran físicamente.
5. **Express 4 + `asyncHandler`**: se mantuvo Express 4 (deps existentes) con wrapper en vez de migrar a Express 5.

## Modelo de datos

Prisma (`server/prisma/schema.prisma`): `Organization`, `User`, `Group`, `Set`,
`Activity`, `ActivityCompletion`, `Payment`, `RefreshToken`, `Progression`.

Relaciones principales: `Organization` 1—N usuarios/grupos/sets/actividades/pagos;
`Group` 1—N `Set` y `User`; `User` N—M `Activity` vía `ActivityCompletion`;
`User` 1—N `Payment`, `RefreshToken`, `Progression`.
