#!/bin/bash

# Проверка данных в БД

echo "=== Проверка данных в базе данных ==="

echo -e "\n1. Проверяем таблицу Panel3D..."
npx prisma db execute --stdin << 'SQL'
SELECT id, name, "panelHeight", "panelWidth", "retailPricePerUnit", active, priority 
FROM "Panel3D" 
WHERE active = true 
ORDER BY priority ASC, "panelHeight" ASC
LIMIT 5;
SQL

echo -e "\n2. Проверяем таблицу Work (активные работы для калькулятора)..."
npx prisma db execute --stdin << 'SQL'
SELECT id, name, category, price, "useInCalculator", active 
FROM "Work" 
WHERE "useInCalculator" = true AND active = true
ORDER BY "sortOrder" ASC
LIMIT 10;
SQL

echo -e "\n3. Проверяем связи между Work и Panel3D..."
npx prisma db execute --stdin << 'SQL'
SELECT 
  w.id as work_id,
  w.name as work_name,
  w.category,
  w.price,
  wr."referenceType",
  wr."referenceId",
  p.name as panel_name,
  p."panelHeight"
FROM "Work" w
LEFT JOIN "WorkRelation" wr ON w.id = wr."workId"
LEFT JOIN "Panel3D" p ON wr."referenceId" = p.id AND wr."referenceType" = 'PANEL_3D'
WHERE w.active = true
ORDER BY w.id, wr."referenceId"
LIMIT 20;
SQL

echo -e "\n4. Проверяем только работы, связанные с PANEL_3D..."
npx prisma db execute --stdin << 'SQL'
SELECT 
  w.id as work_id,
  w.name as work_name,
  w.category,
  w.price,
  wr."referenceId",
  p.name as panel_name
FROM "Work" w
INNER JOIN "WorkRelation" wr ON w.id = wr."workId" AND wr."referenceType" = 'PANEL_3D'
INNER JOIN "Panel3D" p ON wr."referenceId" = p.id
WHERE w.active = true AND p.active = true
ORDER BY w.id;
SQL

echo -e "\n=== ПРОВЕРКА ЗАВЕРШЕНА ==="
