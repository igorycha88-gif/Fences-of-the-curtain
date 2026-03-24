# 🚀 Local Development Quick Start Checklist

> Быстрый чеклист для локальной разработки приложения

---

## 📋 Перед началом работы

### Вариант 1: 🐳 All-in-One Docker (рекомендуется для демонстрации)

**Быстрый запуск всего окружения одной командой:**

```bash
# Все сервисы в одном контейнере (App + DB + Redis + Nginx)
npm run start:all-in-one

# Приложение доступно по:
# http://localhost:3001
```

**Что включает:**
- ✅ Next.js приложение (port 3001)
- ✅ PostgreSQL 16 (port 5432)
- ✅ Redis 7 (port 6379)
- ✅ Nginx (ports 80, 443, 3001)
- ✅ Health checks для всех сервисов
- ✅ Автоматическая проверка окружения

**Подробнее:** [All-in-One README](../docker/ALL_IN_ONE_README.md)

---

### Вариант 2: 🐳 Docker среда (рекомендуется)

```bash
# Запуск всех сервисов
docker-compose -f docker-compose.dev.yml up -d

# Проверка статуса сервисов
docker-compose -f docker-compose.dev.yml ps

# Просмотр логов
docker-compose -f docker-compose.dev.yml logs -f app
```

**Доступность сервисов:**
- PostgreSQL: localhost:5432 (внутри Docker сети: db:5432)
- Redis: localhost:6379 (внутри Docker сети: redis:6379)
- Приложение: http://localhost:3001

### 2. 💻 Локальная среда (без Docker)

```bash
# Запуск PostgreSQL
brew services start postgresql  # macOS
sudo systemctl start postgresql  # Linux

# Запуск Redis
brew services start redis  # macOS
sudo systemctl start redis  # Linux
```

---

## ✅ Автоматическая проверка

Запустите автоматическую проверку перед началом работы:

```bash
npm run health-check
```

Скрипт проверит:
- [ ] Порт 3001 свободен
- [ ] PostgreSQL доступен
- [ ] Redis доступен (опционально)
- [ ] node_modules установлен
- [ ] .env файл настроен
- [ ] NEXTAUTH_SECRET валидный (≥32 символа)

---

## 🔧 Первичная настройка (один раз)

### 1. Клонирование репозитория

```bash
git clone <repository-url>
cd "Fences of the curtain"
```

### 2. Установка зависимостей

```bash
npm install --legacy-peer-deps
```

### 3. Настройка переменных окружения

```bash
# Для локальной разработки
cp .env.example .env.dev

# Или для Docker разработки
cp .env.example .env.dev

# Редактируйте .env.dev
nano .env.dev
```

**Обязательные переменные:**
```env
DATABASE_URL="postgresql://postgres:dev_password@db:5432/fences"
REDIS_URL="redis://:dev_redis_password@redis:6379"
NEXTAUTH_SECRET="<минимум 32 символа>"
NEXTAUTH_URL="http://localhost:3001"
CRON_SECRET="<минимум 32 символа>"
```

### 4. Генерация секретов

```bash
# NEXTAUTH_SECRET
openssl rand -base64 32

# CRON_SECRET
openssl rand -base64 32

# POSTGRES_PASSWORD
openssl rand -base64 24 | tr -d '/+=' | cut -c1-20
```

### 5. Инициализация базы данных

```bash
# Docker
docker-compose -f docker-compose.dev.yml exec app npx prisma migrate dev
docker-compose -f docker-compose.dev.yml exec app npm run db:seed

# Локально
npx prisma migrate dev
npm run db:seed
```

---

## 🏃 Запуск разработки

### Docker (рекомендуется)

```bash
# Запуск всех сервисов
docker-compose -f docker-compose.dev.yml up -d

# Приложение доступно по: http://localhost:3001
# Hot reload работает через volumes
```

### Локально (без Docker)

```bash
# Убедитесь, что PostgreSQL и Redis запущены
npm run health-check

# Запуск dev сервера
npm run dev

# Приложение доступно по: http://localhost:3001
```

---

## 🔍 Полезные команды

### База данных

```bash
# Подключение к PostgreSQL (Docker)
docker-compose -f docker-compose.dev.yml exec db psql -U postgres fences

# Подключение к PostgreSQL (локально)
psql -d fences -U postgres

# Prisma Studio (визуализация данных)
npx prisma studio

# Создание миграции
npx prisma migrate dev --name "описание"

# Сброс БД (все данные будут потеряны!)
npx prisma migrate reset
```

### Тестирование

