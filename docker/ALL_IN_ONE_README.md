# 🐳 All-in-One Docker Setup

> Полное окружение в одном Docker контейнере: App + PostgreSQL + Redis + Nginx

**Версия:** 1.0.0
**Дата:** 24 марта 2026
**DevOps Engineer:** Оптимизация локальной сборки

---

## 📋 Что это?

All-in-One Docker - это решение для быстрого запуска всего окружения разработки в одном контейнере. Все сервисы (приложение, база данных, Redis, Nginx) работают внутри одного контейнера, что упрощает:

- ✅ Быстрый запуск одной командой
- ✅ Не нужно устанавливать PostgreSQL, Redis отдельно
- ✅ Все переменные окружения централизованы
- ✅ Health checks для всех сервисов
- ✅ Nginx для HTTP/HTTPS

---

## 🚀 Быстрый старт

### 1. Настройка окружения

Создайте `.env` файл с секретами:

```bash
cp .env.example .env
nano .env
```

**Обязательные переменные:**
```env
POSTGRES_PASSWORD=your_secure_password_here
REDIS_PASSWORD=your_redis_password_here
NEXTAUTH_SECRET=$(openssl rand -base64 32)
NEXTAUTH_URL=http://localhost:3001
CRON_SECRET=$(openssl rand -base64 32)
```

### 2. Запуск всех сервисов

```bash
npm run start:all-in-one
```

Скрипт автоматически:
- ✅ Проверит наличие `.env` файла
- ✅ Проверит валидность секретов
- ✅ Соберет Docker образ
- ✅ Запустит все сервисы (App + DB + Redis + Nginx)
- ✅ Покажет статус сервисов
- ✅ Покажет URL для доступа

---

## 📊 Сервисы

### 📦 Приложение

- **Порт:** 3001
- **Технологии:** Next.js 14, React 18, TypeScript
- **Node.js:** 20.x
- **Путь внутри контейнера:** `/app`

### 🐘 PostgreSQL

- **Порт:** 5432 (только внутри Docker сети)
- **Версия:** 16 Alpine
- **Объем:** `postgres_data`
- **База данных:** `fences`

### 🔴 Redis

- **Порт:** 6379 (только внутри Docker сети)
- **Версия:** 7 Alpine
- **Объем:** `redis_data`
- **Аутентификация:** Включена (пароль из `REDIS_PASSWORD`)

### 🌐 Nginx

- **Порты:** 80 (HTTP), 443 (HTTPS), 3001 (прокси)
- **Конфигурация:** `docker/nginx.conf`
- **SSL:** Опционально (смонтируется в `./ssl/`)

---

## 🔧 Управление сервисами

### Старт

```bash
npm run start:all-in-one
```

### Остановка

```bash
docker-compose -f docker-compose.all-in-one.yml down
```

### Просмотр логов

```bash
# Все сервисы
docker-compose -f docker-compose.all-in-one.yml logs -f

# Только приложение
docker-compose -f docker-compose.all-in-one.yml logs -f app

# PostgreSQL
docker-compose -f docker-compose.all-in-one.yml logs -f db

# Redis
docker-compose -f docker-compose.all-in-one.yml logs -f redis
```

### Пересборка

```bash
docker-compose -f docker-compose.all-in-one.yml build app
```

### Перезапуск конкретного сервиса

```bash
# Приложение
docker-compose -f docker-compose.all-in-one.yml restart app

# База данных
docker-compose -f docker-compose.all-in-one.yml restart db

# Redis
docker-compose -f docker-compose.all-in-one.yml restart redis
```

---

## 🌐 Доступность

### Приложение

- **HTTP:** http://localhost:3001
- **Через Nginx:** http://localhost:3001

### База данных

Внутри контейнера:
```bash
docker-compose -f docker-compose.all-in-one.yml exec app npx prisma studio
```

Или подключение к внешней PostgreSQL:
```bash
psql -h localhost -p 5432 -U postgres -d fences
```

---

## 🗂 Структура проекта

```
fences-curtain/
├── docker/
│   ├── Dockerfile                 # Production multi-stage
│   ├── Dockerfile.dev            # Development (hot-reload)
│   └── Dockerfile.all-in-one     # Все сервисы в одном
├── docker-compose.yml              # Production (отдельные сервисы)
├── docker-compose.dev.yml          # Development (отдельные сервисы)
├── docker-compose.all-in-one.yml    # Все сервисы в одном
├── docker/nginx.conf              # Nginx конфигурация
├── scripts/
│   ├── local-health-check.sh       # Проверка окружения
│   └── start-all-in-one.sh       # Быстрый старт all-in-one
├── prisma/
│   └── schema.prisma             # Схема БД
└── src/
    ├── app/                      # Next.js App Router
    ├── components/                # React компоненты
    ├── lib/                      # Утилиты
    ├── services/                 # Бизнес-логика
    └── types/                   # TypeScript типы
```

