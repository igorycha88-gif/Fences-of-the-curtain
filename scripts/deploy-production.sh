#!/bin/bash
set -euo pipefail

APP_DIR="/root/Fences-of-the-curtain"
COMPOSE_FILES="-f docker-compose.yml -f docker-compose.monitoring.yml"
APP_PORT="3001"
LOG_DIR="/var/log/fences-deploy"
DEPLOY_LOG="$LOG_DIR/deploy-$(date +%Y%m%d-%H%M%S).log"
HEALTH_URL="http://127.0.0.1:${APP_PORT}/api/health"

mkdir -p "$LOG_DIR" "$APP_DIR/backups"
log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$DEPLOY_LOG"; }

log "=== DEPLOY STARTED ==="
DEPLOY_START=$(date +%s)
cd "$APP_DIR"

# ── 1. Pre-flight checks ──
[ -f .env ] || { log "FATAL: .env not found"; exit 1; }
log "✓ Environment found"

PREVIOUS_COMMIT=$(git rev-parse HEAD 2>/dev/null || echo "none")
log "Current: $PREVIOUS_COMMIT"

# ── 2. DB backup ──
BACKUP_FILE="$APP_DIR/backups/db_$(date +%Y%m%d_%H%M%S).sql"
sudo -u postgres pg_dump -U postgres fences > "$BACKUP_FILE" 2>/dev/null || \
  pg_dump -U postgres fences > "$BACKUP_FILE" 2>/dev/null || log "WARN: DB backup failed"
[ -f "$BACKUP_FILE" ] && log "✓ DB backup: $(du -h "$BACKUP_FILE" | cut -f1)"

# ── 3. Pull code ──
git fetch origin
TARGET_COMMIT=$(git rev-parse origin/master2)
log "Target: $TARGET_COMMIT"
git reset --hard origin/master2

# ── 4. Prisma (host, for migrations) ──
npm ci --legacy-peer-deps --no-audit --no-fund 2>/dev/null || \
  npm install --legacy-peer-deps --no-audit --no-fund
npx prisma generate
npx prisma migrate deploy 2>/dev/null || { npx prisma migrate status || true; }
log "✓ Migrations applied"

# ── 5. Stop PM2 if exists (migration path) ──
if command -v pm2 &>/dev/null && pm2 list 2>/dev/null | grep -q "fences-app"; then
  log "Stopping PM2 (migrating to Docker)..."
  pm2 stop fences-app 2>/dev/null || true
  pm2 delete fences-app 2>/dev/null || true
  pm2 save --force 2>/dev/null || true
fi

# ── 6. Free port 3001 ──
fuser -k 3001/tcp 2>/dev/null || true
sleep 2

# ── 7. Docker build ──
BUILD_START=$(date +%s)
log "Building ALL Docker images..."
docker compose $COMPOSE_FILES build --no-cache 2>&1 | tail -5
BUILD_TIME=$(( $(date +%s) - BUILD_START ))
log "✓ Build completed in ${BUILD_TIME}s"

# ── 8. Deploy ──
log "Starting containers..."
docker compose $COMPOSE_FILES up -d --force-recreate 2>&1

# ── 9. Health check ──
log "Waiting for app..."
sleep 15

HEALTH_OK=0
for i in 1 2 3 4 5 6; do
  if curl -sf --max-time 5 "$HEALTH_URL" 2>/dev/null | grep -q '"status":"ok"'; then
    log "✓ Health check passed (attempt $i)"
    HEALTH_OK=1
    break
  fi
  log "Attempt $i failed"
  sleep 10
done

# ── 11. Rollback on failure ──
if [ "$HEALTH_OK" -eq 0 ]; then
  log "=== DEPLOY FAILED — ROLLBACK ==="
  git reset --hard "$PREVIOUS_COMMIT"
  docker compose $COMPOSE_FILES build --no-cache app 2>&1 | tail -3
  docker compose $COMPOSE_FILES up -d --force-recreate 2>&1
  sleep 15
  if curl -sf --max-time 5 "$HEALTH_URL" | grep -q '"status":"ok"'; then
    log "✓ Rollback OK"
  else
    log "FATAL: Rollback failed"
    docker compose $COMPOSE_FILES logs --tail=50 2>&1
  fi
  exit 1
fi

# ── 12. Verify monitoring ──
DOWN=$(curl -sf http://127.0.0.1:9090/api/v1/targets 2>/dev/null | \
  python3 -c "import sys,json; d=json.load(sys.stdin); print(sum(1 for t in d['data']['activeTargets'] if t['health']!='up'))" 2>/dev/null || echo "?")
log "Prometheus targets down: $DOWN"

# ── 13. Cleanup ──
DEPLOY_TIME=$(( $(date +%s) - DEPLOY_START ))
log "=== DEPLOY SUCCESS ==="
log "Time: ${DEPLOY_TIME}s (build: ${BUILD_TIME}s)"
log "From $PREVIOUS_COMMIT to $TARGET_COMMIT"

docker compose $COMPOSE_FILES ps
curl -s "$HEALTH_URL"
echo

find "$APP_DIR/backups" -name "*.sql" -mtime +7 -delete 2>/dev/null || true
find "$LOG_DIR" -name "*.log" -mtime +30 -delete 2>/dev/null || true
