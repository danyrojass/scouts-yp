# Arquitectura — Scouts YP

## 1. Qué es el sistema

Scouts YP es una aplicación web para la **gestión del programa juvenil scout**. Le
permite a un Grupo Scout administrar sus miembros (beneficiarios y dirigentes), sus
secciones, el catálogo de actividades, los puntajes acumulados, las cuotas y los
ascensos de nivel, con un dashboard de seguimiento.

El sistema nació como app de **un solo grupo** y hoy el backend es una **plataforma
multi-grupo**: cada Grupo Scout es un *tenant* aislado y la aplicación se sirve desde
un único dominio.

### Estado del proyecto

El proyecto está en un refactor que **migra de Firebase** (Auth + Firestore) a una
**API propia** (Express + PostgreSQL). El backend ya está migrado y verificado; el
frontend todavía consume Firebase (Fase G pendiente). Por eso conviven hoy dos
topologías: la app productiva en Vercel (Firebase) y el backend dockerizado, listo
para el cutover.

## 2. Actores y roles

| Rol | Alcance | Capacidades |
|---|---|---|
| `BENEFICIARIO` | Su grupo | Ver el grupo y sus compañeros; registrarse actividades a sí mismo; ver **solo sus** pagos y ascensos |
| `DIRIGENTE` | Su grupo | Gestionar beneficiarios, secciones, actividades y completions; registrar pagos y pedir/aprobar ascensos. No puede crear ni editar `ADMIN` |
| `ADMIN` | Su grupo | Todo lo del dirigente + baja de usuarios, borrado de entidades y configuración del grupo ("Mi grupo") |
| `SUPER_ADMIN` | Plataforma | Crear/dar de baja grupos y su primer admin; operar dentro de un grupo con `X-Group-Id` (validado y auditado) |

Los roles son jerárquicos: `BENEFICIARIO < DIRIGENTE < ADMIN < SUPER_ADMIN`.

## 3. Capacidades funcionales

### 3.1 Onboarding y autenticación

- Alta pública de un grupo nuevo: crea el Grupo + su usuario `ADMIN` en una
  transacción. Se puede deshabilitar en producción con
  `ALLOW_PUBLIC_REGISTRATION=false`.
- Login/logout, refresh con rotación de token, `GET /auth/me` y cambio de contraseña
  (`PATCH /auth/password`), que invalida todas las sesiones del usuario.
- El `SUPER_ADMIN` da de alta grupos y su primer administrador, también en una
  transacción.

### 3.2 Grupo (tenant)

- Datos del grupo: nombre, número, ciudad, slug autogenerado y estado
  activo/inactivo.
- `GET/PATCH /groups/me` para que el admin edite su propio grupo.
- Rutas globales de plataforma solo para `SUPER_ADMIN`: listado, alta, edición y baja
  lógica.

### 3.3 Miembros

- CRUD de usuarios con paginado, búsqueda y filtros por tipo, nivel y sección.
- Soft delete (`isActive=false`); no se puede dejar al grupo sin ningún admin activo.
- Importación masiva desde CSV/Excel en el frontend (`xlsx`).
- Niveles: `LOBATO`, `SCOUT`, `CAMINANTE`, `ROVER`, `JEFE`.

### 3.4 Secciones

- Seisena, Patrulla, Equipo y Clan, correspondientes a las ramas Lobato, Scout,
  Caminante y Rover respectivamente. La sección guarda su `level` y el nombre de la
  unidad se deriva de una constante (`UNIT_NAME_BY_LEVEL`).
- Cada beneficiario pertenece a una sección; las secciones son la unidad de
  agrupamiento para rankings y métricas.
- Los dirigentes (`JEFE`) no pertenecen a una sección.

### 3.5 Actividades

- Catálogo por nivel, con `key` única por grupo, puntos (entero ≥ 0), descripción y
  fecha programada.
- CRUD con filtros por nivel/búsqueda y orden configurable.

### 3.6 Completions y puntajes

- Registro de que un usuario completó una actividad, con puntos ganados y fecha.
- Una completion por usuario+actividad; los puntos no pueden superar los de la
  actividad.
- El beneficiario solo puede registrarse a sí mismo y a su sección; el dirigente puede
  registrar a cualquier usuario del grupo.

### 3.7 Pagos

- Registro de cuotas/pagos con monto decimal, concepto, moneda (ARS por defecto) y
  fecha.
- El beneficiario solo ve sus propios pagos; el dirigente ve todos los del grupo.

### 3.8 Progresiones (ascensos)

- Se registra un ascenso pendiente (`fromLevel` actual → `toLevel` superior) y un
  dirigente lo aprueba; al aprobar se actualiza el nivel del usuario en la misma
  transacción.
- La aprobación acepta `setId` para reasignar la sección a la nueva rama; `null` la
  desasigna y, si se omite, solo se conserva cuando ya coincide con `toLevel`. Pasar a
  `JEFE` limpia la sección.
- Reaprobar o aprobar sobre un nivel desactualizado devuelve `409`.

### 3.9 Dashboard

