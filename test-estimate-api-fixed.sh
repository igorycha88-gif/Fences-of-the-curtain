#!/bin/bash

# Тестирование расчета сметы через API

echo "=== Тестирование расчета сметы с 3D-панелями (через API) ==="

# ID типа забора "3D-панели"
FENCE_TYPE_ID="cmmkk7wg5000j13wtie0o6rcw"

echo "ID типа забора: $FENCE_TYPE_ID"
echo "Параметры: длина 10м, высота 2м\n"

# Делаем запрос к API
RESPONSE=$(curl -s -X POST http://localhost:3001/api/calculator/fence/estimate \
  -H "Content-Type: application/json" \
  -d "{
    \"fenceTypeId\": \"$FENCE_TYPE_ID\",
    \"length\": 10,
    \"height\": 2,
    \"lagRows\": 2,
    \"hasGate\": false,
    \"hasWicket\": false
  }")

echo "Ответ API:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"

echo -e "\n=== Анализ результатов ==="

# Проверяем позицию 3D-панели
echo -e "\n1. Позиция 3D-панели:"
echo "$RESPONSE" | jq '.items[] | select(.category == "panel3d")' 2>/dev/null || echo "Не найдена"

# Проверяем работы по монтажу
echo -e "\n2. Работы по монтажу:"
echo "$RESPONSE" | jq '.items[] | select(.category == "installation")' 2>/dev/null || echo "Не найдены"

# Проверяем, есть ли работа по монтажу 3D-панели
echo -e "\n3. Проверка работы по монтажу 3D-панели:"
PANEL3D_WORK=$(echo "$RESPONSE" | jq '.items[] | select(.category == "installation" and (.nomenclatureName | contains("Мотнаж") or .nomenclatureName | contains("Монтаж")))' 2>/dev/null)

if [ -n "$PANEL3D_WORK" ]; then
  echo "✅ Работа по монтажу 3D-панели НАЙДЕНА:"
  echo "$PANEL3D_WORK" | jq '.'
else
  echo "❌ Работа по монтажу 3D-панели НЕ НАЙДЕНА"
fi

# Проверяем общую стоимость монтажа 3D-панели
echo -e "\n4. Общая стоимость монтажа 3D-панели:"
PANEL3D_INSTALLATION_TOTAL=$(echo "$RESPONSE" | jq '.panel3dInstallationTotal' 2>/dev/null || echo "null")
echo "Стоимость: $PANEL3D_INSTALLATION_TOTAL руб."

if [ "$PANEL3D_INSTALLATION_TOTAL" != "null" ] && [ "$PANEL3D_INSTALLATION_TOTAL" != "0" ]; then
  echo "✅ Стоимость монтажа 3D-панели указана и не равна 0"
else
  echo "❌ Стоимость монтажа 3D-панели равна 0 или не указана"
fi

echo -e "\n=== ТЕСТИРОВАНИЕ ЗАВЕРШЕНО ==="
