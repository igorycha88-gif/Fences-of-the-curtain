#!/bin/bash

# Комплексный скрипт тестирования API
# Автор: QA Engineer
# Дата: $(date +%Y-%m-%d)

BASE_URL="http://localhost:3001"
LOG_FILE="api-test-results-$(date +%Y%m%d_%H%M%S).log"

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Счетчики
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Функция логирования
log() {
    echo -e "$1" | tee -a "$LOG_FILE"
}

# Функция тестирования endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local expected_status=$4
    local description=$5
    local auth_token=$6
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    log "\n${YELLOW}Test #$TOTAL_TESTS: $description${NC}"
    log "  Method: $method"
    log "  Endpoint: $endpoint"
    
    if [ -n "$data" ]; then
        log "  Data: $data"
    fi
    
    # Формируем команду curl
    if [ -n "$auth_token" ]; then
        if [ -n "$data" ]; then
            response=$(curl -s -w "\n%{http_code}" -X "$method" \
                -H "Content-Type: application/json" \
                -H "Cookie: next-auth.session-token=$auth_token" \
                -d "$data" \
                "$BASE_URL$endpoint")
        else
            response=$(curl -s -w "\n%{http_code}" -X "$method" \
                -H "Content-Type: application/json" \
                -H "Cookie: next-auth.session-token=$auth_token" \
                "$BASE_URL$endpoint")
        fi
    else
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
    fi
    
    # Разделяем ответ и статус код
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    # Проверяем статус код
    if [ "$http_code" -eq "$expected_status" ]; then
        log "  ${GREEN}✓ PASSED${NC} (Status: $http_code)"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        log "  ${RED}✗ FAILED${NC} (Expected: $expected_status, Got: $http_code)"
        log "  Response: $body"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

# Проверка доступности сервера
check_server() {
    log "\n${YELLOW}=== Проверка доступности сервера ===${NC}"
    
    if curl -s --max-time 5 "$BASE_URL" > /dev/null; then
        log "${GREEN}✓ Сервер доступен: $BASE_URL${NC}"
        return 0
    else
        log "${RED}✗ Сервер недоступен: $BASE_URL${NC}"
        log "${YELLOW}Запустите сервер: npm run dev${NC}"
        return 1
    fi
}

