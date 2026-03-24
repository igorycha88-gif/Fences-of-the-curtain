#!/bin/bash

# Тестирование получения типов заборов

echo "Тестирование получения типов заборов..."

curl -s "http://localhost:3001/api/calculator/fence-types" | jq '.' 2>/dev/null || curl -s "http://localhost:3001/api/calculator/fence-types"

