#!/bin/bash

set -e

BASE_URL="${1:-http://localhost:3001}"
LOG_FILE="/var/log/fences-deploy/smoke-test-$(date +%Y%m%d_%H%M%S).log"

mkdir -p "$(dirname "$LOG_FILE")"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

test_endpoint() {
    local name="$1"
    local url="$2"
    local expected_code="${3:-200}"
    
    log "Testing $name: $url"
    
    local response
    response=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$url")
    
    if [ "$response" = "$expected_code" ]; then
        log "✓ $name passed (HTTP $response)"
        return 0
    else
        log "✗ $name failed (expected $expected_code, got $response)"
        return 1
    fi
}

test_no_test_credentials() {
    local url="$1"
    
    log "Checking for test credentials in: $url"
    
    if curl -s "$url" | grep -E "admin@fences\.ru|manager@fences\.ru|Тестовые данные" > /dev/null 2>&1; then
        log "✗ Found test credentials in $url"
        return 1
    else
        log "✓ No test credentials found in $url"
        return 0
    fi
}

log "=== SMOKE TEST STARTED ==="
log "Base URL: $BASE_URL"

FAILURES=0

if ! test_endpoint "Homepage" "$BASE_URL/" 200; then
    FAILURES=$((FAILURES + 1))
fi

if ! test_endpoint "Admin login page" "$BASE_URL/admin/login" 200; then
    FAILURES=$((FAILURES + 1))
fi

if ! test_endpoint "Calculator API" "$BASE_URL/api/calculator/fence" 405; then
    FAILURES=$((FAILURES + 1))
fi

if ! test_endpoint "Health check (API session)" "$BASE_URL/api/auth/session" 200; then
    FAILURES=$((FAILURES + 1))
fi

if ! test_no_test_credentials "$BASE_URL/admin/login"; then
    FAILURES=$((FAILURES + 1))
fi

if [ $FAILURES -eq 0 ]; then
    log "=== SMOKE TEST PASSED ==="
    exit 0
else
    log "=== SMOKE TEST FAILED ($FAILURES failures) ==="
    exit 1
fi