---

## 🔐 Безопасность

### Secrets Management

✅ Все секреты хранятся в `.env` файле
✅ `.env` добавлен в `.gitignore`
✅ `.env.example` содержит только плейсхолдеры

### PostgreSQL Security

✅ PostgreSQL доступен только внутри Docker сети
✅ Пароль через переменную окружения
✅ Health check: `pg_isready -U postgres`

### Redis Security

✅ Redis доступен только внутри Docker сети
✅ Аутентификация через `--requirepass`
✅ Health check: `redis-cli -a password ping`

### Nginx Security

✅ Security headers (X-Frame-Options, X-Content-Type-Options, etc.)
✅ SSL/TLS на порту 443
✅ HTTP → HTTPS redirect

---

## 📈 Мониторинг

### Health Checks

```bash
docker-compose -f docker-compose.all-in-one.yml ps

# Вывод:
# fences-app     Up (healthy)
# fences-db      Up (healthy)
# fences-redis   Up (healthy)
# fences-nginx   Up
```

### Логи

```bash
# Real-time логи всех сервисов
docker-compose -f docker-compose.all-in-one.yml logs -f

# Статистика ресурсов
docker stats
```

---

## 🐛 Поиск проблем

### Порт 3001 занят

```bash
# Узнать что использует порт
lsof -i :3001

# Убить процесс
kill -9 <PID>
```

### База данных не запущена

```bash
docker-compose -f docker-compose.all-in-one.yml logs db
docker-compose -f docker-compose.all-in-one.yml restart db
```

### Redis не запущен

```bash
docker-compose -f docker-compose.all-in-one.yml logs redis
docker-compose -f docker-compose.all-in-one.yml restart redis
```

### Ошибки подключения к БД

```bash
# Проверка логов приложения
docker-compose -f docker-compose.all-in-one.yml logs app

# Проверка логов PostgreSQL
docker-compose -f docker-compose.all-in-one.yml logs db

# Пересоздание базы данных
docker-compose -f docker-compose.all-in-one.yml down -v
docker-compose -f docker-compose.all-in-one.yml up -d
```

---

## 🔄 Сравнение с другими конфигурациями

### docker-compose.dev.yml (Development с отдельными контейнерами)

**Плюсы:**
- ✅ Hot-reload через volumes
- ✅ Быстрая разработка
- ✅ Изолированная отладка

**Минусы:**
- ❌ Нужно запускать несколько контейнеров
- ❌ Больше ресурсов памяти

### docker-compose.yml (Production с отдельными контейнерами)

**Плюсы:**
- ✅ Масштабирование (можно масштабировать кажды сервис отдельно)
- ✅ Изоляция сервисов
- ✅ Production-ready

**Минусы:**
- ❌ Сложнее управление
- ❌ Больше контейнеров

### docker-compose.all-in-one.yml (Все сервисы в одном)

**Плюсы:**
- ✅ Быстрый старт одной командой
- ✅ Минимум настройки
- ✅ Все сервисы в одном месте
- ✅ Идеально для демонстрации

**Минусы:**
- ❌ Нет hot-reload для разработки
- ❌ Один большой контейнер

---

## 🎯 Рекомендации

### Для локальной разработки

Используйте **`docker-compose.dev.yml`** + **`docker/Dockerfile.dev`**:
- Hot-reload через volumes
- Быстрая перекомпиляция
- Отдельный контейнер для отладки

### Для демонстрации

Используйте **`npm run start:all-in-one`**:
- Один контейнер для всего окружения
- Быстрый старт
- Легкий останов

### Для production

Используйте **`docker-compose.yml`** + **`docker/Dockerfile`**:
- Масштабирование
- Отдельные сервисы
- Production-ready оптимизации

---

## 📚 Дополнительная документация

- [Local Development Quick Start](./LOCAL_DEVELOPMENT_QUICKSTART.md) - Быстрые команды для локальной разработки
- [DevOps Fix Report](./DEVOPS_FIX_REPORT.md) - Отчет по исправлению проблем
- [Deployment Guide](../DEPLOYMENT.md) - Деплой на продакшн
- [CI/CD Documentation](../CI_CD.md) - Настройка CI/CD

---

## ⚡ Быстрые команды

```bash
# Запуск all-in-one
npm run start:all-in-one

# Проверка окружения
npm run health-check

# Запуск dev (локально)
npm run dev

# Просмотр логов
docker-compose -f docker-compose.all-in-one.yml logs -f app

# Остановка
docker-compose -f docker-compose.all-in-one.yml down

# Пересборка
docker-compose -f docker-compose.all-in-one.yml build app
```

---

**Удачной разработки! 🚀**

**DevOps Engineer**
**Дата:** 24 марта 2026
**Статус:** ✅ Готово к работе
