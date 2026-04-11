#!/bin/bash
set -euo pipefail

# ==============================================================================
# Blue-Green Deploy Script for VPS
# Called via SSH from GitHub Actions
#
# Usage: deploy-vps.sh <IMAGE_TAG> [COMMIT_SHA] [DEPLOY_REASON]
#
# Blue-Green strategy:
#   1. Pull new image from GHCR
#   2. Start GREEN container on port 3003
#   3. Wait for GREEN health check (migrations run in entrypoint)
#   4. If healthy → switch nginx upstream → reload nginx
#   5. Stop BLUE (old) container
#   6. Run smoke tests
#   7. If smoke tests fail → auto rollback
# ==============================================================================

APP_DIR="/root/Fences-of-the-curtain"
BLUE_PORT=3001
GREEN_PORT=3003
NGINX_UPSTREAM_FILE="/etc/nginx/conf.d/fences-upstream.conf"
LOG_DIR="/var/log/fences-deploy"
HEALTH_TIMEOUT=120
HEALTH_INTERVAL=5
SMOKE_TIMEOUT=30
IMAGE_TAG="${1:-latest}"
COMMIT_SHA="${2:-unknown}"
DEPLOY_REASON="${3:-Automated deploy}"

mkdir -p "$LOG_DIR" "$APP_DIR/backups"
DEPLOY_LOG="$LOG_DIR/deploy-$(date +%Y%m%d-%H%M%S).log"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$DEPLOY_LOG"; }
fatal() { log "FATAL: $1"; exit 1; }

DEPLOY_START=$(date +%s)
cd "$APP_DIR" || fatal "App dir not found: $APP_DIR"

GHCR_IMAGE="ghcr.io/\${GITHUB_REPOSITORY:-igor/fences-curtain}/app:${IMAGE_TAG}"

log "============================================"
log "BLUE-GREEN DEPLOY STARTED"
log "============================================"
log "Image tag: $IMAGE_TAG"
log "Commit: $COMMIT_SHA"
log "Reason: $DEPLOY_REASON"
log "Initiator: ${GITHUB_ACTOR:-manual}"

# ── 1. Pre-flight checks ─────────────────────────────────────────────────────

log "── Step 1: Pre-flight checks ──"

[ -f .env ] || fatal ".env not found in $APP_DIR"
source .env

DISK_FREE=$(df -m "$APP_DIR" | tail -1 | awk '{print $4}')
if [ "$DISK_FREE" -lt 1024 ]; then
    fatal "Insufficient disk space: ${DISK_FREE}MB free (need 1GB)"
fi
log "  Disk: ${DISK_FREE}MB free"

if ! pg_isready -h 127.0.0.1 -p 5432 -q 2>/dev/null; then
    log "  WARN: PostgreSQL not responding on 127.0.0.1:5432"
else
    log "  PostgreSQL: OK"
fi

if redis-cli -h 127.0.0.1 -p 6379 -a "${REDIS_PASSWORD:-}" ping 2>/dev/null | grep -q PONG; then
    log "  Redis: OK"
else
    log "  WARN: Redis not responding"
fi

if command -v nginx &>/dev/null; then
    log "  Nginx: $(nginx -v 2>&1)"
else
    fatal "Nginx not found"
fi

# ── 2. Database backup ───────────────────────────────────────────────────────

log "── Step 2: Database backup ──"
BACKUP_FILE="$APP_DIR/backups/db_$(date +%Y%m%d_%H%M%S).sql.gz"
pg_dump -U postgres -h 127.0.0.1 fences 2>/dev/null | gzip > "$BACKUP_FILE" 2>/dev/null || {
    sudo -u postgres pg_dump -U postgres fences 2>/dev/null | gzip > "$BACKUP_FILE" 2>/dev/null || \
    log "  WARN: DB backup failed (proceeding anyway)"
}
if [ -f "$BACKUP_FILE" ]; then
    log "  DB backup: $(du -h "$BACKUP_FILE" | cut -f1)"
fi

# ── 3. Determine current state ───────────────────────────────────────────────

log "── Step 3: Determine current state ──"
BLUE_HEALTHY=0
CURRENT_CONTAINER=""
PREVIOUS_IMAGE=""

if docker ps --format '{{.Names}}' | grep -q '^fences-app$'; then
    CURRENT_CONTAINER="fences-app"
    PREVIOUS_IMAGE=$(docker inspect --format='{{.Config.Image}}' fences-app 2>/dev/null || echo "unknown")
    if curl -sf --max-time 5 "http://127.0.0.1:${BLUE_PORT}/api/health" 2>/dev/null | grep -q '"status":"ok"'; then
        BLUE_HEALTHY=1
        log "  BLUE (current) is healthy on port ${BLUE_PORT} (image: ${PREVIOUS_IMAGE})"
    else
        log "  BLUE is NOT healthy — will do direct deploy"
    fi
else
    log "  No BLUE container found — will do direct deploy"
fi

# ── 4. Pull new image ────────────────────────────────────────────────────────

log "── Step 4: Pull Docker image ──"
PULL_START=$(date +%s)

