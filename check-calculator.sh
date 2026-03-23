#!/bin/bash

echo "🔍 Проверка калькулятора заборов перед запуском..."
echo ""

# Проверка базы данных
echo "1️⃣ Проверка типов заборов в базе данных..."
node -e "
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.fenceType.findMany({
  where: { active: true },
  orderBy: { priority: 'asc' },
  select: { id: true, name: true, active: true, priority: true }
}).then(types => {
  console.log(\`   ✅ Найдено \${types.length} активных типов:\`);
  types.forEach(t => console.log(\`      - \${t.name}\`));
  prisma.\$disconnect();
  process.exit(types.some(t => t.name === '3D-панели') ? 0 : 1);
}).catch(e => {
  console.error('   ❌ Ошибка:', e.message);
  prisma.\$disconnect();
  process.exit(1);
});
" 2>&1 | grep -v "MODULE_TYPELESS_PACKAGE_JSON" | grep -v "Use.*trace-warnings"

if [ $? -eq 0 ]; then
  echo "   ✅ 3D-панели найдены в базе данных"
else
  echo "   ❌ 3D-панели не найдены!"
  exit 1
fi

echo ""
echo "2️⃣ Проверка материалов 3D-панелей..."
node -e "
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.panel3D.count({ where: { active: true } }).then(count => {
  console.log(\`   ✅ Активных 3D-панелей: \${count}\`);
  prisma.\$disconnect();
  process.exit(count > 0 ? 0 : 1);
}).catch(e => {
  console.error('   ❌ Ошибка:', e.message);
  prisma.\$disconnect();
  process.exit(1);
});
" 2>&1 | grep -v "MODULE_TYPELESS_PACKAGE_JSON" | grep -v "Use.*trace-warnings"

if [ $? -eq 0 ]; then
  echo "   ✅ Материалы 3D-панелей доступны"
else
  echo "   ❌ Материалы не найдены!"
  exit 1
fi

echo ""
echo "3️⃣ Проверка API endpoints..."
echo "   Запуск сервера для проверки..."

# Запуск сервера в фоновом режиме
npm run dev > /dev/null 2>&1 &
SERVER_PID=$!

# Ожидание запуска сервера
echo "   Ожидание запуска сервера..."
for i in {1..30}; do
  if curl -s http://localhost:3001 > /dev/null 2>&1; then
    echo "   ✅ Сервер запущен (PID: $SERVER_PID)"
    break
  fi
  sleep 1
done

# Проверка типов заборов через API
echo "   Проверка API типов заборов..."
API_RESPONSE=$(curl -s http://localhost:3001/api/calculator/fence-types)
if echo "$API_RESPONSE" | python3 -c "import sys,json; data=json.load(sys.stdin); sys.exit(0 if any('3D' in t.get('name','') for t in data.get('types',[])) else 1)" 2>/dev/null; then
  echo "   ✅ 3D-панели в API ответе"
else
  echo "   ❌ 3D-панели не найдены в API"
  kill $SERVER_PID 2>/dev/null
  exit 1
fi

# Проверка расчёта для 3D-панелей
echo "   Проверка расчёта для 3D-панелей..."
ESTIMATE_RESPONSE=$(curl -s -X POST http://localhost:3001/api/calculator/fence/estimate \
  -H 'Content-Type: application/json' \
  -d '{
    "fenceTypeId": "cmn3df0vx0000h05ukbtlr3as",
    "length": 50,
    "height": 2.0,
    "lagRows": 2,
    "coating": "GALVANIZED"
  }')

if echo "$ESTIMATE_RESPONSE" | python3 -c "import sys,json; data=json.load(sys.stdin); sys.exit(0 if any(i.get('category')=='panels3d' for i in data.get('items',[])) else 1)" 2>/dev/null; then
  echo "   ✅ Расчёт для 3D-панелей работает"
else
  echo "   ❌ Расчёт для 3D-панелей не работает"
  kill $SERVER_PID 2>/dev/null
  exit 1
fi

# Остановка сервера
kill $SERVER_PID 2>/dev/null
echo "   Сервер остановлен"

echo ""
echo "✅ Все проверки пройдены успешно!"
echo ""
echo "🚀 Для запуска сервера выполните:"
echo "   npm run dev"
echo ""
echo "📱 Калькулятор будет доступен по адресу:"
echo "   http://localhost:3001/calculator/fence"
echo ""
echo "💡 Если тип забора не отображается, очистите кэш:"
echo "   curl -X POST http://localhost:3001/api/debug/invalidate-cache"