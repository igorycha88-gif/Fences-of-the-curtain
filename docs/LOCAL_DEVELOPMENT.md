# 💻 Local Development Guide

Гайд для локальной разработки и отладки приложения.

## 📋 Требования

- Node.js 20+
- PostgreSQL 16+ (локально или через Docker)
- Redis 7+ (локально или через Docker)
- npm или yarn
- Docker и Docker Compose (для контейнеризации)

## 🚀 Быстрый старт

### Способ A: Docker (рекомендуется)

```bash
# 1. Клонирование репозитория
git clone <repository-url>
cd Fences-of-the-curtain

# 2. Настройка окружения
cp .env.example .env
nano .env  # или ваш любимый редактор

# 3. Запуск контейнеров
docker-compose -f docker-compose.dev.yml up -d

# 4. Применение миграций
docker-compose -f docker-compose.dev.yml exec app npx prisma migrate dev
docker-compose -f docker-compose.dev.yml exec app npm run db:seed

# 5. Проверка
curl http://localhost:3000/
```

### Способ B: Локальная установка (без Docker)

```bash
# 1. Установка зависимостей
npm install

# 2. Настройка окружения
cp .env.example .env
nano .env

# 3. Настройка базы данных PostgreSQL
# Убедитесь, что PostgreSQL установлен и запущен
createdb fences

# 4. Настройка Redis
# Убедитесь, что Redis установлен и запущен
redis-cli ping  # должно вернуть PONG

# 5. Применение миграций
npx prisma migrate dev
npx prisma generate

# 6. Заполнение данными
npm run db:seed

# 7. Запуск в режиме разработки
npm run dev
```

Приложение будет доступно по адресу: http://localhost:3001

## 🗂️ Структура проекта

```
Fences-of-the-curtain/
├── src/
│   ├── app/              # Next.js App Router
│   ├── components/       # React компоненты
│   ├── lib/             # Утилиты и конфигурации
│   ├── services/         # Бизнес-логика
│   └── types/           # TypeScript типы
├── prisma/
│   ├── schema.prisma    # Схема БД
│   └── migrations/      # Миграции БД
├── public/              # Статические файлы
├── docker/              # Docker конфигурации
├── docs/                # Документация
└── tests/               # Тесты
```

## 🔧 Полезные команды

### Разработка

```bash
# Запуск dev сервера
npm run dev

# Запуск dev сервера на другом порту
PORT=3002 npm run dev

# Горячая перезагрузка
npm run dev  # автоматически перезагружается при изменении файлов
```

### База данных

```bash
# Создание миграции
npx prisma migrate dev --name "описание_изменения"

# Применение миграций
npx prisma migrate dev

# Генерация Prisma Client
npx prisma generate

# Заполнение данными
npm run db:seed

# Сброс БД (осторожно!)
npx prisma migrate reset

# Просмотр БД
npx prisma studio  # откроется http://localhost:5555
```

### Тестирование

```bash
# Запуск тестов
npm test

# Запуск тестов с coverage
npm test -- --coverage

# Запуск тестов в watch режиме
npm test -- --watch

# Запуск определенного теста
npm test -- --testNamePattern="имя_теста"
```

### Линтинг и типизация

```bash
# Проверка типов
npx tsc --noEmit

# Линтинг
npm run lint

# Автофикс линтинга
npm run lint -- --fix
```

### Docker

```bash
# Запуск dev окружения
docker-compose -f docker-compose.dev.yml up -d

# Остановка
docker-compose -f docker-compose.dev.yml down

# Просмотр логов
docker-compose -f docker-compose.dev.yml logs -f app

# Пересборка контейнеров
docker-compose -f docker-compose.dev.yml build

# Вход в контейнер
docker-compose -f docker-compose.dev.yml exec app bash
```

## 🔍 Работа с базой данных

### Локальная PostgreSQL (Docker)

```bash
# Подключение к БД
docker-compose -f docker-compose.dev.yml exec db psql -U postgres fences

# Команды внутри psql
\l                    # список БД
\dt                   # список таблиц
\d имя_таблицы       # структура таблицы
SELECT * FROM "FenceType";  # выборка данных
\q                    # выход
```

### Локальная PostgreSQL (системная)

```bash
# Подключение к БД
psql -d fences -U postgres

# Или через сокет
sudo -u postgres psql -d fences
```

## 🔒 Переменные окружения

### Обязательные для работы

```bash
# База данных
DATABASE_URL="postgresql://postgres:password@localhost:5432/fences"

# Redis
REDIS_URL="redis://localhost:6379"

# NextAuth.js
NEXTAUTH_SECRET="your-super-secret-key-min-32-chars"
NEXTAUTH_URL="http://localhost:3000"  # или http://localhost:3001
```

### Опциональные

