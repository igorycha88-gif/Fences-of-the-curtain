#!/bin/bash

echo "=== Testing Lag Types API ==="

# Get auth token (you need to login first)
echo "1. Testing GET /api/admin/lag-types"
curl -X GET http://localhost:3000/api/admin/lag-types \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -b cookies.txt \
  | jq .

echo -e "\n2. Testing POST /api/admin/lag-types (create new lag)"
curl -X POST http://localhost:3000/api/admin/lag-types \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -b cookies.txt \
  -d '{
    "name": "Тестовая лага",
    "description": "Тестовое описание",
    "width": 40,
    "height": 20,
    "metalThickness": 2.0,
    "basePricePerMeter": 150,
    "active": true,
    "sortOrder": 0,
    "availableLengths": [
      {"length": 2.5, "priceCoef": 1.0}
    ]
  }' \
  | jq .

echo -e "\n=== Check logs ==="
tail -n 50 /tmp/next-dev.log
