#!/bin/bash

# Проверка типа забора для 3D-панелей

echo "Проверка типа забора для 3D-панелей..."

COOKIE_FILE=/tmp/cookies_check.txt

# Логинимся
curl -s -c $COOKIE_FILE -X POST http://localhost:3001/api/auth/callback/credentials \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "email=admin@test.com&password=admin123&csrfToken=test" > /dev/null

# Получаем типы заборов
echo "Типы заборов:"
curl -s -b $COOKIE_FILE "http://localhost:3001/api/admin/fence-types" | jq '.items[] | {id, name}' 2>/dev/null || curl -s -b $COOKIE_FILE "http://localhost:3001/api/admin/fence-types"

rm -f $COOKIE_FILE
