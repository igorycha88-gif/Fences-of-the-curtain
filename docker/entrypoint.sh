#!/bin/sh
set -e

echo "[entrypoint] Checking database connectivity..."
MAX_RETRIES=10
RETRY_COUNT=0
DB_READY=false

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if echo "SELECT 1;" | npx prisma@5.22.0 db execute --stdin 2>/dev/null; then
        DB_READY=true
        echo "[entrypoint] Database is ready (attempt $RETRY_COUNT)"
        break
    fi
    echo "[entrypoint] Database not ready, retrying in 3s... (attempt $RETRY_COUNT/$MAX_RETRIES)"
    sleep 3
done

if [ "$DB_READY" = "false" ]; then
    echo "[entrypoint] FATAL: Database is not available after $MAX_RETRIES attempts"
    exit 1
fi

echo "[entrypoint] Running Prisma migrations..."
if ! npx prisma@5.22.0 migrate deploy; then
    echo "[entrypoint] FATAL: Prisma migrate deploy failed"
    echo "[entrypoint] Check migration logs above for details"
    exit 1
fi

echo "[entrypoint] Starting application..."
exec node server.js
