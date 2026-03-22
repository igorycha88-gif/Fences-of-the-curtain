#!/bin/bash
set -e

APP_DIR="/root/Fences-of-the-curtain"
APP_NAME="fences-app"
LOG_DIR="/var/log/fences-deploy"
DEPLOY_LOG="$LOG_DIR/deploy.log"

mkdir -p "$LOG_DIR"

log_rollback() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] [ROLLBACK] $1" | tee -a "$DEPLOY_LOG"
}

cd "$APP_DIR"

if [ -z "$1" ]; then
  echo "Usage: ./scripts/rollback.sh <commit-hash-or-tag>"
  echo ""
  echo "Available backup tags:"
  git tag -l "deploy-backup-*" | sort -r | head -5
  echo ""
  echo "Recent commits:"
  git log --oneline -5
  exit 1
fi

TARGET="$1"
log_rollback "=== MANUAL ROLLBACK STARTED ==="
log_rollback "Target: $TARGET"
log_rollback "Current: $(git rev-parse HEAD)"

log_rollback "=== Resetting to $TARGET ==="
git reset --hard "$TARGET"

log_rollback "=== Installing dependencies ==="
npm install --legacy-peer-deps
npx prisma generate

log_rollback "=== Building application ==="
npm run build

log_rollback "=== Restarting application ==="
pm2 reload ecosystem.config.js --env production || pm2 restart ecosystem.config.js --env production
pm2 save

log_rollback "=== Health check ==="
for i in $(seq 1 10); do
  sleep 5
  if curl -sf --max-time 5 http://localhost:3001/ > /dev/null 2>&1; then
    log_rollback "Health check passed on attempt $i!"
    log_rollback "=== ROLLBACK SUCCESSFUL ==="
    pm2 list
    exit 0
  fi
  log_rollback "Attempt $i/10 failed..."
done

log_rollback "=== ROLLBACK FAILED ==="
pm2 logs $APP_NAME --lines 50 --nostream || true
exit 1