- No tiene endpoint propio: los agregados (puntos, ranking y actividad reciente) se
  calculan en el frontend sobre endpoints ya scoped.
- Ranking **separado por tipo de sección**, para comparar pares del mismo tipo;
  medallas por grupo.

## 4. Reglas de negocio transversales

- **Aislamiento por tenant:** todo query filtra por `groupId`; un recurso de otro grupo
  responde **404** (no se filtra su existencia).
- El `groupId` **nunca** se acepta desde el body/query: sale del JWT.
- Las FKs (`setId`, `activityId`, `userId`) se validan contra el grupo.
- `tokenVersion` invalida sesiones al cambiar rol, grupo o estado, sin esperar el
  vencimiento del JWT.
- Un grupo inactivo no puede loguear a sus miembros.
- Nadie puede asignarse `SUPER_ADMIN` por API.
- No se puede degradar ni desactivar al último `ADMIN` activo del grupo.

## 5. Arquitectura de despliegue

### 5.1 Situación actual: sistema en transición

| Capa | Producción (Vercel) | Backend nuevo (listo, sin cutover) |
|---|---|---|
| Frontend | Angular 20 SPA | El mismo Angular, todavía con servicios de Firestore |
| Auth | Firebase Auth | JWT propio con cookies httpOnly |
| Datos | Firestore | PostgreSQL + Prisma |
| Hosting | Vercel | Docker (Compose local / imagen full-stack para Railway) |

### 5.2 Docker Compose (multi-servicio) — `docker-compose.yml`

4 contenedores en la red `scouts-network`:

| Servicio | Imagen / build | Puerto | Rol |
|----------|----------------|--------|-----|
| `postgres` | `postgres:16-alpine` | 5433 (host) | base de datos |
| `api` | `server/Dockerfile` | 3000 (interno) | API Express |
| `frontend` | `frontend.Dockerfile` | 80 (interno) | Angular estático (nginx) |
| `nginx` | `nginx:alpine` | 80/443 | reverse proxy + TLS |

- `nginx/nginx.conf` proxya `/api/` → `api:3000` y sirve el resto desde
  `frontend:80`.
- La cookie `refresh_token` se conserva en `/api/v1/auth`; la de access se reescribe a
  `/api/` (`proxy_cookie_path ~^/$ /api/`).
- `api` corre migraciones al arrancar (`server/docker-entrypoint.sh`).
- Base de datos persistida en el volumen `pgdata`; backups a `backups/`.

### 5.3 Imagen full-stack (Railway/cloud) — `Dockerfile` raíz

Un solo contenedor: nginx sirve el frontend y proxya `/api/` a `127.0.0.1:3000`
(misma imagen, mismo dominio). Evita problemas de CORS y cookies cross-origin.

- `nginx/railway.conf` va a `/etc/nginx/http.d/` (el paquete `nginx` de Alpine incluye
  `http.d/*.conf` dentro de `http {}`; `conf.d/*.conf` va en contexto raíz).
- `railway-entrypoint.sh`: migraciones → arranca nginx → arranca node.
- Railway inyecta `DATABASE_URL` desde el plugin PostgreSQL; `PORT` queda 3000
  (interno) y nginx escucha 80.

```
Browser ──► nginx ──┬── /api/* ──► Express (Prisma) ──► PostgreSQL
                    └── /*     ──► Angular estático
```

## 6. Backend (`server/`)

- **Lenguaje**: TypeScript ESM, imports con `.js`.
- **Framework**: Express 4. **Importante**: los handlers async SIEMPRE se envuelven con
  `asyncHandler` (`src/common/middleware/async-handler.ts`); Express 4 no captura
  rechazos de promesas y el proceso muere con un 404/409.
- **ORM**: Prisma (`prisma/schema.prisma`). `binaryTargets` incluye
  `linux-musl-openssl-3.0.x` (Alpine + OpenSSL 3).
- **Build**: `tsup` con `bundle: true` → `dist/index.js` autocontenido.
- **Validación**: DTOs con `class-validator` (`validateDto` para body, `validateQuery`
  para query params).
- **Errores**: excepciones propias (`HttpException`, `NotFound`, `Unauthorized`,
  `Forbidden`) manejadas centralizadamente en `error-handler.ts`.
- **Logs**: Winston (`common/logger/logger.ts`).
- **Config**: Zod + dotenv (`config/env.ts`); variables inválidas abortan el arranque.

### 6.1 Flujo de un request

```
route → authenticate → requireGroup → requireRole/requireAtLeast
      → validateDto/validateQuery → controller → service → Prisma → PostgreSQL
                                                        └→ error-handler → respuesta estándar
```

Respuesta uniforme: `{ success, data }` / `{ success: false, error: { message, details? } }`.

### 6.2 Módulos

