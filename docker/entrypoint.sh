#!/bin/sh
set -e

echo "[entrypoint] Running Prisma migrations..."
npx prisma@5.22.0 migrate deploy || {
  echo "[entrypoint] ERROR: Prisma migrate deploy failed"
  exit 1
}

echo "[entrypoint] Starting application..."
exec node server.js
