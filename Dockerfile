# ---- Stage 1: Frontend build ----
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

COPY package.json package-lock.json .npmrc ./
RUN npm ci

COPY angular.json tsconfig.json tsconfig.app.json tsconfig.spec.json set-env.js ./
COPY src ./src

ARG API_URL=/api/v1
ENV API_URL=$API_URL

RUN npm run build

# ---- Stage 2: API build ----
FROM node:20-alpine AS api-builder

WORKDIR /app/server

COPY server/package.json server/package-lock.json ./
RUN npm ci

COPY server/prisma ./prisma
RUN npx prisma generate

COPY server/tsconfig.json server/tsup.config.ts ./
COPY server/src ./src
RUN npm run build

# ---- Stage 3: Runtime (nginx + node) ----
FROM node:20-alpine AS runtime

RUN apk add --no-cache nginx openssl libc6-compat curl

WORKDIR /app

COPY --from=api-builder /app/server/node_modules ./node_modules
COPY --from=api-builder /app/server/dist ./dist
COPY --from=api-builder /app/server/prisma ./prisma
COPY server/package.json ./package.json

COPY nginx/railway.conf /etc/nginx/http.d/default.conf
COPY --from=frontend-builder /app/frontend/dist/scouts-yp/browser /usr/share/nginx/html

COPY railway-entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 80

ENV NODE_ENV=production

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["node", "dist/index.js"]
