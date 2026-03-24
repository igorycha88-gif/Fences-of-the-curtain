#!/bin/bash

# Тестирование создания 3d-панели через админку

echo "Тестирование создания 3d-панели..."

# Получаем сессию (если пользователь уже залогинен)
COOKIE_FILE=/tmp/cookies.txt

# Шаг 1: Получаем страницу логина
echo "1. Получаем страницу логина..."
curl -s -c $COOKIE_FILE http://localhost:3001/admin/login > /dev/null

# Шаг 2: Логинимся (используем тестовые креды)
echo "2. Пытаемся залогиниться..."
LOGIN_RESPONSE=$(curl -s -i -b $COOKIE_FILE -c $COOKIE_FILE \
  -X POST http://localhost:3001/api/auth/callback/credentials \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "email=admin@test.com&password=admin123&csrfToken=test")

# Шаг 3: Проверяем сессию
echo "3. Проверяем сессию..."
SESSION=$(curl -s -b $COOKIE_FILE http://localhost:3001/api/auth/session)
echo "Сессия: $SESSION"

# Шаг 4: Создаем panel3d
echo "4. Создаем 3d-панель..."
PANEL_RESPONSE=$(curl -s -b $COOKIE_FILE \
  -X POST http://localhost:3001/api/admin/panel3d \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Тестовая панель из скрипта",
    "description": "Описание тестовой панели",
    "panelHeight": 2000,
    "panelWidth": 2500,
    "rodDiameter": 4,
    "cellWidth": 50,
    "cellHeight": 200,
    "retailPricePerUnit": 5000,
    "active": true,
    "priority": 0
  }')

echo "Ответ сервера: $PANEL_RESPONSE"

# Проверяем результат
if echo "$PANEL_RESPONSE" | grep -q '"id"'; then
  echo "✅ Успех! 3d-панель создана"
  exit 0
elif echo "$PANEL_RESPONSE" | grep -q '"error"'; then
  echo "❌ Ошибка: $(echo $PANEL_RESPONSE | grep -o '"error":"[^"]*"' | cut -d'"' -f4)"
  exit 1
else
  echo "❌ Неизвестный ответ: $PANEL_RESPONSE"
  exit 1
fi

# Очистка
rm -f $COOKIE_FILE