if echo "$GHCR_IMAGE" | grep -q "ghcr.io"; then
    log "  Pulling: $GHCR_IMAGE"
    docker pull "$GHCR_IMAGE" 2>&1 | tail -3 || {
        log "  WARN: GHCR pull failed, trying local build..."
        cd "$APP_DIR"
        git fetch origin
        git reset --hard "origin/master2"
        docker compose -f docker-compose.yml build --no-cache app 2>&1 | tail -5
        GHCR_IMAGE="fences-curtain-app:latest"
    }
else
    log "  Using local image: $GHCR_IMAGE"
fi

PULL_TIME=$(( $(date +%s) - PULL_START ))
log "  Image ready in ${PULL_TIME}s"

# ── 5. Deploy strategy ───────────────────────────────────────────────────────

deploy_direct() {
    log "── Direct Deploy (no BLUE running) ──"
    docker rm -f fences-app 2>/dev/null || true

    docker run -d \
        --name fences-app \
        --network host \
        --restart unless-stopped \
        --env-file "$APP_DIR/.env" \
        -e PORT=${BLUE_PORT} \
        -e NODE_ENV=production \
        -v /var/www/uploads:/app/public/uploads \
        "$GHCR_IMAGE"

    wait_for_health "$BLUE_PORT" "fences-app"
    switch_nginx "$BLUE_PORT"
}

deploy_blue_green() {
    log "── Blue-Green Deploy ──"

    # 5a. Clean up any leftover green
    docker rm -f fences-app-green 2>/dev/null || true

    # 5b. Start GREEN on alternate port
    log "  Starting GREEN on port ${GREEN_PORT}..."
    docker run -d \
        --name fences-app-green \
        --network host \
        --restart no \
        --env-file "$APP_DIR/.env" \
        -e PORT=${GREEN_PORT} \
        -e NODE_ENV=production \
        -v /var/www/uploads:/app/public/uploads \
        "$GHCR_IMAGE"

    # 5c. Wait for GREEN health (includes migrations)
    log "  Waiting for GREEN health check..."
    if ! wait_for_health "$GREEN_PORT" "fences-app-green"; then
        log "  === GREEN FAILED health check ==="
        log "  Keeping BLUE alive on port ${BLUE_PORT}"
        docker rm -f fences-app-green 2>/dev/null || true
        log "  GREEN container removed"
        fatal "GREEN deployment failed health check — BLUE is still serving"
    fi
    log "  GREEN is healthy"

    # 5d. Switch nginx to GREEN (traffic goes to GREEN)
    log "  Switching nginx upstream to GREEN (port ${GREEN_PORT})..."
    switch_nginx "$GREEN_PORT"

    # 5e. Stop BLUE (traffic is on GREEN now, safe)
    log "  Stopping BLUE (fences-app)..."
    docker stop fences-app 2>/dev/null || true
    docker rm fences-app 2>/dev/null || true

    # 5f. Start production container on BLUE port (GREEN still serving traffic)
    log "  Starting production container on port ${BLUE_PORT}..."
    docker run -d \
        --name fences-app \
        --network host \
        --restart unless-stopped \
        --env-file "$APP_DIR/.env" \
        -e PORT=${BLUE_PORT} \
        -e NODE_ENV=production \
        -v /var/www/uploads:/app/public/uploads \
        "$GHCR_IMAGE"

    # 5g. Wait for new container to be healthy (GREEN still serving)
    if ! wait_for_health "$BLUE_PORT" "fences-app" 90; then
        log "  WARN: New container on ${BLUE_PORT} failed, nginx stays on GREEN (port ${GREEN_PORT})"
        docker rm -f fences-app 2>/dev/null || true
        # Leave nginx pointing to GREEN which is still running
        fatal "New container failed — GREEN still serving on ${GREEN_PORT}"
    fi

    # 5h. Switch nginx to BLUE port (new version ready)
    switch_nginx "$BLUE_PORT"
    log "  Nginx switched to port ${BLUE_PORT}"

    # 5i. Remove GREEN (no longer needed)
    docker rm -f fences-app-green 2>/dev/null || true
    log "  GREEN container removed"
}

# ── Execute deploy ──

if [ "$BLUE_HEALTHY" -eq 1 ]; then
    deploy_blue_green
else
    deploy_direct
fi

# ── 6. Smoke tests ──────────────────────────────────────────────────────────

log "── Step 6: Smoke tests ──"
SMOKE_FAIL=0

endpoints=(
    "GET|200|/api/health"
    "GET|200|/"
    "GET|200|/admin/login"
    "GET|200|/api/materials"
    "POST|405|/api/calculator/fence"
)

for ep in "${endpoints[@]}"; do
    IFS='|' read -r method expected_code path <<< "$ep"
    URL="http://127.0.0.1:${BLUE_PORT}${path}"
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 -X "$method" "$URL" 2>/dev/null || echo "000")

    if [ "$HTTP_CODE" = "$expected_code" ]; then
        log "  OK: $method $path → $HTTP_CODE"
    else
        log "  FAIL: $method $path → $HTTP_CODE (expected $expected_code)"
        SMOKE_FAIL=$((SMOKE_FAIL + 1))
    fi
