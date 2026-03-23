# Заборы и Навесы

Веб-приложение для компании по установке заборов и навесов с онлайн-калькуляторами стоимости.

## 📚 Документация

- 📘 [Local Development Guide](docs/LOCAL_DEVELOPMENT.md) - Гайд для локальной разработки
- 🚀 [Production Deployment Guide](docs/PRODUCTION_DEPLOYMENT.md) - Быстрый деплой на production
- 📦 [Deployment Guide](DEPLOYMENT.md) - Подробное руководство по деплою
- ⚙️ [CI/CD Setup Guide](docs/CICD_SETUP_GUIDE.md) - Настройка CI/CD с GitHub Actions
- 📋 [CI/CD Plan](docs/cicd-plan.md) - План реализации CI/CD
- ✅ [CI Checklist](docs/CI_CHECKLIST.md) - Чеклист для CI/CD

## Технологический стек

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL 16
- **ORM**: Prisma 5
- **Cache/Rate Limiting**: Redis 7
- **Authentication**: NextAuth.js
- **Validation**: Zod
- **PDF Generation**: jsPDF
- **Containerization**: Docker + Docker Compose

## Функциональность

### Публичная часть
- Главная страница с информацией о компании
- Калькулятор забора с детальным расчетом стоимости
- Калькулятор навеса с чертежами и расчетом
- Страница услуг с ценами и описанием
- Портфолио с фильтрацией по типу
- Страница контактов с формой обратной связи

### Админ-панель
- Управление материалами для заборов и навесов
- Управление заявками и статусами
- Управление ценами на работы
- Управление контентом страниц
- Управление пользователями и правами доступа
- Статистика и аналитика

## Установка и запуск

### Требования
- Node.js 20+
- PostgreSQL 16+
- Redis 7+ (обязательно для rate limiting)
- npm или yarn
- Docker и Docker Compose (опционально, для контейнеризации)

### Переменные окружения

Для работы приложения необходимы следующие переменные в `.env`:

```bash
# База данных
DATABASE_URL="postgresql://user:password@localhost:5432/fences"

# Redis (обязательно для rate limiting)
REDIS_URL="redis://localhost:6379"

# NextAuth.js
NEXTAUTH_SECRET="your-super-secret-key-min-32-chars"
NEXTAUTH_URL="http://localhost:3001"
```

### Redis Аутентификация

⚠️ **ВАЖНО: Redis работает с обязательной аутентификацией!**

Приложение использует Redis с паролем для защиты данных сессий, кеша и rate limiting.

#### Production (docker-compose.yml)

1. **Генерация пароля Redis:**
```bash
./scripts/setup-redis-secret.sh
```

Скрипт создаст файл `secrets/redis_password` с криптографически стойким паролем.

2. **Проверка подключения:**
```bash
# Подключение без пароля (должно быть отказано)
docker exec fences-redis redis-cli PING
# Ожидается: (error) NOAUTH Authentication required

# Подключение с паролем (должно быть успешно)
docker exec fences-redis redis-cli -a $(cat secrets/redis_password) PING
# Ожидается: PONG
```

3. **Безопасность:**
- ✅ Пароль хранится в Docker secrets (`./secrets/redis_password`)
- ✅ Файл `secrets/` добавлен в `.gitignore`
- ✅ Порт 6379 НЕ доступен с хост-машины (только внутри Docker сети)
- ❌ НИКОГДА не коммитьте файл `secrets/redis_password`

#### Development (docker-compose.dev.yml)

Для локальной разработки используется файл `.env.dev`:

```bash
# .env.dev
REDIS_PASSWORD=dev_redis_password_change_in_production
```

**Запуск development конфигурации:**
```bash
# Используйте .env файл для development (по умолчанию)
docker-compose -f docker-compose.dev.yml up -d

# Или явно укажите .env.dev
docker-compose -f docker-compose.dev.yml --env-file .env.dev up -d
```

#### Ручная настройка пароля

Если нужно установить конкретный пароль:

```bash
# 1. Создайте директорию secrets
mkdir -p secrets

# 2. Сгенерируйте пароль
openssl rand -base64 32 > secrets/redis_password

# 3. Установите права
chmod 600 secrets/redis_password

# 4. Добавьте в .env
REDIS_PASSWORD=$(cat secrets/redis_password)
```

### Rate Limiting

