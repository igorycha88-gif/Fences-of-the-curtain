#!/bin/bash

# Комплексный скрипт тестирования API v2
# Автор: QA Engineer
# Дата: $(date +%Y-%m-%d)

BASE_URL="http://localhost:3001"
LOG_FILE="api-test-comprehensive-$(date +%Y%m%d_%H%M%S).log"

# Цвета
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Счетчики
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
WARNINGS=0

# ID из базы данных
FENCE_TYPE_ID="cmmkiyxl8000013wt4bqymhn8"
POST_TYPE_ID="cmmxmf03f0005omeygc9nkfxq"
LAG_TYPE_ID="cmmxmf03f0006omey26zye7ia"

# Функции логирования
log() {
    echo -e "$1" | tee -a "$LOG_FILE"
}

log_test() {
    log "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    log "${YELLOW}Test #$TOTAL_TESTS${NC}"
    log "  ${BLUE}Description:${NC} $1"
    log "  ${BLUE}Method:${NC} $2"
    log "  ${BLUE}Endpoint:${NC} $3"
    [ -n "$4" ] && log "  ${BLUE}Data:${NC} $4"
}

log_result() {
    if [ "$1" -eq "$2" ]; then
        log "  ${GREEN}✓ PASSED${NC} (Status: $1)"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        log "  ${RED}✗ FAILED${NC} (Expected: $2, Got: $1)"
        [ -n "$3" ] && log "  ${RED}Response:${NC} $3"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

# Функция тестирования
test_api() {
    local method=$1
    local endpoint=$2
    local data=$3
    local expected_status=$4
    local description=$5
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    log_test "$description" "$method" "$endpoint" "$data"
    
    if [ -n "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$BASE_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            -H "Content-Type: application/json" \
            "$BASE_URL$endpoint")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    log_result "$http_code" "$expected_status" "$body"
}

# Проверка сервера
check_server() {
    log "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    log "${YELLOW}ПРОВЕРКА ДОСТУПНОСТИ СЕРВЕРА${NC}"
    log "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    if curl -s --max-time 5 "$BASE_URL" > /dev/null; then
        log "${GREEN}✓ Сервер доступен: $BASE_URL${NC}"
        return 0
    else
        log "${RED}✗ Сервер недоступен: $BASE_URL${NC}"
        exit 1
    fi
}

# Главная функция
main() {
    log "\n${BLUE}╔══════════════════════════════════════════╗${NC}"
    log "${BLUE}║   КОМПЛЕКСНОЕ ТЕСТИРОВАНИЕ API v2.0     ║${NC}"
    log "${BLUE}╚══════════════════════════════════════════╝${NC}"
    log "Дата: $(date)"
    log "Base URL: $BASE_URL"
    log "Log file: $LOG_FILE"
    
    check_server
    
    # ===== 1. ПУБЛИЧНЫЕ API =====
    log "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    log "${YELLOW}РАЗДЕЛ 1: ПУБЛИЧНЫЕ API ENDPOINTS${NC}"
    log "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    # 1.1 Contact Form
    log "\n${YELLOW}[1.1] Контактная форма${NC}"
    
    test_api "POST" "/api/contact" \
        '{"name":"Тест Тестов","phone":"+79001234567","email":"test@test.com","message":"Тестовое сообщение для проверки"}' \
        200 "Успешная отправка контактной формы"
    
    test_api "POST" "/api/contact" \
        '{"name":"","phone":"","email":"invalid","message":""}' \
        400 "Валидация: пустые обязательные поля"
    
    test_api "POST" "/api/contact" \
        '{"name":"Тест","phone":"invalid","email":"test@test.com","message":"Сообщение"}' \
        400 "Валидация: неверный формат телефона"
    
    # 1.2 Calculator - Fence
    log "\n${YELLOW}[1.2] Калькулятор забора${NC}"
    
    test_api "POST" "/api/calculator/fence" \
        "{\"fenceTypeId\":\"$FENCE_TYPE_ID\",\"length\":50,\"height\":2.0,\"postType\":\"$POST_TYPE_ID\",\"lagType\":\"$LAG_TYPE_ID\",\"lagRows\":2,\"hasGate\":true,\"gateType\":\"SWING\",\"gateWidth\":4.0,\"hasWicket\":true,\"wicketWidth\":1.0,\"coating\":\"GALVANIZED\",\"color\":\"5005\",\"region\":\"Москва\"}" \
        200 "Расчет забора с воротами и калиткой"
    
    test_api "POST" "/api/calculator/fence" \
        "{\"fenceTypeId\":\"$FENCE_TYPE_ID\",\"length\":50,\"height\":2.0,\"postType\":\"$POST_TYPE_ID\",\"lagType\":\"$LAG_TYPE_ID\",\"lagRows\":2,\"hasGate\":false,\"hasWicket\":false,\"coating\":\"GALVANIZED\"}" \
        200 "Расчет забора без ворот и калитки"
    
    test_api "POST" "/api/calculator/fence" \
        '{"fenceTypeId":"","length":-1}' \
        400 "Валидация: некорректные данные"
    
    test_api "POST" "/api/calculator/fence" \
        "{\"fenceTypeId\":\"$FENCE_TYPE_ID\",\"length\":50,\"height\":2.0,\"postType\":\"$POST_TYPE_ID\",\"lagType\":\"$LAG_TYPE_ID\",\"lagRows\":2,\"hasGate\":true,\"coating\":\"GALVANIZED\"}" \
        400 "Валидация: ворота без gateType и gateWidth"
    
    # 1.3 Calculator - Canopy
    log "\n${YELLOW}[1.3] Калькулятор навеса${NC}"
    
    test_api "POST" "/api/calculator/canopy" \
        '{"canopyType":"single-slope","purpose":"car-1","length":6.0,"width":4.0,"height":2.5,"frameMaterial":"steel","roofMaterial":"profnastil","installationType":"ground","hasWaterSystem":true}' \
        200 "Расчет односкатного навеса"
    
    test_api "POST" "/api/calculator/canopy" \
        '{"canopyType":"double-slope","purpose":"gazebo","length":4.0,"width":4.0,"height":3.0,"frameMaterial":"steel","roofMaterial":"polycarbonate","installationType":"base","hasWaterSystem":false}' \
        200 "Расчет двускатного навеса"
    
    test_api "POST" "/api/calculator/canopy" \
        '{"canopyType":"invalid","purpose":"invalid"}' \
        400 "Валидация: некорректные типы"
    
    # 1.4 Materials
    log "\n${YELLOW}[1.4] Материалы${NC}"
    
    test_api "GET" "/api/materials" "" 200 "Получение всех материалов"
    
    test_api "GET" "/api/materials?category=PROFNASTIL" "" 200 "Фильтрация по категории PROFNASTIL"
    
    test_api "GET" "/api/materials?category=POSTS" "" 200 "Фильтрация по категории POSTS"
    
    test_api "GET" "/api/materials?category=LAGS" "" 200 "Фильтрация по категории LAGS"
    
    test_api "GET" "/api/materials?category=INVALID" "" 200 "Несуществующая категория (пустой список)"
    
    # 1.5 Contact Info
    log "\n${YELLOW}[1.5] Контактная информация${NC}"
    
    test_api "GET" "/api/contact-info" "" 200 "Получение контактной информации"
    
    # 1.6 Fence Types
    log "\n${YELLOW}[1.6] Типы заборов${NC}"
    
    test_api "GET" "/api/calculator/fence-types" "" 200 "Получение типов заборов"
    
    test_api "GET" "/api/calculator/fence-types?onlyWithMaterials=true" "" 200 "Только типы с материалами"
    
    # 1.7 Estimate saving
    log "\n${YELLOW}[1.7] Сохранение сметы${NC}"
    
    test_api "POST" "/api/calculator/fence/estimate" \
        "{\"fenceTypeId\":\"$FENCE_TYPE_ID\",\"length\":50,\"height\":2.0,\"postType\":\"$POST_TYPE_ID\",\"lagType\":\"$LAG_TYPE_ID\",\"lagRows\":2,\"hasGate\":false,\"hasWicket\":false,\"coating\":\"GALVANIZED\"}" \
        201 "Сохранение сметы забора"
    
    # ===== 2. АВТОРИЗАЦИЯ =====
    log "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    log "${YELLOW}РАЗДЕЛ 2: АВТОРИЗАЦИЯ И АУТЕНТИФИКАЦИЯ${NC}"
    log "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    test_api "GET" "/api/auth/csrf" "" 200 "Получение CSRF токена"
    
    test_api "GET" "/api/auth/providers" "" 200 "Получение провайдеров"
    
    test_api "GET" "/api/auth/session" "" 200 "Получение сессии (без авторизации)"
    
    test_api "GET" "/api/auth/me" "" 401 "Получение профиля (без авторизации)"
    
    # ===== 3. ЗАЩИТА АДМИН ENDPOINTS =====
    log "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    log "${YELLOW}РАЗДЕЛ 3: ЗАЩИТА АДМИНИСТРАТИВНЫХ ENDPOINTS${NC}"
    log "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    # Проверяем что все админ endpoints требуют авторизацию
    local admin_endpoints=(
        "/api/admin/materials/fence-types"
        "/api/admin/lag-types"
        "/api/admin/post-types"
        "/api/admin/estimates"
        "/api/admin/orders"
        "/api/admin/works"
        "/api/admin/users"
        "/api/admin/dashboard"
        "/api/admin/statistics"
        "/api/admin/audit-logs"
        "/api/admin/picket-types"
        "/api/admin/wicket-types"
        "/api/admin/gate-types"
        "/api/admin/profnastil-types"
        "/api/admin/mounting-hardware"
    )
    
    for endpoint in "${admin_endpoints[@]}"; do
        test_api "GET" "$endpoint" "" 401 "Защита: $endpoint (требует авторизацию)"
    done
    
    # ===== 4. ВАЛИДАЦИЯ ДАННЫХ =====
    log "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    log "${YELLOW}РАЗДЕЛ 4: ВАЛИДАЦИЯ ВХОДНЫХ ДАННЫХ${NC}"
    log "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    # XSS тесты
    test_api "POST" "/api/contact" \
        '{"name":"<script>alert(1)</script>","phone":"+79001234567","email":"test@test.com","message":"<script>alert(1)</script>"}' \
        200 "XSS данные санитизированы (возврат 200)"
    
    # SQL Injection тесты
    test_api "POST" "/api/contact" \
        '{"name":"Test; DROP TABLE users;--","phone":"+79001234567","email":"test@test.com","message":"Message"}' \
        200 "SQL Injection в имени (должно пройти валидацию)"
    
    # Buffer overflow тесты
    test_api "POST" "/api/contact" \
        "{\"name\":\"$(python3 -c 'print("A"*1000)')\",\"phone\":\"+79001234567\",\"email\":\"test@test.com\",\"message\":\"Message\"}" \
        400 "Защита от переполнения буфера"
    
    # ===== 5. RATE LIMITING =====
    log "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    log "${YELLOW}РАЗДЕЛ 5: RATE LIMITING${NC}"
    log "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    log "\n${YELLOW}Тестирование rate limiting (5 быстрых запросов)${NC}"
    for i in {1..5}; do
        curl -s -X POST "$BASE_URL/api/contact" \
            -H "Content-Type: application/json" \
            -d '{"name":"Test","phone":"+79001234567","email":"test@test.com","message":"Test message"}' \
            > /dev/null &
    done
    wait
    log "${GREEN}✓ Rate limiting test completed (проверьте логи сервера)${NC}"
    
    # ===== 6. EDGE CASES =====
    log "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    log "${YELLOW}РАЗДЕЛ 6: EDGE CASES И ГРАНИЧНЫЕ ЗНАЧЕНИЯ${NC}"
    log "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    # Минимальные значения
    test_api "POST" "/api/calculator/fence" \
        "{\"fenceTypeId\":\"$FENCE_TYPE_ID\",\"length\":10,\"height\":1.5,\"postType\":\"$POST_TYPE_ID\",\"lagType\":\"$LAG_TYPE_ID\",\"lagRows\":2,\"hasGate\":false,\"hasWicket\":false,\"coating\":\"GALVANIZED\"}" \
        200 "Минимальная длина и высота забора"
    
    # Максимальные значения
    test_api "POST" "/api/calculator/fence" \
        "{\"fenceTypeId\":\"$FENCE_TYPE_ID\",\"length\":1000,\"height\":3.5,\"postType\":\"$POST_TYPE_ID\",\"lagType\":\"$LAG_TYPE_ID\",\"lagRows\":3,\"hasGate\":false,\"hasWicket\":false,\"coating\":\"POLYMER_DOUBLE\"}" \
        200 "Максимальная длина и высота забора"
    
    # Выход за границы
    test_api "POST" "/api/calculator/fence" \
        "{\"fenceTypeId\":\"$FENCE_TYPE_ID\",\"length\":9,\"height\":2.0,\"postType\":\"$POST_TYPE_ID\",\"lagType\":\"$LAG_TYPE_ID\",\"lagRows\":2,\"hasGate\":false,\"hasWicket\":false,\"coating\":\"GALVANIZED\"}" \
        400 "Длина меньше минимума (9м)"
    
    test_api "POST" "/api/calculator/fence" \
        "{\"fenceTypeId\":\"$FENCE_TYPE_ID\",\"length\":1001,\"height\":2.0,\"postType\":\"$POST_TYPE_ID\",\"lagType\":\"$LAG_TYPE_ID\",\"lagRows\":2,\"hasGate\":false,\"hasWicket\":false,\"coating\":\"GALVANIZED\"}" \
        400 "Длина больше максимума (1001м)"
    
    # ===== ИТОГИ =====
    log "\n${BLUE}╔══════════════════════════════════════════╗${NC}"
    log "${BLUE}║          ИТОГИ ТЕСТИРОВАНИЯ             ║${NC}"
    log "${BLUE}╚══════════════════════════════════════════╝${NC}"
    log "Всего тестов: $TOTAL_TESTS"
    log "${GREEN}Пройдено: $PASSED_TESTS${NC}"
    log "${RED}Провалено: $FAILED_TESTS${NC}"
    
    local success_rate=0
    if [ $TOTAL_TESTS -gt 0 ]; then
        success_rate=$((PASSED_TESTS * 100 / TOTAL_TESTS))
    fi
    
    log "Успешность: ${success_rate}%"
    
    if [ $FAILED_TESTS -eq 0 ]; then
        log "\n${GREEN}✓ ВСЕ ТЕСТЫ ПРОЙДЕНЫ УСПЕШНО!${NC}"
        exit 0
    else
        log "\n${RED}✗ ЕСТЬ ПРОВАЛЕННЫЕ ТЕСТЫ${NC}"
        log "Проверьте лог-файл: $LOG_FILE"
        exit 1
    fi
}

main "$@"
