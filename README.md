# Scouts YP - Sistema de Gestion Scout

Aplicacion web para la gestion de beneficiarios, grupos y actividades scout.

## Caracteristicas

- **Autenticacion**: Registro y login con email/password
- **Gestion de Grupos**: CRUD completo de Grupos Scouts
- **Gestion de Secciones**: CRUD de secciones por grupo
- **Gestion de Actividades**: CRUD de actividades con puntos
- **Gestion de Usuarios**: CRUD con permisos diferenciados por rol
- **Dashboard Personalizado**: Segun tipo de usuario (Dirigente/Beneficiario)
- **Sistema de Puntos**: Seguimiento de actividades completadas

## Permisos por Rol

| Funcion | Dirigente | Beneficiario |
|---------|-----------|-------------|
| Ver dashboard | ✅ | ✅ |
| Ver todas las secciones | ✅ | Solo su grupo |
| Ver todas las actividades | ✅ | Solo su nivel |
| Crear/Editar/Eliminar | ✅ | ❌ |
| Completar actividades | ✅ | Solo grupo propio |

## Tech Stack

- **Framework**: Angular 20+ (standalone components)
- **Backend**: Express + TypeScript + Prisma + PostgreSQL (`server/`)
- **Autenticacion**: JWT con httpOnly cookies (refresh rotation)
- **Estado**: RxJS + Angular Signals
- **Estilos**: CSS custom
- **Contenedores**: Docker Compose (postgres + api + frontend + nginx)

## Arquitectura Dockerizada

El repositorio ofrece dos formas de desplegar:

1. **Docker Compose (local/servidor)** — 4 servicios: `postgres`, `api`, `frontend`, `nginx`
   ```bash
   make up       # docker compose up -d
   make migrate  # prisma migrate deploy (dentro del contenedor api)
   make seed     # crea admin@scouts.dev / admin123
   ```
   La app queda en `http://localhost` (nginx sirve frontend y proxya `/api/`).

2. **Imagen full-stack (Railway/cloud)** — un solo contenedor con nginx + API
   ```bash
   make fullstack        # docker build -t scouts-yp-fullstack .
   make fullstack-run    # prueba local en http://localhost:8080
   ```
   Un solo dominio, sin problemas de CORS ni cookies entre servicios.

## Despliegue en Railway

La imagen full-stack (`Dockerfile` en la raiz) esta preparada para Railway.

1. Crear proyecto en [Railway](https://railway.app) y conectar el repositorio.
2. Agregar el plugin **PostgreSQL** (Railway inyecta `DATABASE_URL` automaticamente).
3. Agregar el servicio con el **Dockerfile de la raiz** (Railway lo detecta solo).
4. Configurar variables en el servicio:
   | Variable | Valor |
   |----------|-------|
   | `JWT_SECRET` | secreto de al menos 16 caracteres |
   | `JWT_REFRESH_SECRET` | secreto de al menos 16 caracteres |
   | `CORS_ORIGIN` | dominio generado por Railway (o dejarlo por defecto) |
   | `NODE_ENV` | `production` (por defecto) |
5. Generar un dominio publico en la pestaña *Settings* del servicio.
6. Las migraciones corren automaticamente en cada deploy (`railway-entrypoint.sh`).

> **Nota:** las cookies de autenticacion usan el flag `Secure`, por lo que se
> requiere HTTPS (Railway lo provee gratis en el dominio generado).

> **Pendiente (Phase 8):** el frontend todavia consume Firebase para auth y
> datos. Al completar la migracion a la nueva API (`/api/v1`), el frontend
> dejara de depender de Firebase y todo quedara dentro del mismo dominio.

> **Estado (Nov 2026):** el refactor de backend y la dockerizacion estan en
> pausa. La app productiva es la de **Vercel** (Firebase Auth + Firestore).

## Carga de datos historicos

`scripts/seed-activities.mjs` carga actividades y puntajes por patrulla en
Firestore. Es idempotente: usa IDs de documento determinísticos, asi que
correrlo dos veces sobreescribe en vez de duplicar.

```bash
# 1. Descargar la service account desde Firebase Console
#    Configuracion del proyecto -> Cuentas de servicio -> Generar nueva clave privada
#    Guardarla como service-account.json en la raiz (esta en .gitignore)

# 2. Probar sin escribir
npm run seed:activities -- --key=./service-account.json --dry-run

# 3. Escribir
npm run seed:activities -- --key=./service-account.json
```

Tambien acepta `GOOGLE_APPLICATION_CREDENTIALS` o Application Default
Credentials si no se pasa `--key`.

Los sets se matchean por nombre (sin distinguir acentos ni mayusculas) y se
prioriza `type = Patrulla`. Si algun set no existe, el script aborta sin
escribir nada y lista los sets disponibles.

## Permisos por Rol

## Estructura del Proyecto

```
src/app/
├── auth/                    # Autenticacion
│   ├── components/          # Login, Register
│   ├── services/            # AuthService
│   └── auth.guard.ts        # Proteccion de rutas
├── dashboard/               # Dashboard principal
├── users/                   # Gestion de usuarios
│   ├── components/          # List, Detail, Form
│   ├── models/              # User, UserType, UserLevel
│   └── services/            # UserService
├── groups/                  # Gestion de grupos
├── sets/                    # Gestion de secciones
├── activities/             # Gestion de actividades
└── shared/                 # Componentes compartidos
    ├── components/          # Navbar, Footer, Alert
    ├── services/           # NavigationService
    └── utils/              # Firestore utilities
```

## Modelo de Datos

El esquema relacional completo (10 modelos) esta en `server/prisma/schema.prisma`.
Incluye: Organization, User, Group, Set, Activity, ActivityCompletion, Payment,
RefreshToken y Progression. Cada entidad esta scoped por `organizationId`
(multi-tenant).

## Comandos Disponibles

| Comando | Descripcion |
|--------|-------------|
| `make up` | Levantar el stack completo (postgres + api + frontend + nginx) |
| `make down` | Detener el stack |
| `make logs` | Ver logs del stack |
| `make migrate` | Ejecutar migraciones de Prisma |
| `make seed` | Sembrar datos iniciales (admin@scouts.dev / admin123) |
| `make backup` | Volcar la base de datos a `backups/` |
| `make fullstack` | Construir la imagen full-stack para Railway |
| `npm start` | Frontend: servidor de desarrollo Angular |
| `cd server && npm run dev` | Backend: API en modo desarrollo (tsx watch) |
| `cd server && npm run db:studio` | Prisma Studio |
| `cd server && npm run test:run` | Tests unitarios del backend (vitest) |

## Contribucion

1. Fork del repositorio
2. Crear branch: `git checkout -b feature/nueva-caracteristica`
3. Commit: `git commit -m 'feat: descripcion'`
4. Push: `git push origin feature/nueva-caracteristica`
5. Crear Pull Request

## Licencia

ISC