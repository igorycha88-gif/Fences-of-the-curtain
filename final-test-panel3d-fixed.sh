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
PANEL3D_WORK=$(echo "$RESPONSE" | jq '.items[] | select(.category == "installation" and (.nomenclatureName | ascii_downcase | contains("мотнаж") or contains("3д")) or (.nomenclatureName | ascii_downcase | contains("монтаж") and (.nomenclatureName | ascii_downcase | contains("3д"))))')

echo "1. Позиция 3D-панели:"
echo "$PANEL3D_ITEM" | jq '.'

echo -e "\n2. Все работы по монтажу:"
echo "$INSTALLATION_ITEMS" | jq '.'

echo -e "\n3. Работа по монтажу 3D-панели:"
PANEL3D_WORK_CHECK=$(echo "$PANEL3D_WORK" | jq -c '.' 2>/dev/null)

if [ -n "$PANEL3D_WORK_CHECK" ] && [ "$PANEL3D_WORK_CHECK" != "null" ]; then
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
  
  # Проверяем общую стоимость монтажа
  TOTAL_INSTALLATION=$(echo "$RESPONSE" | jq '.totals.installation')
  BASE_INSTALLATION=$(echo "$INSTALLATION_ITEMS" | jq '.[] | select(.nomenclatureName == "Монтаж забора") | .totalPrice')
  PANEL3D_INSTALLATION=$(echo "$INSTALLATION_ITEMS" | jq '.[] | select(.nomenclatureName | ascii_downcase | contains("мотнаж") or contains("3д")) | .totalPrice')
  
  EXPECTED_TOTAL=$(echo "$BASE_INSTALLATION + $PANEL3D_INSTALLATION" | bc)
  
  echo -e "\n💵 Стоимость монтажа:"
  echo "   - Базовый монтаж: ${BASE_INSTALLATION}руб"
  echo "   - Монтаж 3D-панели: ${PANEL3D_INSTALLATION}руб"
  echo "   - Ожидаемый итог: ${EXPECTED_TOTAL}руб"
  echo "   - Фактический итог: ${TOTAL_INSTALLATION}руб"
  
  if [ "$(echo "$TOTAL_INSTALLATION == $EXPECTED_TOTAL" | bc)" -eq 1 ]; then
    echo -e "\n✅ Итоговая стоимость монтажа совпадает"
  else
    echo -e "\n❌ Итоговая стоимость монтажа НЕ совпадает"
  fi
  
  exit 0
else
  echo "❌ ❌ ❌ ОШИБКА! Работа по монтажу 3D-панели НЕ НАЙДЕНА"
  exit 1
fi
