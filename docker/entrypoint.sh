#!/bin/sh
set -e

echo "[entrypoint] Fixing upload directory permissions..."
chown -R nextjs:nodejs /app/public/uploads 2>/dev/null || true

echo "[entrypoint] Checking database connectivity..."
MAX_RETRIES=10
RETRY_COUNT=0
DB_READY=false

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if npx prisma@5.22.0 db execute --stdin <<'SQL' 2>/dev/null; then
SELECT 1;
SQL
        DB_READY=true
        echo "[entrypoint] Database is ready (attempt $RETRY_COUNT)"
        break
    fi
    echo "[entrypoint] Database not ready, retrying in 3s... (attempt $RETRY_COUNT/$MAX_RETRIES)"
    sleep 3
done

if [ "$DB_READY" = "false" ]; then
    echo "[entrypoint] WARNING: Database check failed, proceeding anyway..."
fi

echo "[entrypoint] Syncing database schema..."
if ! npx prisma@5.22.0 db push --skip-generate 2>&1; then
    echo "[entrypoint] WARNING: Prisma db push failed, trying migrate deploy as fallback..."
    if ! npx prisma@5.22.0 migrate deploy 2>&1; then
        echo "[entrypoint] WARNING: Prisma migrate deploy also failed"
    fi
fi

echo "[entrypoint] Starting application..."
exec gosu nextjs node server.js