Приложение использует Redis для rate limiting на публичных API:
- **POST /api/orders**: 5 запросов в час с одного IP
- **POST /api/auth/signin**: 5 запросов в 15 минут с одного IP

Конфигурация rate limiting хранится в таблице `RateLimitConfig` и может быть изменена без перезапуска сервера.

### Локальная разработка

1. Клонирование репозитория
```bash
git clone <repository-url>
cd fences-curtain
```

2. Установка зависимостей
```bash
npm install
```

3. Настройка окружения
```bash
cp .env.example .env
# Отредактируйте .env файл с вашими данными
```

4. Настройка базы данных
```bash
# Создайте базу данных PostgreSQL
# Примените миграции
npm run db:push

# Заполните тестовыми данными
npm run db:seed
```

5. Запуск разработки
```bash
PORT=3001 npm run dev
```

Приложение будет доступно по адресу: http://localhost:3001

> **Важно**: UI всегда запускается на порту **3001**

### Запуск с Docker

#### Production (рекомендуется для продакшн)

1. Настройка окружения
```bash
cp .env.example .env
# Установите переменные окружения
```

2. Генерация пароля Redis
```bash
./scripts/setup-redis-secret.sh
# или вручную:
openssl rand -base64 32 > secrets/redis_password
chmod 600 secrets/redis_password
```

3. Настройка SSL сертификатов (для HTTPS)
```bash
mkdir -p ssl
# Если используете Let's Encrypt:
sudo certbot certonly --standalone -d yourdomain.com
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ssl/fullchain.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ssl/privkey.pem
sudo chown -R $USER:$USER ssl
```

4. Запуск контейнеров
```bash
docker-compose up -d
```

**Важно:** В production PostgreSQL порт 5433 НЕ доступен извне. БД доступна только внутри Docker сети.

5. Применение миграций
```bash
docker-compose exec app npx prisma migrate deploy
docker-compose exec app npm run db:seed
```

#### Development

1. Настройка окружения
```bash
cp .env.example .env.dev
# Установите переменные окружения в .env.dev
```

2. Запуск development конфигурации
```bash
docker-compose -f docker-compose.dev.yml up -d
```

3. Применение миграций
```bash
docker-compose -f docker-compose.dev.yml exec app npx prisma migrate dev
docker-compose -f docker-compose.dev.yml exec app npm run db:seed
```

**Важно:** В development PostgreSQL доступен на порту 5433 только для удобства отладки. Для подключения к БД:
```bash
docker-compose -f docker-compose.dev.yml exec db psql -U postgres fences
```

## Доступ к админ-панели

После запуска seed данных доступны следующие учетные записи:

- **Администратор**: admin@fences.ru / admin123
- **Менеджер**: manager@fences.ru / manager123

### Настройка авторизации

Для работы системы авторизации необходимы следующие переменные окружения в файле `.env`:

```bash
# NextAuth.js
NEXTAUTH_SECRET="your-super-secret-key-min-32-chars"
NEXTAUTH_URL="http://localhost:3000"  # для локальной разработки
# NEXTAUTH_URL="https://yourdomain.com"  # для production
```

**Генерация NEXTAUTH_SECRET:**

```bash
openssl rand -base64 32
```

⚠️ **ВАЖНО: Требования безопасности NEXTAUTH_SECRET**

**Приложение НЕ ЗАПУСТИТСЯ если NEXTAUTH_SECRET:**
- Не определен
- Меньше 32 символов
- Содержит placeholder значения:
  - `your-super-secret-key-change-in-production`
  - `change-in-production`, `your-super-secret`
  - `secret`, `test`, `dev`, `REPLACE_WITH_REAL_SECRET`

**Для Production:**
- ✅ Используйте переменные окружения сервера (НЕ .env файл)
- ✅ Vercel: Environment Variables в настройках проекта
- ✅ Docker: используйте secrets или `-e` флаг
- ✅ Kubernetes: используйте Secrets
- ❌ НИКОГДА не коммитьте .env файл в git
- ❌ НИКОГДА не используйте placeholder значения в production

**Вход в админ-панель:**

1. Перейдите на главную страницу: http://localhost:3000
2. В футере нажмите кнопку "Войти"
3. Введите email и пароль (см. выше)
4. При успешном входе вы будете перенаправлены на дашборд

**Роли пользователей:**

