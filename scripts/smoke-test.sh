#!/bin/bash

set -e

BASE_URL="${1:-http://localhost:3001}"
LOG_FILE="/var/log/fences-deploy/smoke-test-$(date +%Y%m%d_%H%M%S).log"
FAILURES=0
TOTAL_TESTS=0

mkdir -p "$(dirname "$LOG_FILE")"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

test_endpoint() {
    local name="$1"
    local url="$2"
    local expected_code="${3:-200}"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    log "Testing $name: $url"
    
    local response
    local response_time
    local start_time end_time
    
    start_time=$(date +%s%3N)
    response=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$url")
    end_time=$(date +%s%3N)
    response_time=$((end_time - start_time))
    
    if [ "$response" = "$expected_code" ]; then
        log "✓ $name passed (HTTP $response, ${response_time}ms)"
        return 0
    else
        log "✗ $name failed (expected $expected_code, got $response, ${response_time}ms)"
        FAILURES=$((FAILURES + 1))
        return 1
    fi
}

test_api_json() {
    local name="$1"
    local url="$2"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    log "Testing JSON API $name: $url"
    
    local response
    local response_time
    local start_time end_time
    
    start_time=$(date +%s%3N)
    response=$(curl -s --max-time 10 "$url")
    end_time=$(date +%s%3N)
    response_time=$((end_time - start_time))
    
    if echo "$response" | jq . > /dev/null 2>&1; then
        log "✓ $name passed (valid JSON, ${response_time}ms)"
        return 0
    else
        log "✗ $name failed (invalid JSON response, ${response_time}ms)"
        log "  Response: $response"
        FAILURES=$((FAILURES + 1))
        return 1
    fi
}

test_no_test_credentials() {
    local url="$1"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    log "Checking for test credentials in: $url"
    
    if curl -s "$url" | grep -E "admin@fences\.ru|manager@fences\.ru|Тестовые данные" > /dev/null 2>&1; then
        log "✗ Found test credentials in $url"
        FAILURES=$((FAILURES + 1))
        return 1
    else
        log "✓ No test credentials found in $url"
        return 0
    fi
}

test_security_headers() {
    local url="$1"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    log "Checking security headers for: $url"
    
    local headers
    headers=$(curl -s -I --max-time 10 "$url")
    
    local missing_headers=0
    
    if ! echo "$headers" | grep -qi "X-Frame-Options"; then
        log "  ✗ Missing X-Frame-Options header"
        missing_headers=1
    fi
    
    if ! echo "$headers" | grep -qi "X-Content-Type-Options"; then
        log "  ✗ Missing X-Content-Type-Options header"
        missing_headers=1
    fi
    
    if [ $missing_headers -eq 0 ]; then
        log "✓ Security headers present"
        return 0
    else
        FAILURES=$((FAILURES + 1))
        return 1
    fi
}

log "=== SMOKE TEST STARTED ==="
log "Base URL: $BASE_URL"
log "Test started: $(date)"

test_endpoint "Homepage" "$BASE_URL/" 200
test_endpoint "Admin login page" "$BASE_URL/admin/login" 200
test_endpoint "Calculator API (fence)" "$BASE_URL/api/calculator/fence" 405
test_endpoint "Calculator API (canopy)" "$BASE_URL/api/calculator/canopy" 405
test_endpoint "Health check (API session)" "$BASE_URL/api/auth/session" 200
test_endpoint "Materials API" "$BASE_URL/api/materials" 200
test_api_json "Materials API JSON" "$BASE_URL/api/materials"
test_no_test_credentials "$BASE_URL/admin/login"
test_security_headers "$BASE_URL/"

log "=== SMOKE TEST SUMMARY ==="
log "Total tests: $TOTAL_TESTS"
log "Passed: $((TOTAL_TESTS - FAILURES))"
log "Failed: $FAILURES"

if [ $FAILURES -eq 0 ]; then
    log "✓=== SMOKE TEST PASSED ==="
    exit 0
else
    log "✗=== SMOKE TEST FAILED ($FAILURES failures) ==="
    exit 1
fi
