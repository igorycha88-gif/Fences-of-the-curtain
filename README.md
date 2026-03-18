# Заборы и Навесы

Веб-приложение для компании по установке заборов и навесов с онлайн-калькуляторами стоимости.

## Технологический стек

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL 16
- **ORM**: Prisma 5
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
- Redis 7+
- npm или yarn

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

1. Настройка окружения
```bash
cp .env.example .env
# Установите переменные окружения
```

2. Запуск контейнеров
```bash
docker-compose up -d
```

3. Применение миграций
```bash
docker-compose exec app npx prisma db push
docker-compose exec app npm run db:seed
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
