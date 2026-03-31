#!/bin/bash

# Скрипт для проверки API estimates на проде

PROD_URL="https://zabor-i-naves.ru"
API_KEY="${1:-}"

if [ -z "$API_KEY" ]; then
  echo "Использование: $0 <API_KEY>"
  echo "API_KEY можно получить из cookies браузера (next-auth.session-token)"
  exit 1
fi

echo "=== Проверка API estimates на проде ==="
echo "URL: $PROD_URL/api/admin/estimates"
echo ""

# Тест 1: Простой запрос без параметров
echo "1. Простой запрос (page=1, pageSize=20):"
curl -s -H "Cookie: next-auth.session-token=$API_KEY" \
  "$PROD_URL/api/admin/estimates?page=1&pageSize=20" | jq '.' || echo "Ошибка запроса"

echo ""
echo "2. Запрос с поиском (search=Moscow):"
curl -s -H "Cookie: next-auth.session-token=$API_KEY" \
  "$PROD_URL/api/admin/estimates?page=1&pageSize=20&search=Moscow" | jq '.' || echo "Ошибка запроса"

echo ""
echo "3. Проверка статуса ответа:"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "Cookie: next-auth.session-token=$API_KEY" \
  "$PROD_URL/api/admin/estimates?page=1&pageSize=20")

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ API работает (HTTP $HTTP_CODE)"
elif [ "$HTTP_CODE" = "500" ]; then
  echo "❌ Ошибка сервера (HTTP $HTTP_CODE)"
  echo "   Нужно применить исправление на проде"
else
  echo "⚠️  Неожиданный статус (HTTP $HTTP_CODE)"
fi

echo ""
echo "=== Проверка завершена ==="