| Módulo | Estado | Archivos |
|--------|--------|----------|
| `health` | ✅ | health.controller/routes |
| `auth` | ✅ | register, login, refresh, logout, me, change password |
| `users` | ✅ | CRUD + soft delete |
| `groups` | ✅ | `/me`, CRUD de plataforma, alta con admin inicial |
| `sets` | ✅ | CRUD + filtros (level/search) |
| `activities` + `completions` | ✅ | CRUD de actividades + registro de completions (scoped) |
| `payments` + `progressions` | ✅ | pagos y ascensos (scoped, con aprobación) |
| `dashboard` | n/a | agregados en el frontend sobre endpoints scoped |

## 7. Frontend (`src/`)

- Angular 20 standalone, lazy loading por feature, `authGuard`.
- Features: `auth`, `dashboard`, `users` (list/detail/form/import), `groups`, `sets`,
  `activities` (list/detail/form/complete).
- Estado con RxJS + Angular Signals.
- Los services de features (`auth`, `users`, `groups`, `sets`, `activities`) todavía
  usan `@angular/fire` (Fase G pendiente).
- `set-env.js` genera `environment.prod.ts` a partir de variables `FIREBASE_*`.

## 8. Autenticación

- JWT: `access_token` (15 min) + `refresh_token` (7 días) en cookies httpOnly,
  `SameSite=Lax`, `Secure` en producción.
- Rotación de refresh tokens: cada refresh revoca el anterior y emite uno nuevo (tabla
  `refresh_tokens`).
- El middleware `authenticate` acepta cookie `access_token` **o** header
  `Authorization: Bearer <token>`; además valida `isActive` y `tokenVersion` contra la
  base (invalida sesiones al cambiar rol, grupo o estado).
- `requireGroup` inyecta `req.groupId`. Para roles de grupo sale siempre del JWT; el
  `SUPER_ADMIN` debe enviar `X-Group-Id`, que se valida contra la base y se audita.
- `requireRole(...roles)` exige un rol exacto; `requireAtLeast(role)` usa la jerarquía
  `BENEFICIARIO < DIRIGENTE < ADMIN < SUPER_ADMIN`.

## 9. Modelo de datos

Prisma (`server/prisma/schema.prisma`): 8 modelos.

```
Group (tenant)
 ├─1:N─ User            (groupId; null solo para SUPER_ADMIN)
 ├─1:N─ Set             (secciones)
 ├─1:N─ Activity        (catálogo)
 ├─1:N─ Payment
 └─1:N─ Progression

User ──N:M── Activity   vía ActivityCompletion (puntos, fecha, setId)
User ──1:N── RefreshToken
```

- `Group` es el tenant: 1—N usuarios, sets, actividades, completions, pagos y
  progresiones.
- `ActivityCompletion` cascadea al borrar la actividad y pone `setId` en null si se
  borra la sección.
- `Payment.amount` es `Decimal` (se serializa como string).
- Solo `SUPER_ADMIN` puede tener `groupId` nulo (constraint `users_group_required`).

## 10. Decisiones clave (ADR)

1. **Multi-tenant por `groupId`** en cada entidad; el registro/alta crea Grupo + usuario
   `ADMIN`. Un usuario pertenece a un solo grupo; `SUPER_ADMIN` es el único rol sin
   grupo.
2. **Cookies httpOnly en lugar de localStorage** para mitigar XSS.
3. **Contenedor full-stack para Railway** (single domain) para no romper cookies
   httpOnly entre servicios.
4. **Soft delete de usuarios** (`isActive=false`) en vez de borrado físico; grupos sí se
   dan de baja lógicamente.
5. **Express 4 + `asyncHandler`**: se mantuvo Express 4 (deps existentes) con wrapper en
   vez de migrar a Express 5.
6. **Secciones por nivel (`Set.level`), sin `SetType`** (implementado). El tipo de
   unidad es 1:1 con la rama: Lobato→Seisena, Scout→Patrulla, Caminante→Equipo,
   Rover→Clan; los dirigentes (`JEFE`) no tienen sección. Por eso `SetType` era un
   enum derivado que no debía guardarse como dato: duplicaba `User.level` y permitía
   estados inconsistentes (un `LOBATO` en un `CLAN`, o un ascenso aprobado que dejaba
   al usuario en una sección de su rama anterior). La implementación reemplazó
   `Set.type` por `Set.level` (solo las cuatro ramas juveniles), deriva el nombre
   visible de `UNIT_NAME_BY_LEVEL` y valida que el nivel del usuario coincida con el de
   su sección. La unidad modelada es la **unidad chica** del programa
   (Seisena/Patrulla/Equipo/Clan), no la unidad de rama (Manada/Tropa/Comunidad).

## 11. Estado y pendientes

- ✅ Backend multi-grupo completo (Fases A–F) y verificado contra DB temporal.
- ✅ Dockerización armada (Compose + imagen full-stack) y validada localmente.
- ⏳ **Fase G:** migrar el frontend de Firestore a la API (bloqueante para el cutover).
- ⏳ **Fase H:** tests cross-tenant automatizados, rate limit en auth, auditoría de
  `SUPER_ADMIN`, cierre de `firestore.rules`.
- ⏳ **Fase D:** import xlsx en backend e invitaciones (opcional).
- Antes del próximo deploy: resetear/migrar la DB dev (la migración inicial fue
  regenerada).
