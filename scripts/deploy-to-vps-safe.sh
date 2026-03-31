#!/bin/bash
# Safe Production Deployment Script for master2 → VPS
# Features: backup, migration, build, health check, rollback
set -e

# =============================================================================
# CONFIGURATION
# =============================================================================
APP_DIR="/root/Fences-of-the-curtain"
BACKUP_DIR="$APP_DIR/backups"
LOG_FILE="/var/log/fences-deploy/deploy_$(date +%Y%m%d_%H%M%S).log"
ROLLBACK_TAG="pre-deploy-$(date +%Y%m%d_%H%M%S)"
BRANCH="master2"
PORT=3001

# Database
DB_USER="postgres"
DB_NAME="fences"
DB_PASS="HVt6G6LE6mduMrAny91F"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# =============================================================================
# FUNCTIONS
# =============================================================================
log() { echo -e "${GREEN}[$(date '+%H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1" | tee -a "$LOG_FILE"; }
error() { echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"; }
info() { echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$LOG_FILE"; }

rollback() {
    error "=== ROLLBACK INITIATED ==="
    log "Stopping PM2..."
    pm2 stop fences-app 2>/dev/null || true

    log "Restoring git to $ROLLBACK_TAG..."
    cd "$APP_DIR" && git checkout "$ROLLBACK_TAG" 2>/dev/null || git checkout fd52d2a

    log "Restoring database from latest backup..."
    LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/backup_before_deploy_*.dump 2>/dev/null | head -1)
    if [ -n "$LATEST_BACKUP" ]; then
        PGPASSWORD="$DB_PASS" pg_restore -U "$DB_USER" -h localhost -d "$DB_NAME" --clean --if-exists "$LATEST_BACKUP" 2>/dev/null
        log "Database restored from $LATEST_BACKUP"
    fi

    log "Rebuilding..."
    cd "$APP_DIR" && npm ci && npx prisma generate && npm run build

    log "Restarting PM2..."
    pm2 restart fences-app

    log "Waiting for app to start..."
    sleep 5

    if curl -sf "http://localhost:$PORT/api/health" > /dev/null 2>&1; then
        log "=== ROLLBACK SUCCESSFUL ==="
    else
        error "=== ROLLBACK FAILED - MANUAL INTERVENTION REQUIRED ==="
        exit 1
    fi
    exit 1
}

trap 'rollback' ERR

# =============================================================================
# PRE-DEPLOY CHECKS
# =============================================================================
log "=== SAFE DEPLOYMENT: master2 → Production ==="
log "Branch: $BRANCH"
log "Rollback tag: $ROLLBACK_TAG"
log ""

# Create log directory
mkdir -p "$(dirname "$LOG_FILE")"

# Check we're on VPS
if [ ! -d "$APP_DIR" ]; then
    error "App directory not found: $APP_DIR"
    exit 1
fi

cd "$APP_DIR"

# Step 1: Create DB backup
log "=== Step 1: Database Backup ==="
BACKUP_FILE="$BACKUP_DIR/backup_before_deploy_$(date +%Y%m%d_%H%M%S).dump"
PGPASSWORD="$DB_PASS" pg_dump -U "$DB_USER" -h localhost -d "$DB_NAME" --format=custom --compress=9 -f "$BACKUP_FILE"
if [ -f "$BACKUP_FILE" ]; then
    log "✅ Backup created: $BACKUP_FILE ($(du -h "$BACKUP_FILE" | cut -f1))"
else
    error "Backup failed!"
    exit 1
fi

# Step 2: Create git rollback point
log ""
log "=== Step 2: Git Rollback Point ==="
CURRENT_COMMIT=$(git rev-parse --short HEAD)
log "Current commit: $CURRENT_COMMIT"
git tag "$ROLLBACK_TAG"
log "✅ Rollback tag created: $ROLLBACK_TAG"

# Step 3: Pull latest changes
log ""
log "=== Step 3: Pull Latest Changes ==="
git fetch origin
git checkout "$BRANCH"
git reset --hard "origin/$BRANCH"
NEW_COMMIT=$(git rev-parse --short HEAD)
log "✅ Updated to commit: $NEW_COMMIT"
git log --oneline -3

# Step 4: Install dependencies
log ""
log "=== Step 4: Install Dependencies ==="
npm ci --production=false
log "✅ Dependencies installed"

# Step 5: Generate Prisma client
log ""
log "=== Step 5: Generate Prisma Client ==="
npx prisma generate
log "✅ Prisma client generated"

# Step 6: Run migrations
log ""
log "=== Step 6: Database Migrations ==="
MIGRATION_STATUS=$(npx prisma migrate status 2>&1)
log "$MIGRATION_STATUS"

if echo "$MIGRATION_STATUS" | grep -q "Database schema is up to date"; then
    log "✅ No pending migrations"
else
    log "Running migrations..."
    MIGRATION_BACKUP="$BACKUP_DIR/backup_before_migration_$(date +%Y%m%d_%H%M%S).dump"
    PGPASSWORD="$DB_PASS" pg_dump -U "$DB_USER" -h localhost -d "$DB_NAME" --format=custom -f "$MIGRATION_BACKUP"
    npx prisma migrate deploy
    log "✅ Migrations applied (backup: $MIGRATION_BACKUP)"
fi

# Step 7: Build application
log ""
log "=== Step 7: Build Application ==="
rm -rf .next
npm run build
log "✅ Build successful"

# Step 8: Restart PM2
log ""
log "=== Step 8: Restart Application ==="
pm2 delete fences-app 2>/dev/null || true
pm2 start ecosystem.config.js --env production
pm2 save
log "✅ PM2 restarted"

# Step 9: Health check
log ""
log "=== Step 9: Health Check ==="
log "Waiting for app to start..."
sleep 5

HEALTH_OK=false
for i in $(seq 1 5); do
    if curl -sf "http://localhost:$PORT/api/health" > /dev/null 2>&1; then
        HEALTH_OK=true
        break
    fi
    log "Attempt $i/5 - waiting..."
    sleep 3
done

if [ "$HEALTH_OK" = true ]; then
    log "✅ Health check passed!"
    curl -s "http://localhost:$PORT/api/health" | head -200
else
    error "Health check failed after 5 attempts!"
    warn "Check PM2 logs: pm2 logs fences-app --lines 50"
    warn "To rollback: git checkout $ROLLBACK_TAG && npm run build && pm2 restart fences-app"
    exit 1
fi

# Step 10: Summary
log ""
log "=== DEPLOYMENT SUCCESSFUL ==="
log "Commit: $CURRENT_COMMIT → $NEW_COMMIT"
log "Backup: $BACKUP_FILE"
log "Rollback tag: $ROLLBACK_TAG"
log "Log file: $LOG_FILE"
log ""
log "To rollback if needed:"
log "  cd $APP_DIR"
log "  git checkout $ROLLBACK_TAG"
log "  npm ci && npx prisma generate && npm run build"
log "  pm2 restart fences-app"
log "  # Restore DB: PGPASSWORD='$DB_PASS' pg_restore -U $DB_USER -h localhost -d $DB_NAME --clean --if-exists $BACKUP_FILE"
