#!/bin/bash

# Тестирование авторизованных административных API
# Дата: $(date +%Y-%m-%d)

BASE_URL="http://localhost:3001"
LOG_FILE="api-test-admin-$(date +%Y%m%d_%H%M%S).log"

# Цвета
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

log() {
    echo -e "$1" | tee -a "$LOG_FILE"
}

log_test() {
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    log "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    log "${YELLOW}Test #$TOTAL_TESTS${NC}: $1"
}

log_result() {
    if [ "$1" -eq "$2" ]; then
        log "${GREEN}✓ PASSED${NC} (Status: $1)"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        log "${RED}✗ FAILED${NC} (Expected: $2, Got: $1)"
        [ -n "$3" ] && log "${RED}Response:${NC} $3"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

# Функция для авторизации и получения сессионной куки
login() {
    log "\n${YELLOW}=== АВТОРИЗАЦИЯ ===${NC}"
    
    # Получаем CSRF токен
    csrf_response=$(curl -s -c cookies.txt -b cookies.txt "$BASE_URL/api/auth/csrf")
    csrf_token=$(echo "$csrf_response" | jq -r '.csrfToken')
    
    log "CSRF Token: $csrf_token"
    
    # Авторизуемся
    login_response=$(curl -s -c cookies.txt -b cookies.txt -X POST \
        -H "Content-Type: application/x-www-form-urlencoded" \
        -d "email=admin%40fences.ru&password=admin123&csrfToken=$csrf_token&callbackUrl=http%3A%2F%2Flocalhost%3A3001%2Fadmin" \
        "$BASE_URL/api/auth/callback/credentials")
    
    log "Login response: $login_response"
    
    # Проверяем сессию
    session_response=$(curl -s -b cookies.txt "$BASE_URL/api/auth/session")
    log "Session: $session_response"
    
    if echo "$session_response" | jq -e '.user' > /dev/null 2>&1; then
        log "${GREEN}✓ Авторизация успешна${NC}"
        return 0
    else
        log "${RED}✗ Авторизация не удалась${NC}"
        return 1
    fi
}

# Функция для выполнения авторизованного запроса
auth_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    local expected_status=$4
    local description=$5
    
    log_test "$description"
    
    if [ -n "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -b cookies.txt -X "$method" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$BASE_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -b cookies.txt -X "$method" \
            -H "Content-Type: application/json" \
            "$BASE_URL$endpoint")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    log_result "$http_code" "$expected_status" "$body"
    
    # Возвращаем body для дальнейшего использования
    echo "$body"
}

main() {
    log "${BLUE}╔══════════════════════════════════════════╗${NC}"
    log "${BLUE}║   ТЕСТИРОВАНИЕ АДМИН API (АВТОРИЗОВАН)   ║${NC}"
    log "${BLUE}╚══════════════════════════════════════════╝${NC}"
    
    # Авторизация
    if ! login; then
        log "${RED}Не удалось авторизоваться. Тестирование прервано.${NC}"
        exit 1
    fi
    
    # ===== 1. FENCE TYPES CRUD =====
    log "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    log "${YELLOW}1. CRUD: ТИПЫ ЗАБОРОВ${NC}"
    log "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    # GET - List
    auth_request "GET" "/api/admin/materials/fence-types" "" 200 "Получение списка типов заборов"
    
    # POST - Create
    create_result=$(auth_request "POST" "/api/admin/materials/fence-types" \
        '{"name":"Тестовый тип забора","description":"Описание для теста","difficultyCoef":1.2,"postSpacing":2500,"defaultLagRows":2,"active":true,"priority":0}' \
        201 "Создание нового типа забора")
    
    # Извлекаем ID созданного типа
    fence_type_id=$(echo "$create_result" | jq -r '.id // empty')
    
    if [ -n "$fence_type_id" ]; then
        log "${GREEN}Создан тип забора с ID: $fence_type_id${NC}"
        
        # GET - By ID
        auth_request "GET" "/api/admin/materials/fence-types/$fence_type_id" "" 200 "Получение типа забора по ID"
        
        # PUT - Update
        auth_request "PUT" "/api/admin/materials/fence-types/$fence_type_id" \
            '{"name":"Обновленный тип забора","description":"Обновленное описание","difficultyCoef":1.5,"postSpacing":3000,"defaultLagRows":3,"active":true,"priority":1}' \
            200 "Обновление типа забора"
        
        # DELETE
        auth_request "DELETE" "/api/admin/materials/fence-types/$fence_type_id" "" 200 "Удаление типа забора"
    else
        log "${RED}Не удалось создать тип забора${NC}"
    fi
    
    # ===== 2. LAG TYPES CRUD =====
    log "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    log "${YELLOW}2. CRUD: ТИПЫ ЛАГ${NC}"
    log "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    auth_request "GET" "/api/admin/lag-types" "" 200 "Получение списка типов лаг"
    
    create_lag=$(auth_request "POST" "/api/admin/lag-types" \
        '{"name":"Тестовая лага 40x20","description":"Тестовая лага для проверки","width":40,"height":20,"metalThickness":2.0,"basePricePerMeter":150,"active":true,"priority":0}' \
        201 "Создание новой лаги")
    
    lag_id=$(echo "$create_lag" | jq -r '.id // empty')
    
    if [ -n "$lag_id" ]; then
        auth_request "PUT" "/api/admin/lag-types/$lag_id" \
            '{"name":"Обновленная лага","description":"Обновлено","width":40,"height":20,"metalThickness":2.5,"basePricePerMeter":180,"active":true,"priority":1}' \
            200 "Обновление лаги"
        
        auth_request "DELETE" "/api/admin/lag-types/$lag_id" "" 200 "Удаление лаги"
    fi
    
    # ===== 3. POST TYPES CRUD =====
    log "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    log "${YELLOW}3. CRUD: ТИПЫ СТОЛБОВ${NC}"
    log "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    auth_request "GET" "/api/admin/post-types" "" 200 "Получение списка типов столбов"
    
    create_post=$(auth_request "POST" "/api/admin/post-types" \
        '{"name":"Тестовый столб 60x60","description":"Тестовый столб","sectionWidth":60,"sectionHeight":60,"wallThickness":2.5,"pricePerMeter":350,"priceWithConcrete":800,"active":true,"priority":0}' \
        201 "Создание нового столба")
    
    post_id=$(echo "$create_post" | jq -r '.id // empty')
    
    if [ -n "$post_id" ]; then
        auth_request "PUT" "/api/admin/post-types/$post_id" \
            '{"name":"Обновленный столб","description":"Обновлено","sectionWidth":60,"sectionHeight":60,"wallThickness":3.0,"pricePerMeter":400,"priceWithConcrete":900,"active":true,"priority":1}' \
            200 "Обновление столба"
        
        auth_request "DELETE" "/api/admin/post-types/$post_id" "" 200 "Удаление столба"
    fi
    
    # ===== 4. WORKS CRUD =====
    log "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    log "${YELLOW}4. CRUD: РАБОТЫ${NC}"
    log "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    auth_request "GET" "/api/admin/works" "" 200 "Получение списка работ"
    
    create_work=$(auth_request "POST" "/api/admin/works" \
        '{"name":"Тестовая работа","description":"Описание работы","unit":"M","price":500,"useInCalculator":true,"active":true,"priority":0,"fenceTypes":[]}' \
        201 "Создание новой работы")
    
    work_id=$(echo "$create_work" | jq -r '.id // empty')
    
    if [ -n "$work_id" ]; then
        auth_request "PUT" "/api/admin/works/$work_id" \
            '{"name":"Обновленная работа","description":"Обновлено","unit":"M","price":600,"useInCalculator":true,"active":true,"priority":1,"fenceTypes":[]}' \
            200 "Обновление работы"
        
        auth_request "DELETE" "/api/admin/works/$work_id" "" 200 "Удаление работы"
    fi
    
    # ===== 5. ESTIMATES =====
    log "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    log "${YELLOW}5. СМЕТЫ${NC}"
    log "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    auth_request "GET" "/api/admin/estimates" "" 200 "Получение списка смет"
    
    # ===== 6. ORDERS =====
    log "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    log "${YELLOW}6. ЗАКАЗЫ${NC}"
    log "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    auth_request "GET" "/api/admin/orders" "" 200 "Получение списка заказов"
    
    # ===== 7. DASHBOARD =====
    log "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    log "${YELLOW}7. ДАШБОРД${NC}"
    log "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    auth_request "GET" "/api/admin/dashboard" "" 200 "Получение данных дашборда"
    
    # ===== 8. STATISTICS =====
    log "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    log "${YELLOW}8. СТАТИСТИКА${NC}"
    log "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    auth_request "GET" "/api/admin/statistics" "" 200 "Получение статистики"
    
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
    
    # Очистка
    rm -f cookies.txt
    
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