# Главная функция
main() {
    log "========================================"
    log "   КОМПЛЕКСНОЕ ТЕСТИРОВАНИЕ API"
    log "========================================"
    log "Дата: $(date)"
    log "Base URL: $BASE_URL"
    log "========================================"
    
    # Проверка сервера
    if ! check_server; then
        exit 1
    fi
    
    # ===== 1. ПУБЛИЧНЫЕ ENDPOINTS =====
    log "\n${YELLOW}=== 1. ПУБЛИЧНЫЕ ENDPOINTS ===${NC}"
    
    # 1.1 Contact Form
    test_endpoint "POST" "/api/contact" \
        '{"name":"Тест Тестов","phone":"+79001234567","email":"test@test.com","message":"Тестовое сообщение"}' \
        200 "Отправка контактной формы"
    
    test_endpoint "POST" "/api/contact" \
        '{"name":"","phone":"","email":"invalid","message":""}' \
        400 "Валидация контактной формы (неверные данные)"
    
    # 1.2 Calculator - Fence
    test_endpoint "POST" "/api/calculator/fence" \
        '{"fenceType":"PROFNASTIL","length":50,"height":2.0,"postType":"test-post","lagType":"test-lag","lagRows":"2","hasGate":true,"gateType":"SWING","gateWidth":4.0,"hasWicket":true,"wicketWidth":1.0,"coating":"GALVANIZED","color":"5005","region":"test-region"}' \
        200 "Расчет стоимости забора"
    
    test_endpoint "POST" "/api/calculator/fence" \
        '{"fenceType":"INVALID","length":-1}' \
        400 "Валидация калькулятора забора (неверные данные)"
    
    # 1.3 Calculator - Canopy
    test_endpoint "POST" "/api/calculator/canopy" \
        '{"canopyType":"single-slope","purpose":"car-1","length":6.0,"width":4.0,"height":2.5,"frameMaterial":"steel","roofMaterial":"profnastil","installationType":"ground","hasWaterSystem":true}' \
        200 "Расчет стоимости навеса"
    
    # 1.4 Materials
    test_endpoint "GET" "/api/materials" "" 200 "Получение списка материалов"
    test_endpoint "GET" "/api/materials?category=PROFNASTIL" "" 200 "Фильтрация материалов по категории"
    
    # 1.5 Contact Info
    test_endpoint "GET" "/api/contact-info" "" 200 "Получение контактной информации"
    
    # 1.6 Fence Types (public)
    test_endpoint "GET" "/api/calculator/fence-types" "" 200 "Получение типов заборов для калькулятора"
    
    # 1.7 Mounting Hardware (public)
    test_endpoint "GET" "/api/calculator/mounting-hardware" "" 200 "Получение крепежных элементов"
    
    # ===== 2. АВТОРИЗАЦИЯ =====
    log "\n${YELLOW}=== 2. АВТОРИЗАЦИЯ И АУТЕНТИФИКАЦИЯ ===${NC}"
    
    # 2.1 Получение CSRF токена
    test_endpoint "GET" "/api/auth/csrf" "" 200 "Получение CSRF токена"
    
    # 2.2 Получение провайдеров
    test_endpoint "GET" "/api/auth/providers" "" 200 "Получение списка провайдеров"
    
    # 2.3 Получение сессии (без авторизации)
    test_endpoint "GET" "/api/auth/session" "" 200 "Получение сессии (без авторизации)"
    
    # 2.4 Получение информации о текущем пользователе (без авторизации)
    test_endpoint "GET" "/api/auth/me" "" 401 "Получение текущего пользователя (без авторизации)"
    
    # ===== 3. АДМИНИСТРАТИВНЫЕ ENDPOINTS (без авторизации) =====
    log "\n${YELLOW}=== 3. АДМИНИСТРАТИВНЫЕ ENDPOINTS (без авторизации) ===${NC}"
    
    # Должны возвращать 401 Unauthorized
    test_endpoint "GET" "/api/admin/materials/fence-types" "" 401 "Получение типов заборов (без авторизации)"
    test_endpoint "GET" "/api/admin/lag-types" "" 401 "Получение типов лаг (без авторизации)"
    test_endpoint "GET" "/api/admin/post-types" "" 401 "Получение типов столбов (без авторизации)"
    test_endpoint "GET" "/api/admin/estimates" "" 401 "Получение смет (без авторизации)"
    test_endpoint "GET" "/api/admin/orders" "" 401 "Получение заказов (без авторизации)"
    test_endpoint "GET" "/api/admin/works" "" 401 "Получение работ (без авторизации)"
    test_endpoint "GET" "/api/admin/users" "" 401 "Получение пользователей (без авторизации)"
    test_endpoint "GET" "/api/admin/dashboard" "" 401 "Получение дашборда (без авторизации)"
    test_endpoint "GET" "/api/admin/statistics" "" 401 "Получение статистики (без авторизации)"
    test_endpoint "GET" "/api/admin/audit-logs" "" 401 "Получение логов аудита (без авторизации)"
    
    # ===== 4. ЗАКАЗЫ (PUBLIC) =====
    log "\n${YELLOW}=== 4. ЗАКАЗЫ (PUBLIC) ===${NC}"
    
    # 4.1 Создание заказа
    test_endpoint "POST" "/api/orders" \
        '{"clientName":"Иван Иванов","phone":"+79001234567","email":"ivan@example.com","serviceType":"fence","parameters":{},"calculatedCost":100000}' \
        201 "Создание нового заказа"
    
    test_endpoint "POST" "/api/orders" \
        '{"clientName":"","phone":"","email":"invalid"}' \
        400 "Валидация заказа (неверные данные)"
    
    # ===== ИТОГИ =====
    log "\n========================================"
    log "            ИТОГИ ТЕСТИРОВАНИЯ"
    log "========================================"
    log "Всего тестов: $TOTAL_TESTS"
    log -e "${GREEN}Пройдено: $PASSED_TESTS${NC}"
    log -e "${RED}Провалено: $FAILED_TESTS${NC}"
    
    if [ $FAILED_TESTS -eq 0 ]; then
        log -e "\n${GREEN}✓ ВСЕ ТЕСТЫ ПРОЙДЕНЫ УСПЕШНО!${NC}"
    else
        log -e "\n${RED}✗ ЕСТЬ ПРОВАЛЕННЫЕ ТЕСТЫ${NC}"
        log "Проверьте лог-файл: $LOG_FILE"
    fi
    
    log "\nПолный лог: $LOG_FILE"
    log "========================================"
    
    # Возвращаем код выхода
    if [ $FAILED_TESTS -gt 0 ]; then
        exit 1
    fi
}

# Запуск
main "$@"
