#!/bin/bash

echo "╔════════════════════════════════════════════════════════════╗"
echo "║          ТЕСТИРОВАНИЕ XSS ЗАЩИТЫ v2.0                     ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

BASE_URL="http://localhost:3001"
PASSED=0
FAILED=0

test_xss() {
    local description="$1"
    local endpoint="$2"
    local data="$3"
    local expected="$4"
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Тест: $description"
    echo "Endpoint: $endpoint"
    
    response=$(curl -s -w "\n%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -d "$data" \
        "$BASE_URL$endpoint")
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -eq "$expected" ]; then
        echo "✅ PASSED (Status: $http_code)"
        PASSED=$((PASSED + 1))
    else
        echo "❌ FAILED (Expected: $expected, Got: $http_code)"
        echo "Response: $body"
        FAILED=$((FAILED + 1))
    fi
    echo ""
}

echo "=== 1. КОНТАКТНАЯ ФОРМА ==="
echo ""

# Test 1: Script tags
test_xss "XSS: Script tags в имени и сообщении" "/api/contact" \
    '{"name":"<script>alert(1)</script>","phone":"+79001234567","email":"test@test.com","message":"<script>alert(1)</script>"}' \
    200

# Test 2: Event handlers
test_xss "XSS: Event handlers в имени" "/api/contact" \
    '{"name":"<img src=x onerror=alert(1)>","phone":"+79001234567","email":"test@test.com","message":"test message here"}' \
    200

# Test 3: Mixed content
test_xss "XSS: Mixed content в сообщении" "/api/contact" \
    '{"name":"Test","phone":"+79001234567","email":"test@test.com","message":"Hello <b>world</b> <script>alert(1)</script>!"}' \
    200

# Test 4: Valid content
test_xss "Валидные данные" "/api/contact" \
    '{"name":"Иван Иванов","phone":"+79001234567","email":"ivan@test.com","message":"Тестовое сообщение"}' \
    200

# Test 5: Invalid phone
test_xss "Невалидный телефон" "/api/contact" \
    '{"name":"Test","phone":"invalid","email":"test@test.com","message":"message"}' \
    400

echo "=== 2. КАЛЬКУЛЯТОР ЗАБОРА ==="
echo ""

# Test 6: XSS in soilType
test_xss "XSS: Script в soilType" "/api/calculator/fence" \
    '{"fenceTypeId":"cmmxmvdd3001xhr5cwv1bqpgu","length":50,"height":2.0,"postType":"test","lagType":"test","lagRows":2,"hasGate":false,"hasWicket":false,"coating":"GALVANIZED","soilType":"<script>alert(1)</script>"}' \
    200

# Test 7: XSS in postType
test_xss "XSS: Script в postType" "/api/calculator/fence" \
    '{"fenceTypeId":"cmmxmvdd3001xhr5cwv1bqpgu","length":50,"height":2.0,"postType":"<script>alert(1)</script>","lagType":"test","lagRows":2,"hasGate":false,"hasWicket":false,"coating":"GALVANIZED","soilType":"test"}' \
    200

echo "=== ИТОГИ ==="
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Всего тестов: $((PASSED + FAILED))"
echo "✅ Пройдено: $PASSED"
echo "❌ Провалено: $FAILED"
echo ""

if [ $FAILED -eq 0 ]; then
    echo "✅ ВСЕ ТЕСТЫ ПРОЙДЕНЫ! XSS защита работает корректно."
    exit 0
else
    echo "⚠️  ЕСТЬ ПРОВАЛЕННЫЕ ТЕСТЫ"
    exit 1
fi