- **ADMIN**: Полный доступ ко всем функциям админки
- **MANAGER**: Доступ к заявкам и ценам
- **CONTENT_MANAGER**: Доступ к контенту и портфолио

**Безопасность:**

- Сессии хранятся в httpOnly cookies
- JWT токены с временем жизни 24 часа
- CSRF защита (встроена в NextAuth.js)
- Все маршруты `/admin/*` защищены авторизацией

## Скрипты

```bash
npm run dev          # Запуск development сервера
npm run build        # Сборка для production
npm run start        # Запуск production сервера
npm run lint         # Проверка линтинга
npm test             # Запуск тестов

npm run db:generate  # Генерация Prisma Client
npm run db:push     # Применение схемы БД
npm run db:migrate   # Создание миграций
npm run db:seed     # Заполнение БД данными
```

## Структура проекта

```
src/
├── app/                 # Next.js App Router
│   ├── (public)/       # Публичные страницы
│   ├── (admin)/        # Админ-панель
│   └── api/           # API Routes
├── components/          # React компоненты
├── lib/               # Утилиты и конфигурации
├── services/           # Бизнес-логика
├── types/             # TypeScript типы
prisma/                # Prisma schema и миграции
docker/                 # Docker конфигурации
public/                 # Статические файлы
```

## API документация

### Публичные API

- `POST /api/calculator/fence` - Расчет стоимости забора
- `POST /api/calculator/canopy` - Расчет стоимости навеса
- `POST /api/orders` - Создание заявки
- `GET /api/materials` - Получение материалов
- `POST /api/contact` - Форма обратной связи

### Административные API (требуется авторизация)

- `GET/POST /api/admin/materials` - Управление материалами
- `GET/POST /api/admin/orders` - Управление заявками
- `GET /api/admin/statistics` - Статистика

### Authentication API (NextAuth.js)

- `POST /api/auth/signin` - Вход в систему
- `POST /api/auth/signout` - Выход из системы
- `GET /api/auth/session` - Получение текущей сессии
- `GET /api/auth/me` - Получение информации о текущем пользователе
- `GET /api/auth/csrf` - CSRF токен

## Тестирование

```bash
npm test              # Запуск тестов
```

**Покрытие тестами:**

- Валидация email и пароля
- Логика авторизации (authorize function)
- Калькуляторы заборов и навесов

Для запуска тестов в режиме watch:
```bash
npm test -- --watch
```

Для запуска тестов с покрытием:
```bash
npm test -- --coverage
```

## Деплой

### Подготовка к деплою

1. Сборка проекта
```bash
npm run build
```

2. Настройка окружения на сервере
```bash
# Установите все переменные окружения в .env
```

3. Запуск с Docker
```bash
docker-compose up -d
```

## Лицензия

MIT

## Контакты

Email: info@fences.ru
Телефон: +7 (900) 123-45-67

## Дополнительная документация

- [Local Development Guide](docs/LOCAL_DEVELOPMENT.md) - Гайд для локальной разработки
- [Production Deployment Guide](docs/PRODUCTION_DEPLOYMENT.md) - Быстрый деплой на production
- [Deployment Guide](DEPLOYMENT.md) - Подробное руководство по деплою
- [CI/CD Setup Guide](docs/CICD_SETUP_GUIDE.md) - Настройка CI/CD с GitHub Actions
- [CI/CD Plan](docs/cicd-plan.md) - План реализации CI/CD
- [CI Checklist](docs/CI_CHECKLIST.md) - Чеклист для CI/CD

## Быстрый старт

### Локальная разработка

```bash
# Клонирование репозитория
git clone <repository-url>
cd Fences-of-the-curtain

# Установка зависимостей
npm install

# Настройка окружения
cp .env.example .env
nano .env

# Запуск в режиме разработки
npm run dev
```

Подробнее в [Local Development Guide](docs/LOCAL_DEVELOPMENT.md)

### Production деплой

```bash
# На сервере
git clone <repository-url>
cd Fences-of-the-curtain

# Настройка окружения
cp .env.example .env
nano .env

# Запуск
docker-compose up -d

# Миграции
docker-compose exec app npx prisma migrate deploy
docker-compose exec app npm run db:seed
```

Подробнее в [Production Deployment Guide](docs/PRODUCTION_DEPLOYMENT.md)
