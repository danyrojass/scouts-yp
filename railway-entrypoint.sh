#!/bin/sh
set -e

echo "Running database migrations..."
npx prisma migrate deploy

echo "Starting nginx..."
nginx

echo "Starting application..."
exec "$@"