```bash
# SMTP (для email уведомлений)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# Telegram (для уведомлений)
TELEGRAM_BOT_TOKEN="your-bot-token"
TELEGRAM_CHAT_ID="your-chat-id"

# reCAPTCHA
NEXT_PUBLIC_RECAPTCHA_SITE_KEY="your-site-key"
RECAPTCHA_SECRET_KEY="your-secret-key"

# Аналитика
NEXT_PUBLIC_YANDEX_METRIKA_ID="your-metrika-id"
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID="your-analytics-id"
NEXT_PUBLIC_YANDEX_MAPS_API_KEY="your-maps-api-key"

# Cron эндпоинты
CRON_SECRET="your-cron-secret"
```

## 🐛 Отладка

### Отладка API

```bash
# Запуск с отладочным выводом
NODE_ENV=development npm run dev

# Отладка конкретного API endpoint
curl http://localhost:3001/api/calculator/fence
curl -X POST http://localhost:3001/api/orders \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com",...}'
```

### Отладка с VS Code

Создайте файл `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node-terminal",
      "request": "launch",
      "command": "npm run dev"
    },
    {
      "name": "Next.js: debug client-side",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000"
    }
  ]
}
```

### Логирование

```bash
# Логи dev сервера
npm run dev

# Логи PM2 (если используется)
pm2 logs

# Логи Docker
docker-compose -f docker-compose.dev.yml logs -f

# Системные логи (systemd)
journalctl -u fences -f
```

## 🧪 Работа с миграциями

### Создание новой миграции

```bash
# 1. Измените schema.prisma
nano prisma/schema.prisma

# 2. Создайте миграцию
npx prisma migrate dev --name "add_new_field"

# 3. Примените миграцию (автоматически)
# Миграция автоматически применится к локальной БД
```

### Отмена миграции

```bash
# Отмена последней миграции
npx prisma migrate resolve --rolled-back "имя_миграции"

# Полный сброс БД
npx prisma migrate reset
```

### Проверка миграций

```bash
# Статус миграций
npx prisma migrate status

# Применение только новых миграций
npx prisma migrate deploy
```

## 🔐 Тестирование авторизации

### Создание тестового пользователя

```bash
# Локальная разработка
# С помощью seed:
npm run db:seed

# Создание вручную:
npx prisma studio
# Откроется http://localhost:5555
# Создайте пользователя в таблице User
```

### Проверка авторизации

```bash
# Получить session
curl http://localhost:3001/api/auth/session

# Авторизация (POST /api/auth/signin)
curl -X POST http://localhost:3001/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@fences.ru","password":"admin123"}'
```

## 📊 Мониторинг производительности

### Локальная производительность

```bash
# Проверка размера бандла
npm run build
# Посмотрите размер .next/ папки

# Линтинг производительности
npm run lint

# Type checking
npx tsc --noEmit
```

### Профилирование API

```bash
# Используйте встроенные инструменты браузера
# Откройте DevTools → Network → XHR
# Или используйте curl с временем выполнения:
time curl http://localhost:3001/api/calculator/fence
```

## 🧹 Очистка

```bash
# Очистка node_modules
rm -rf node_modules package-lock.json
npm install

# Очистка Docker контейнеров
docker-compose -f docker-compose.dev.yml down -v

# Очистка локальной БД
npx prisma migrate reset

# Очистка Prisma Client
npx prisma generate
```

## 📝 Частые проблемы

### Ошибка: Database connection failed

```bash
# Проверьте что PostgreSQL запущен
pg_isready

# Проверьте переменную DATABASE_URL в .env
echo $DATABASE_URL

# Перезапустите PostgreSQL
sudo systemctl restart postgresql
# или для Docker:
docker-compose -f docker-compose.dev.yml restart db
```

### Ошибка: Redis connection failed

```bash
# Проверьте что Redis запущен
redis-cli ping

# Перезапустите Redis
sudo systemctl restart redis
# или для Docker:
docker-compose -f docker-compose.dev.yml restart redis
```

### Ошибка: NEXTAUTH_SECRET is too short

```bash
# Сгенерируйте новый секрет
openssl rand -base64 32

# Обновите .env файл
nano .env
```

### Ошибка: Port already in use

```bash
# Узнайте что использует порт 3001
lsof -i :3001

# Убейте процесс
kill -9 <PID>

# Или используйте другой порт
PORT=3002 npm run dev
```

## 🚨 Полезные советы

1. **Всегда коммитьте миграции**: Миграции должны быть в репозитории
2. **Никогда не коммитьте .env**: Используйте .env.example
3. **Проверяйте типы перед коммитом**: `npx tsc --noEmit`
4. **Запускайте тесты перед пушем**: `npm test`
5. **Используйте git hooks**: Настройте pre-commit для проверки
6. **Держите зависимости актуальными**: `npm outdated`
7. **Читайте логи**: `npm run dev` покажет полезную информацию

## 📚 Дополнительные ресурсы

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [React Documentation](https://react.dev)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [Project Documentation](../README.md)
- [Production Deployment](./PRODUCTION_DEPLOYMENT.md)
- [CI/CD Guide](../docs/CICD_SETUP_GUIDE.md)