done

# ── 7. Auto-rollback if smoke tests fail ─────────────────────────────────────

if [ "$SMOKE_FAIL" -gt 0 ]; then
    log "=== SMOKE TESTS FAILED ($SMOKE_FAIL failures) — AUTO ROLLBACK ==="

    if [ -n "$PREVIOUS_IMAGE" ] && [ "$PREVIOUS_IMAGE" != "unknown" ]; then
        log "  Rolling back to previous image: $PREVIOUS_IMAGE"
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
            "$PREVIOUS_IMAGE"

        if wait_for_health "$BLUE_PORT" "fences-app" 90; then
            switch_nginx "$BLUE_PORT"
            log "  Rollback successful — previous version is serving"
        else
            log "  FATAL: Rollback also failed — manual intervention required"
            docker logs fences-app --tail=50 2>&1 | tee -a "$DEPLOY_LOG"
            fatal "Rollback failed"
        fi
    else
        log "  No previous image available for rollback"
        log "  Keeping current deployment — investigate manually"
    fi

    DEPLOY_TIME=$(( $(date +%s) - DEPLOY_START ))
    log "=== DEPLOY FAILED + ROLLED BACK in ${DEPLOY_TIME}s ==="
    exit 1
fi

# ── 8. Success ───────────────────────────────────────────────────────────────

DEPLOY_TIME=$(( $(date +%s) - DEPLOY_START ))
log "============================================"
log "DEPLOYMENT SUCCESSFUL"
log "============================================"
log "Time: ${DEPLOY_TIME}s"
log "Image: $GHCR_IMAGE"
log "Commit: $COMMIT_SHA"
log "Port: ${BLUE_PORT}"

docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Image}}" | grep fences || true
curl -s "http://127.0.0.1:${BLUE_PORT}/api/health" | head -1

# Cleanup old backups
find "$APP_DIR/backups" -name "*.sql.gz" -mtime +7 -delete 2>/dev/null || true
find "$LOG_DIR" -name "*.log" -mtime +30 -delete 2>/dev/null || true

# Cleanup old images (keep last 5)
docker image prune -f --filter "until=168h" 2>/dev/null || true

log "=== DEPLOY FINISHED ==="

# ── Helper functions ─────────────────────────────────────────────────────────

wait_for_health() {
    local port="$1"
    local container="$2"
    local timeout="${3:-$HEALTH_TIMEOUT}"
    local elapsed=0

    while [ $elapsed -lt $timeout ]; do
        # Check container is running
        if ! docker ps --format '{{.Names}}' | grep -q "^${container}$"; then
            log "    Container $container is not running"
            docker logs "$container" --tail=20 2>&1 | tee -a "$DEPLOY_LOG"
            return 1
        fi

        if curl -sf --max-time 3 "http://127.0.0.1:${port}/api/health" 2>/dev/null | grep -q '"status":"ok"'; then
            log "    Health check passed on port ${port} (${elapsed}s)"
            return 0
        fi

        sleep $HEALTH_INTERVAL
        elapsed=$((elapsed + HEALTH_INTERVAL))
    done

    log "    Health check FAILED on port ${port} after ${timeout}s"
    docker logs "$container" --tail=30 2>&1 | tee -a "$DEPLOY_LOG"
    return 1
}

switch_nginx() {
    local target_port="$1"

    mkdir -p /etc/nginx/conf.d

    cat > "$NGINX_UPSTREAM_FILE" <<EOF
upstream app {
    server 127.0.0.1:${target_port};
    keepalive 32;
}
EOF

    # Self-heal: ensure nginx includes conf.d
    NGINX_MAIN="/etc/nginx/nginx.conf"
    if [ -f "$NGINX_MAIN" ] && ! grep -q "include.*conf.d" "$NGINX_MAIN"; then
        log "  Patching nginx.conf to include conf.d..."
        sed -i '/http {/a \    include /etc/nginx/conf.d/*.conf;' "$NGINX_MAIN"
    fi

    # Self-heal: if site config has inline upstream, remove it (use conf.d instead)
    for site_conf in /etc/nginx/sites-enabled/* /etc/nginx/conf.d/*.conf; do
        if [ -f "$site_conf" ] && [ "$site_conf" != "$NGINX_UPSTREAM_FILE" ] && grep -q "upstream app" "$site_conf"; then
            log "  Removing inline upstream from $site_conf (using conf.d instead)..."
            sed -i '/upstream app {/,/}/d' "$site_conf"
        fi
    done

    if ! nginx -t 2>&1; then
        log "  FATAL: nginx config test failed"
        cat "$NGINX_UPSTREAM_FILE"
        nginx -T 2>&1 | tail -20 | tee -a "$DEPLOY_LOG"
        fatal "nginx -t failed after upstream change"
    fi

    nginx -s reload 2>&1 || {
        log "  WARN: nginx -s reload failed, trying systemctl..."
        systemctl reload nginx 2>/dev/null || log "  WARN: systemctl reload also failed"
    }

    log "  nginx upstream switched to port ${target_port}"
}
