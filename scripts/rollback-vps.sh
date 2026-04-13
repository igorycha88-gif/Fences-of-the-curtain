#!/bin/bash
set -euo pipefail

# ==============================================================================
# Instant Rollback Script for VPS
# Usage: rollback-vps.sh <IMAGE_TAG> [REASON]
#
# Pulls the specified image from GHCR and replaces the running container.
# No rebuild needed — image is pre-built in CI.
# ==============================================================================

APP_DIR="/root/Fences-of-the-curtain"
BLUE_PORT=3001
NGINX_UPSTREAM_FILE="/etc/nginx/conf.d/fences-upstream.conf"
LOG_DIR="/var/log/fences-deploy"
IMAGE_TAG="${1:-}"
ROLLBACK_REASON="${2:-Manual rollback}"

if [ -z "$IMAGE_TAG" ]; then
    echo "Usage: rollback-vps.sh <IMAGE_TAG> [REASON]"
    echo ""
    echo "Available images:"
    docker images --format "table {{.Repository}}:{{.Tag}}\t{{.CreatedAt}}\t{{.Size}}" | grep fences-curtain || \
    docker images --format "table {{.Repository}}:{{.Tag}}\t{{.CreatedAt}}\t{{.Size}}" | head -10
    exit 1
fi

mkdir -p "$LOG_DIR"
ROLLBACK_LOG="$LOG_DIR/rollback-$(date +%Y%m%d-%H%M%S).log"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$ROLLBACK_LOG"; }
fatal() { log "FATAL: $1"; exit 1; }

ROLLBACK_START=$(date +%s)
cd "$APP_DIR" || fatal "App dir not found"

GHCR_REGISTRY="ghcr.io"
GHCR_REPO="${GITHUB_REPOSITORY:-igor/Fences-of-the-curtain}"
GHCR_IMAGE="${GHCR_REGISTRY}/${GHCR_REPO,,}/app:${IMAGE_TAG}"

log "============================================"
log "ROLLBACK STARTED"
log "============================================"
log "Target image: $GHCR_IMAGE"
log "Reason: $ROLLBACK_REASON"

# ── 1. Save current state ────────────────────────────────────────────────────

CURRENT_IMAGE=$(docker inspect --format='{{.Config.Image}}' fences-app 2>/dev/null || echo "none")
log "Current image: $CURRENT_IMAGE"

# ── 2. DB backup before rollback ─────────────────────────────────────────────

BACKUP_FILE="$APP_DIR/backups/db_pre_rollback_$(date +%Y%m%d_%H%M%S).sql.gz"
pg_dump -U postgres -h 127.0.0.1 fences 2>/dev/null | gzip > "$BACKUP_FILE" 2>/dev/null || \
    sudo -u postgres pg_dump -U postgres fences 2>/dev/null | gzip > "$BACKUP_FILE" 2>/dev/null || \
    log "WARN: DB backup failed"
[ -f "$BACKUP_FILE" ] && log "DB backup: $(du -h "$BACKUP_FILE" | cut -f1)"

# ── 3. Pull rollback image ──────────────────────────────────────────────────

log "Pulling rollback image..."
if ! docker pull "$GHCR_IMAGE" 2>&1 | tail -3; then
    log "Checking if image exists locally..."
    if ! docker image inspect "$GHCR_IMAGE" &>/dev/null; then
        fatal "Image not found: $GHCR_IMAGE"
    fi
    log "Using locally cached image"
fi

# ── 4. Replace container ─────────────────────────────────────────────────────

log "Stopping current container..."
docker stop fences-app 2>/dev/null || true
docker rm fences-app 2>/dev/null || true

log "Starting rollback container..."
docker run -d \
    --name fences-app \
    --network host \
    --restart unless-stopped \
    --env-file "$APP_DIR/.env" \
    -e PORT=${BLUE_PORT} \
    -e NODE_ENV=production \
    -v /var/www/uploads:/app/public/uploads \
    "$GHCR_IMAGE"

# ── 5. Health check ──────────────────────────────────────────────────────────

log "Waiting for health check..."
HEALTH_OK=0
for i in $(seq 1 24); do
    if curl -sf --max-time 5 "http://127.0.0.1:${BLUE_PORT}/api/health" 2>/dev/null | grep -q '"status":"ok"'; then
        log "Health check passed (attempt $i)"
        HEALTH_OK=1
        break
    fi
    if [ $((i % 4)) -eq 0 ]; then
        log "  Still waiting... ($i attempts)"
    fi
    sleep 5
done

if [ "$HEALTH_OK" -eq 0 ]; then
    log "FATAL: Rollback health check failed"
    log "Restoring previous container..."
    docker stop fences-app 2>/dev/null || true
    docker rm fences-app 2>/dev/null || true
    docker run -d \
        --name fences-app \
        --network host \
        --restart unless-stopped \
        --env-file "$APP_DIR/.env" \
        -e PORT=${BLUE_PORT} \
        -e NODE_ENV=production \
        -v /var/www/uploads:/app/public/uploads \
        "$CURRENT_IMAGE"
    sleep 15
    log "Previous container restored"
    docker logs fences-app --tail=30 2>&1 | tee -a "$ROLLBACK_LOG"
    fatal "Rollback failed — restored previous version"
fi

# ── 6. Switch nginx ──────────────────────────────────────────────────────────

mkdir -p /etc/nginx/conf.d
cat > "$NGINX_UPSTREAM_FILE" <<EOF
upstream app {
    server 127.0.0.1:${BLUE_PORT};
    keepalive 32;
}
EOF

nginx -t 2>&1 && nginx -s reload 2>&1
log "Nginx reloaded"

# ── 7. Success ───────────────────────────────────────────────────────────────

ROLLBACK_TIME=$(( $(date +%s) - ROLLBACK_START ))
log "============================================"
log "ROLLBACK SUCCESSFUL"
log "============================================"
log "Time: ${ROLLBACK_TIME}s"
log "From: $CURRENT_IMAGE"
log "To: $GHCR_IMAGE"

docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Image}}" | grep fences || true
curl -s "http://127.0.0.1:${BLUE_PORT}/api/health"

log "=== ROLLBACK FINISHED ==="
