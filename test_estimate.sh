#!/bin/bash

# Получаем список типов заборов
TYPES_RESPONSE=$(curl -s http://localhost:3001/api/calculator/fence-types)
echo "=== Fence Types ==="
echo "$TYPES_RESPONSE" | jq '.'

# Получаем первый ID типа забора
FIRST_TYPE_ID=$(echo "$TYPES_RESPONSE" | jq -r '.types[0].id')
echo ""
echo "=== Using Fence Type ID: $FIRST_TYPE_ID ==="

# Делаем тестовый запрос к estimate
ESTIMATE_RESPONSE=$(curl -s -X POST http://localhost:3001/api/calculator/fence/estimate \
  -H "Content-Type: application/json" \
  -d "{\"fenceTypeId\":\"$FIRST_TYPE_ID\",\"length\":50,\"height\":2.0,\"lagRows\":2}")

echo ""
echo "=== Estimate Response ==="
echo "$ESTIMATE_RESPONSE" | jq '.'

echo ""
echo "=== Response Status Code ==="
curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3001/api/calculator/fence/estimate \
  -H "Content-Type: application/json" \
  -d "{\"fenceTypeId\":\"$FIRST_TYPE_ID\",\"length\":50,\"height\":2.0,\"lagRows\":2}"
