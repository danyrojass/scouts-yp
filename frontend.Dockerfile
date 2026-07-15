# ---- Build Stage ----
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY .npmrc ./
RUN npm ci

COPY angular.json tsconfig*.json set-env.js ./
COPY src ./src

ARG API_URL=/api/v1
ENV API_URL=$API_URL

RUN npm run build

# ---- Production Stage ----
FROM nginx:alpine

RUN addgroup -S app && adduser -S --ingroup app app

COPY --from=builder /app/dist/scouts-yp/browser /usr/share/nginx/html
COPY nginx/frontend.conf /etc/nginx/conf.d/default.conf

RUN chown -R app:app /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html && \
    touch /var/run/nginx.pid && \
    chown -R app:app /var/run/nginx.pid /var/cache/nginx

USER app

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
