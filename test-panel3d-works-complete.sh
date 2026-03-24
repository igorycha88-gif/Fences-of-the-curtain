#!/bin/bash

# Полное тестирование расчета сметы с 3D-панелями

echo "=== Тестирование расчета сметы с 3D-панелями ==="

COOKIE_FILE=/tmp/cookies_panel3d.txt

# Шаг 1: Логинимся
echo -e "\n1. Логинимся в админку..."
curl -s -c $COOKIE_FILE -X POST http://localhost:3001/api/auth/callback/credentials \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "email=admin@test.com&password=admin123&csrfToken=test" > /dev/null
echo "✅ Вошли в систему"

# Шаг 2: Получаем список 3D-панелей
echo -e "\n2. Получаем список 3D-панелей..."
PANELS=$(curl -s -b $COOKIE_FILE "http://localhost:3001/api/admin/panel3d?page=1&pageSize=10&active=true")
echo "$PANELS" | jq '.items[] | {id, name, active}' 2>/dev/null || echo "$PANELS"

# Извлекаем ID первой активной панели
PANEL_ID=$(echo "$PANELS" | jq -r '.items[0].id' 2>/dev/null)
echo -e "\n📋 ID первой панели: $PANEL_ID"

if [ -z "$PANEL_ID" ] || [ "$PANEL_ID" = "null" ]; then
  echo "❌ Не удалось найти активные 3D-панели"
  rm -f $COOKIE_FILE
  exit 1
fi

# Шаг 3: Проверяем связанные работы
echo -e "\n3. Проверяем связанные работы для панели $PANEL_ID..."
WORKS=$(curl -s -b $COOKIE_FILE "http://localhost:3001/api/admin/works?referenceType=PANEL_3D&referenceId=$PANEL_ID&active=true&useInCalculator=true")
WORKS_COUNT=$(echo "$WORKS" | jq '.items | length' 2>/dev/null || echo "0")

echo "Количество связанных работ: $WORKS_COUNT"

if [ "$WORKS_COUNT" = "0" ]; then
  echo "⚠️ ВНИМАНИЕ: Нет связанных работ для этой 3D-панели"
  echo "   Работы по монтажу не будут добавлены в расчет"
else
  echo "✅ Найдены связанные работы:"
  echo "$WORKS" | jq '.items[] | {id, name, category, price}' 2>/dev/null || echo "$WORKS"
fi

# Шаг 4: Делаем расчет сметы с 3D-панелями
echo -e "\n4. Делаем расчет сметы с 3D-панелями (длина 10м, высота 2м)..."
FENCE_TYPE_ID="cmmkk7wg5000j13wtie0o6rcw"  # ID типа забора "3D-панели"

ESTIMATE=$(curl -s -b $COOKIE_FILE \
  -X POST http://localhost:3001/api/calculator/estimate \
  -H "Content-Type: application/json" \
  -d "{
    \"fenceTypeId\": \"$FENCE_TYPE_ID\",
    \"length\": 10,
    \"height\": 2,
    \"lagRows\": 2,
    \"hasGate\": false,
    \"hasWicket\": false
  }")

echo "Результат расчета:"
echo "$ESTIMATE" | jq '.' 2>/dev/null || echo "$ESTIMATE"

# Шаг 5: Проверяем наличие работ по монтажу в расчете
echo -e "\n5. Анализ результатов расчета..."
TOTAL_INSTALLATION_ITEMS=$(echo "$ESTIMATE" | jq '[.items[] | select(.category == "installation")] | length' 2>/dev/null || echo "0")

if [ "$TOTAL_INSTALLATION_ITEMS" = "0" ]; then
  echo "❌ Работы по монтажу ОТСУТСТВУЮТ в расчете"
  echo "   Это означает, что логика получения связанных работ НЕ РАБОТАЕТ"
else
  echo "✅ Работы по монтажу ПРИСУТСТВУЮТ в расчете"
  echo "$ESTIMATE" | jq '.items[] | select(.category == "installation")' 2>/dev/null || echo "$ESTIMATE"
fi

# Дополнительная проверка:panel3dInstallationTotal
PANEL3D_INSTALLATION_TOTAL=$(echo "$ESTIMATE" | jq '.panel3dInstallationTotal' 2>/dev/null || echo "null")
echo -e "\n💰 Стоимость монтажа 3D-панели: $PANEL3D_INSTALLATION_TOTAL руб."

rm -f $COOKIE_FILE

echo -e "\n=== ТЕСТИРОВАНИЕ ЗАВЕРШЕНО ==="
