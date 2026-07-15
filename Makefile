.PHONY: up down build restart logs psql seed migrate status

# ─── Production (Docker) ───────────────────────────────────────

up:
	docker compose up -d

down:
	docker compose down

build:
	docker compose build

restart:
	docker compose restart

logs:
	docker compose logs -f

status:
	docker compose ps

# ─── Database ──────────────────────────────────────────────────

psql:
	docker compose exec postgres psql -U scouts_yp -d scouts_yp

migrate:
	docker compose exec api npx prisma migrate deploy

seed:
	docker compose exec api npx prisma db seed

backup:
	docker compose exec postgres pg_dump -U scouts_yp scouts_yp > backups/scouts_yp_$$(date +%Y%m%d_%H%M%S).sql

# ─── Development (Local) ──────────────────────────────────────

dev-api:
	cd server && npm run dev

dev-frontend:
	npm start

db-studio:
	cd server && npx prisma studio

db-migrate-dev:
	cd server && npx prisma migrate dev

db-generate:
	cd server && npx prisma generate

# ─── Production Build ──────────────────────────────────────────

deploy: build up migrate seed
	@echo "Deployment complete"
