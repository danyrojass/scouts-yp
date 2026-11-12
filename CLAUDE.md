# Scouts YP

Aplicación web de gestión scout: beneficiarios, grupos, secciones y actividades.

## Stack

- **Frontend**: Angular 20 (standalone components), RxJS + signals, CSS custom
- **Backend**: Express + TypeScript (ESM) + Prisma + PostgreSQL (`server/`)
- **Auth**: JWT en httpOnly cookies (access 15min, refresh 7d con rotación)
- **Infra**: Docker Compose (postgres + api + frontend + nginx) + imagen full-stack para Railway

## Estado del refactor

El backend está migrado de Firebase a una API propia (multi-tenant por **Grupo**, roles). El **frontend todavía consume Firebase** (Phase 8 pendiente). Detalle por fases en `SESSION_STATE.md`.

## Comandos

```bash
make up               # levantar stack completo (http://localhost)
make down             # detener stack
make logs             # logs del stack
make migrate          # prisma migrate deploy
make seed             # seed admin@scouts.dev / admin123
make backup           # volcado de BD a backups/
make fullstack        # build imagen full-stack (Railway)
make fullstack-run    # probar full-stack en http://localhost:8080

npm start                         # frontend dev (Angular, puerto 4200)
cd server && npm run dev          # API dev (tsx watch, puerto 3000)
cd server && npm run lint         # tsc --noEmit
cd server && npm run test:run     # vitest
cd server && npm run db:studio    # Prisma Studio
```

## Endpoints

Todos bajo `/api/v1` vía nginx. `GET /api/v1/health` para health check.
Referencia completa en `docs/api-reference.md`.

## Reglas de negocio

- **Roles** (jerárquicos): `BENEFICIARIO` < `DIRIGENTE` < `ADMIN` < `SUPER_ADMIN`
  - Listar/ver: cualquier usuario autenticado (scoped a su grupo)
  - Crear/editar: `DIRIGENTE` y `ADMIN` (un `DIRIGENTE` no gestiona `ADMIN`)
  - Eliminar (soft delete) y configuración del grupo: solo `ADMIN`
  - `SUPER_ADMIN`: plataforma, sin grupo propio; opera con header `X-Group-Id` (validado y auditado)
- **Multi-tenant**: toda entidad tiene `groupId`; los queries SIEMPRE están scoped por el grupo del JWT (middleware `requireGroup`). El `groupId` nunca sale del body/query.
- **Registro público**: solo crea Grupo + usuario `ADMIN`. El resto de miembros los da de alta un dirigente.
- **Niveles**: `LOBATO`, `SCOUT`, `CAMINANTE`, `ROVER`, `JEFE`
- **SetType**: `SEISENA`, `PATRULLA`, `EQUIPO`, `CLAN`
- Grupos: `number` es String (ej. "001")

## Convenciones del código

- Backend ESM: imports con extensión `.js` (`import x from './foo.js'`)
- Errores: lanzar `HttpException`/`NotFoundException`/`UnauthorizedException`/`ForbiddenException` desde services; handlers async SIEMPRE envueltos en `asyncHandler` (Express 4 no captura async)
- DTOs con `class-validator`; query params validados con `validateQuery`; body con `validateDto`
- Shell scripts deben usar **LF** (`.gitattributes` lo fuerza; CRLF rompe el shebang en Linux)
- Prisma: `binaryTargets` incluye `linux-musl-openssl-3.0.x` (imprescindible en Alpine)
- Cambios de infraestructura → actualizar `docs/runbook.md`, `docs/architecture.md`, `docs/api-reference.md` y `SESSION_STATE.md`

## Docs

- `docs/architecture.md` — arquitectura y decisiones
- `docs/api-reference.md` — contratos y endpoints
- `docs/runbook.md` — operación y troubleshooting
- `docs/glossary.md` — términos del dominio
- `SESSION_STATE.md` — estado del refactor por fases
