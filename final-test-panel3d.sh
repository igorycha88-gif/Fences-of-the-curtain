#!/bin/bash

# Финальный тест для проверки работ по монтажу 3D-панелей

echo "=== ФИНАЛЬНЫЙ ТЕСТ: Работы по монтажу 3D-панелей ===\n"

FENCE_TYPE_ID="cmmkk7wg5000j13wtie0o6rcw"

echo "ID типа забора: $FENCE_TYPE_ID (3D-панели)"
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

# Извлекаем результаты
PANEL3D_ITEM=$(echo "$RESPONSE" | jq '.items[] | select(.category == "panel3d")')
INSTALLATION_ITEMS=$(echo "$RESPONSE" | jq '[.items[] | select(.category == "installation")]')
PANEL3D_WORK=$(echo "$RESPONSE" | jq '.items[] | select(.category == "installation" and (.nomenclatureName | contains("Мотнаж") or .nomenclatureName | contains("3д")))')

echo "1. Позиция 3D-панели:"
echo "$PANEL3D_ITEM" | jq '.'

echo -e "\n2. Все работы по монтажу:"
echo "$INSTALLATION_ITEMS" | jq '.'

echo -e "\n3. Работа по монтажу 3D-панели:"
if [ -n "$PANEL3D_WORK" ]; then
  echo "$PANEL3D_WORK" | jq '.'
  echo -e "\n✅ ✅ ✅ УСПЕХ! Работа по монтажу 3D-панели НАЙДЕНА"
  
  # Проверяем стоимость
  WORK_PRICE=$(echo "$PANEL3D_WORK" | jq -r '.pricePerUnit')
  WORK_QTY=$(echo "$PANEL3D_WORK" | jq -r '.quantity')
  WORK_TOTAL=$(echo "$PANEL3D_WORK" | jq -r '.totalPrice')
  
  echo -e "\n💰 Детали работы:"
  echo "   - Название: $(echo "$PANEL3D_WORK" | jq -r '.nomenclatureName')"
  echo "   - Цена за единицу: ${WORK_PRICE}руб"
  echo "   - Количество: ${WORK_QTY}шт"
  echo "   - Итого: ${WORK_TOTAL}руб"
  
  # Проверяем, что количество работ совпадает с количеством панелей
  PANEL_QTY=$(echo "$PANEL3D_ITEM" | jq -r '.quantity')
  if [ "$WORK_QTY" = "$PANEL_QTY" ]; then
    echo -e "\n✅ Количество работ (${WORK_QTY}) совпадает с количеством панелей (${PANEL_QTY})"
  else
    echo -e "\n❌ Количество работ (${WORK_QTY}) НЕ совпадает с количеством панелей (${PANEL_QTY})"
  fi
  
  exit 0
else
  echo "❌ ❌ ❌ ОШИБКА! Работа по монтажу 3D-панели НЕ НАЙДЕНА"
  exit 1
fi
