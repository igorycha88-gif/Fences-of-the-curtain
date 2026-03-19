#!/bin/bash

# Скрипт проверки отсутствия PII в логах
# Exit code: 0 = OK, 1 = найдены нарушения

set -e

ERRORS=0

echo "=== Проверка PII в логах ==="

# 1. Проверка email в console.log (все файлы)
echo "1. Проверка email в console.log..."
EMAIL_VIOLATIONS=$(grep -rn "console\.log.*\.email\|console\.log.*user\.email\|console\.log.*session\.user\.email\|console\.log.*credentials\.email" src/ --include-dir="src/app" 2>/dev/null || true)
if [ -n "$EMAIL_VIOLATIONS" ]; then
    echo "   ERROR: Найден email в логах:"
    echo "$EMAIL_VIOLATIONS"
    ERRORS=$((ERRORS + 1))
else
    echo "   OK: Email не найден в логах"
fi

# 2. Проверка body в admin routes
echo "2. Проверка body в admin routes..."
BODY_VIOLATIONS=$(grep -rn "console\.log.*body" src/app/api/admin/ 2>/dev/null || true)
if [ -n "$BODY_VIOLATIONS" ]; then
    echo "   ERROR: Найден body в логах:"
    echo "$BODY_VIOLATIONS"
    ERRORS=$((ERRORS + 1))
else
    echo "   OK: Body не найден в логах"
fi

# 3. Проверка JSON.stringify(session/user)
echo "3. Проверка JSON.stringify(session/user)..."
JSON_VIOLATIONS=$(grep -rn "console\.log.*JSON\.stringify.*session\|console\.log.*JSON\.stringify.*user" src/ --include-dir="src/app" 2>/dev/null | grep -v node_modules || true)
if [ -n "$JSON_VIOLATIONS" ]; then
    echo "   ERROR: Найден JSON.stringify с session/user:"
    echo "$JSON_VIOLATIONS"
    ERRORS=$((ERRORS + 1))
else
    echo "   OK: JSON.stringify с session/user не найден"
fi

# 4. Проверка условного логирования Prisma
echo "4. Проверка условного логирования Prisma..."
if ! grep -q "NODE_ENV.*development" src/lib/prisma.ts 2>/dev/null; then
    echo "   ERROR: Prisma query logging не обёрнут в условие NODE_ENV"
    ERRORS=$((ERRORS + 1))
else
    echo "   OK: Prisma query logging условный"
fi

# Результат
echo ""
echo "=== Результат ==="
if [ $ERRORS -gt 0 ]; then
    echo "FAILED: Найдено нарушений: $ERRORS"
    exit 1
else
    echo "PASSED: PII в логах не найден"
    exit 0
fi

# 2. Проверка body в admin routes
echo "2. Проверка body в admin routes..."
BODY_VIOLATIONS=$(grep -rn "console.log.*body" src/app/api/admin/ 2>/dev/null || true)
if [ -n "$BODY_VIOLATIONS" ]; then
    echo "   ERROR: Найден body в логах:"
    echo "$BODY_VIOLATIONS"
    ERRORS=$((ERRORS + 1))
else
    echo "   OK: Body не найден в логах"
fi

# 3. Проверка JSON.stringify с session/user
echo "3. Проверка JSON.stringify(session/user)..."
JSON_VIOLATIONS=$(grep -rn "console.log.*JSON.stringify.*session\|console.log.*JSON.stringify.*user" src/ 2>/dev/null | grep -v node_modules || true)
if [ -n "$JSON_VIOLATIONS" ]; then
    echo "   ERROR: Найден JSON.stringify с session/user:"
    echo "$JSON_VIOLATIONS"
    ERRORS=$((ERRORS + 1))
else
    echo "   OK: JSON.stringify с session/user не найден"
fi

# 4. Проверка условного логирования Prisma
echo "4. Проверка условного логирования Prisma..."
if ! grep -q "NODE_ENV.*development" src/lib/prisma.ts 2>/dev/null; then
    echo "   ERROR: Prisma query logging не обёрнут в условие NODE_ENV"
    ERRORS=$((ERRORS + 1))
else
    echo "   OK: Prisma query logging условный"
fi

# Результат
echo ""
echo "=== Результат ==="
if [ $ERRORS -gt 0 ]; then
    echo "FAILED: Найдено нарушений: $ERRORS"
    exit 1
else
    echo "PASSED: PII в логах не найден"
    exit 0
fi
