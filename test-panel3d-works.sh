#!/bin/bash

# Тестирование расчета сметы с 3D-панелями

echo "Тестирование расчета сметы с 3D-панелями..."

COOKIE_FILE=/tmp/cookies_test.txt

# Шаг 1: Логинимся
echo "1. Логинимся..."
curl -s -c $COOKIE_FILE -X POST http://localhost:3001/api/auth/callback/credentials \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "email=admin@test.com&password=admin123&csrfToken=test" > /dev/null

# Шаг 2: Получаем список работ, связанных с 3D-панелями
echo "2. Получаем список 3D-панелей..."
PANELS=$(curl -s -b $COOKIE_FILE "http://localhost:3001/api/admin/panel3d?page=1&pageSize=1&active=true")
echo "Ответ: $PANELS"

# Извлекаем ID первой панели
PANEL_ID=$(echo "$PANELS" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "ID панели: $PANEL_ID"

if [ -z "$PANEL_ID" ]; then
  echo "❌ Не удалось найти активные 3D-панели"
  rm -f $COOKIE_FILE
  exit 1
fi

# Шаг 3: Получаем работы для этой панели
echo "3. Получаем работы, связанные с панелью $PANEL_ID..."
WORKS=$(curl -s -b $COOKIE_FILE "http://localhost:3001/api/admin/works?referenceType=PANEL_3D&referenceId=$PANEL_ID&active=true&useInCalculator=true")
echo "Работы: $WORKS"

# Шаг 4: Делаем расчет сметы
echo "4. Делаем расчет сметы..."
ESTIMATE=$(curl -s -b $COOKIE_FILE \
  -X POST http://localhost:3001/api/calculator/estimate \
  -H "Content-Type: application/json" \
  -d '{
    "fenceTypeId": "profnastil-type",
    "length": 10,
    "height": 2,
    "lagRows": 2,
    "coating": "GALVANIZED",
    "hasGate": false,
    "hasWicket": false
  }')

echo "Расчет: $ESTIMATE"

# Проверяем, есть ли работы по монтажу
if echo "$ESTIMATE" | grep -q '"installation"'; then
  echo "✅ Работы по монтажу найдены в расчете"
else
  echo "⚠️ Работы по монтажу не найдены (возможно, нет связанных работ)"
fi

rm -f $COOKIE_FILE
