# Runbook — Scouts YP

Operación y troubleshooting del stack.

## Requisitos

- Docker Desktop (o Docker Engine + Compose)
- Node.js 20+ / npm
- `.env` en la raíz (ver `.env.example`) y `server/.env` para dev local

## Arranque (local, Docker Compose)

```bash
make up            # docker compose up -d
make logs          # seguir logs (Ctrl+C para salir)
make migrate       # prisma migrate deploy (dentro del contenedor api)
make seed          # admin@scouts.dev / admin123
```

La app queda en `http://localhost` (nginx). API directa: `http://localhost/api/v1/health`.

### Desarrollo (sin Docker)

```bash
npm start                      # frontend Angular en http://localhost:4200
cd server && npm run dev       # API en http://localhost:3000 (requiere Postgres en 5433)
```

## Full-stack (Railway)

```bash
make fullstack       # docker build -t scouts-yp-fullstack .
make fullstack-run   # docker run -p 8080:80 --env-file .env  → http://localhost:8080
```

> Nota: para `fullstack-run` local, `DATABASE_URL` del `.env` apunta a
> `localhost:5433`; si corres el full-stack fuera de la red del compose, usa
> `postgresql://scouts_yp:<pw>@host.docker.internal:5433/scouts_yp`.

## Base de datos

| Comando | Descripción |
|---------|-------------|
| `make psql` | consola psql dentro del contenedor |
| `make backup` | `pg_dump` a `backups/scouts_yp_<timestamp>.sql` |
| `cd server && npm run db:studio` | Prisma Studio |
| `cd server && npm run db:migrate:prod` | aplicar migraciones |

## Troubleshooting

### `exec /usr/local/bin/docker-entrypoint.sh: no such file or directory`
La API no arranca al levantar el contenedor. Causa: **CRLF** en
`server/docker-entrypoint.sh` (Windows). El shebang `#!/bin/sh\r` no existe en Linux.
Fix: convertir a LF (`*.sh eol=lf` ya forzado por `.gitattributes`).

### Prisma: `Could not locate the Query Engine for runtime "linux-musl-openssl-3.0.x"`
Causa: el cliente se generó para otra plataforma. Fix: `binaryTargets` en
`schema.prisma` debe incluir `"linux-musl-openssl-3.0.x"` y regenerar
(`npx prisma generate`) en el build.

### Prisma: `Can't write to /app/node_modules/@prisma/engines`
Causa: contenedor corre como usuario no-root y no puede escribir en `node_modules`.
Fix: `chown -R app:app /app` en el runtime del Dockerfile.

### `Unhandled error` y el proceso muere (500 o 502) en endpoints con 404/409
Causa: Express 4 no captura errores de handlers async. **Todo** handler async debe
envolverse con `asyncHandler` (ver `server/src/common/middleware/async-handler.ts`).

### `Cannot find module ... dist/config/env.js` al arrancar la API
Causa: tsup con `bundle: false` solo emitía `index.js`. Fix: `bundle: true` en
`server/tsup.config.ts`.

### `Could not resolve "dotenv"` en el build del server
Causa: `dotenv` no estaba declarado en `server/package.json` (se resolvía por hoisting).
Fix: `npm install dotenv` dentro de `server/`.

### nginx: `[emerg] "server" directive is not allowed here in /etc/nginx/conf.d/default.conf:1`
Causa: el paquete `nginx` de Alpine incluye `conf.d/*.conf` en contexto raíz (no en
`http {}`). Fix: copiar el site a `/etc/nginx/http.d/` (ver `Dockerfile` raíz).

### Login responde 500 / JSON malformado al usar `curl` en PowerShell
Causa: PowerShell altera las comillas del body `-d '{"a":"b"}'`. Fix: usar
`--data-binary "@archivo.json"`.

### Refresh no funciona detrás de nginx
Verificar `proxy_cookie_path ~^/$ /api/` en la config de nginx. La forma vieja
`proxy_cookie_path / /api/` rompía la cookie de refresh (`/api/api/v1/auth`).

### El frontend usa Firebase aunque la API esté arriba
Es el estado esperado: **Phase 8 (Firebase decommission)** aún pendiente. Ver
`SESSION_STATE.md`.

## Despliegue en Railway

1. Proyecto nuevo → conectar repo.
2. Plugin **PostgreSQL** (inyecta `DATABASE_URL`).
3. Servicio desde el `Dockerfile` de la raíz.
4. Variables: `JWT_SECRET`, `JWT_REFRESH_SECRET` (≥16 chars), `CORS_ORIGIN` opcional.
5. Dominio público en Settings (HTTPS automático; las cookies usan `Secure`).
6. Migraciones automáticas en cada deploy (`railway-entrypoint.sh`).