```bash
# Запуск всех тестов
npm test

# Запуск тестов с покрытием
npm test -- --coverage

# Запуск тестов в watch режиме
npm test -- --watch

# Проверка типов
npx tsc --noEmit
```

### Линтинг

```bash
# Проверка кода
npm run lint

# Автофикс проблем
npm run lint -- --fix
```

### Docker

```bash
# Просмотр логов всех сервисов
docker-compose -f docker-compose.dev.yml logs -f

# Просмотр логов конкретного сервиса
docker-compose -f docker-compose.dev.yml logs -f app

# Перезапуск сервиса
docker-compose -f docker-compose.dev.yml restart app

# Остановка всех сервисов
docker-compose -f docker-compose.dev.yml down

# Удаление volumes + остановка
docker-compose -f docker-compose.dev.yml down -v
```

---

## 🐛 Поиск проблем

### Порт 3001 занят

```bash
# Узнать что использует порт
lsof -i :3001

# Убить процесс
kill -9 <PID>

# Или использовать другой порт
PORT=3002 npm run dev
```

### PostgreSQL не запущен

```bash
# Проверка статуса
pg_isready

# Запуск
brew services start postgresql  # macOS
sudo systemctl start postgresql  # Linux
```

### Redis не запущен

```bash
# Проверка статуса
redis-cli ping

# Запуск
brew services start redis  # macOS
sudo systemctl start redis  # Linux
```

### Ошибки Redis при сборке

```
Redis error: AggregateError [ECONNREFUSED]
```

Это нормально в development! Redis опционален, приложение продолжит работу.

### Ошибка NEXTAUTH_SECRET

```
Error: NEXTAUTH_SECRET is too short
```

Решение:
```bash
# Генерация нового секрета
openssl rand -base64 32 > /tmp/secret.txt

# Обновление .env.dev
nano .env.dev
# Вставьте значение из /tmp/secret.txt
```

### Ошибки миграций

```bash
# Проверить статус миграций
npx prisma migrate status

# Сброс БД и повторная инициализация
npx prisma migrate reset
npm run db:seed
```

---

## 📊 Мониторинг

### Ресурсы (Docker)

```bash
# Статистика контейнеров
docker stats

# Использование диска
docker system df

# Очистка неиспользуемых ресурсов
docker system prune -a
```

### Логи приложения

```bash
# Логи dev сервера
npm run dev

# Логи PM2 (если используется)
pm2 logs
pm2 monit
```

---

## 🧪 Тестирование локально

### Проверка калькуляторов

```bash
# Калькулятор заборов
curl -X POST http://localhost:3001/api/calculator/fence \
  -H "Content-Type: application/json" \
  -d '{"length":10,"height":2,"fenceTypeId":1}'

# Калькулятор навесов
curl -X POST http://localhost:3001/api/calculator/canopy \
  -H "Content-Type: application/json" \
  -d '{"width":6,"depth":3,"roofType":"flat"}'
```

### Проверка API

```bash
# Проверка health endpoint
curl http://localhost:3001/api/health

# Проверка материалов
curl http://localhost:3001/api/materials

# Проверка авторизации
curl http://localhost:3001/api/auth/session
```

---

## 🎯 Доступ по умолчанию

| Компонент | URL/Docker | Локально |
|-----------|-------------|----------|
| Приложение | http://localhost:3001 | http://localhost:3001 |
| PostgreSQL | db:5432 | localhost:5432 |
| Redis | redis:6379 | localhost:6379 |
| Prisma Studio | npx prisma studio | npx prisma studio |

---

## 📚 Дополнительная документация

- [Local Development Guide](./LOCAL_DEVELOPMENT.md) - Подробный гайд
- [Deployment Guide](../DEPLOYMENT.md) - Деплой на продакшн
- [CI/CD Guide](../CI_CD.md) - Настройка CI/CD
- [API Documentation](../API.md) - Документация API

---

## ⚡ Быстрые команды

```bash
# Полная установка с нуля
npm run health-check && npm run dev

# Docker установка с нуля
docker-compose -f docker-compose.dev.yml up -d && npm run health-check

# Применение миграций
docker-compose -f docker-compose.dev.yml exec app npx prisma migrate dev

# Сброс и повторная инициализация БД
docker-compose -f docker-compose.dev.yml down -v && \
docker-compose -f docker-compose.dev.yml up -d && \
docker-compose -f docker-compose.dev.yml exec app npx prisma migrate dev && \
docker-compose -f docker-compose.dev.yml exec app npm run db:seed
```

---

**Удачной разработки! 🚀**
