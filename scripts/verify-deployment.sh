#!/bin/bash
set -euo pipefail

APP_DIR="/root/Fences-of-the-curtain"
COMPOSE_FILES="-f docker-compose.yml -f docker-compose.monitoring.yml"
APP_PORT="3001"
GRAFANA_PORT="3002"
HEALTH_URL="http://127.0.0.1:${APP_PORT}/api/health"
GRAFANA_ADMIN_PASSWORD="${GRAFANA_ADMIN_PASSWORD:-SecureGrafanaPass2026!}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

TOTAL=0; PASSED=0; FAILED=0

check() {
  TOTAL=$((TOTAL + 1))
  echo -n "  $1 ... "
  if eval "$2" > /dev/null 2>&1; then
    echo -e "${GREEN}OK${NC}"
    PASSED=$((PASSED + 1))
  else
    echo -e "${RED}FAIL${NC}"
    FAILED=$((FAILED + 1))
  fi
}

echo ""
echo "=============================================================================="
echo "  DEPLOYMENT VERIFICATION (Docker-based)"
echo "=============================================================================="
echo ""

cd "$APP_DIR" || { echo "FATAL: $APP_DIR not found"; exit 1; }

# ── 1. Docker containers ──
echo -e "${BLUE}[1] Docker Containers${NC}"
check "app container running" "docker ps | grep fences-app | grep Up"
check "prometheus container running" "docker ps | grep fences-prometheus | grep Up"
check "grafana container running" "docker ps | grep fences-grafana | grep Up"
check "node-exporter running" "docker ps | grep fences-node-exporter | grep Up"
check "postgres-exporter running" "docker ps | grep fences-postgres-exporter | grep Up"
check "redis-exporter running" "docker ps | grep fences-redis-exporter | grep Up"

# ── 2. Application health ──
echo -e "${BLUE}[2] Application Health${NC}"
check "Health endpoint OK" "curl -sf '$HEALTH_URL' | grep -q '\"status\":\"ok\"'"
check "Main page 200" "curl -sf -o /dev/null -w '%{http_code}' http://127.0.0.1:${APP_PORT}/ | grep 200"
check "Admin login 200" "curl -sf -o /dev/null -w '%{http_code}' http://127.0.0.1:${APP_PORT}/admin/login | grep 200"

# ── 3. Docker health status ──
echo -e "${BLUE}[3] Container Health Status${NC}"
for container in fences-app fences-prometheus fences-grafana fences-node-exporter fences-postgres-exporter fences-redis-exporter; do
  STATUS=$(docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null || echo "missing")
  if [ "$STATUS" = "healthy" ]; then
    echo -e "  $container: ${GREEN}$STATUS${NC}"
    PASSED=$((PASSED + 1))
  else
    echo -e "  $container: ${RED}$STATUS${NC}"
    FAILED=$((FAILED + 1))
  fi
  TOTAL=$((TOTAL + 1))
done

# ── 4. Grafana dashboards ──
echo -e "${BLUE}[4] Grafana Dashboards${NC}"
DASHBOARD_COUNT=$(curl -sf -u "admin:$GRAFANA_ADMIN_PASSWORD" \
  "http://127.0.0.1:${GRAFANA_PORT}/api/search?type=dash-db" 2>/dev/null | \
  python3 -c "import sys,json; print(len(json.load(sys.stdin)))" 2>/dev/null || echo "0")
echo "  Dashboards found: $DASHBOARD_COUNT (expected: 6)"
if [ "$DASHBOARD_COUNT" -ge 6 ]; then
  PASSED=$((PASSED + 1))
else
  FAILED=$((FAILED + 1))
fi
TOTAL=$((TOTAL + 1))

# Datasource health
DS_STATUS=$(curl -sf -u "admin:$GRAFANA_ADMIN_PASSWORD" \
  "http://127.0.0.1:${GRAFANA_PORT}/api/datasources/uid/prometheus/health" 2>/dev/null || echo "")
check "Prometheus datasource OK" "echo '$DS_STATUS' | grep -q '\"status\":\"OK\"'"

# ── 5. Prometheus targets ──
echo -e "${BLUE}[5] Prometheus Targets${NC}"
DOWN=$(curl -sf http://127.0.0.1:9090/api/v1/targets 2>/dev/null | \
  python3 -c "import sys,json; d=json.load(sys.stdin); print(sum(1 for t in d['data']['activeTargets'] if t['health']!='up'))" 2>/dev/null || echo "?")
echo "  Targets down: $DOWN"
TOTAL=$((TOTAL + 1))
if [ "$DOWN" = "0" ]; then
  echo -e "  ${GREEN}All targets UP${NC}"
  PASSED=$((PASSED + 1))
else
  echo -e "  ${YELLOW}$DOWN targets DOWN${NC}"
  FAILED=$((FAILED + 1))
fi

# ── 6. System resources ──
echo -e "${BLUE}[6] System Resources${NC}"
DISK=$(df -h "$APP_DIR" | tail -1 | awk '{print $5}' | sed 's/%//')
echo "  Disk usage: ${DISK}%"
TOTAL=$((TOTAL + 1))
if [ "$DISK" -lt 90 ]; then
  echo -e "  ${GREEN}OK${NC}"
  PASSED=$((PASSED + 1))
else
  echo -e "  ${RED}CRITICAL${NC}"
  FAILED=$((FAILED + 1))
fi

MEM=$(free -m | awk 'NR==2{printf "%d", $3*100/$2}')
echo "  Memory usage: ${MEM}%"
TOTAL=$((TOTAL + 1))
if [ "$MEM" -lt 90 ]; then
  echo -e "  ${GREEN}OK${NC}"
  PASSED=$((PASSED + 1))
else
  echo -e "  ${YELLOW}HIGH${NC}"
  FAILED=$((FAILED + 1))
fi

# ── 7. Logs check ──
echo -e "${BLUE}[7] Recent Logs${NC}"
ERRORS=$(docker compose $COMPOSE_FILES logs --tail=100 app 2>&1 | grep -ci "error" || echo "0")
echo "  Recent errors in app logs: $ERRORS"
TOTAL=$((TOTAL + 1))
if [ "$ERRORS" -lt 5 ]; then
  echo -e "  ${GREEN}OK${NC}"
  PASSED=$((PASSED + 1))
else
  echo -e "  ${YELLOW}ELEVATED${NC}"
  FAILED=$((FAILED + 1))
fi

# ── Summary ──
echo ""
echo "=============================================================================="
RATE=$((PASSED * 100 / TOTAL))
echo "  Total: $TOTAL | ${GREEN}Passed: $PASSED${NC} | ${RED}Failed: $FAILED${NC} | Rate: ${RATE}%"
echo "=============================================================================="

if [ "$FAILED" -eq 0 ]; then
  echo -e "${GREEN}ALL CHECKS PASSED${NC}"
  exit 0
elif [ "$RATE" -ge 80 ]; then
  echo -e "${YELLOW}MOSTLY OK — some warnings${NC}"
  exit 0
else
  echo -e "${RED}TOO MANY FAILURES — investigate${NC}"
  exit 1
fi
