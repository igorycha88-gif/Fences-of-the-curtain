# Архитектура проекта: Сайт установки заборов и навесов

## 1. Выбранный технологический стек

### 1.1 Frontend + Backend (Fullstack)
| Компонент | Технология | Версия | Обоснование |
|-----------|------------|--------|-------------|
| Framework | **Next.js** | 14.x (App Router) | SSR/SSG, SEO, API routes, единый код |
| Language | **TypeScript** | 5.x | Типобезопасность, лучший DX |
| Styling | **Tailwind CSS** | 3.x | Быстрая разработка, адаптивность |
| Components | **shadcn/ui** | latest | Готовые компоненты, кастомизация |
| Forms | **React Hook Form** | 7.x + Zod | Валидация, производительность |
| State | **Zustand** | 4.x | Легкий, простой state management |

### 1.2 Backend (Next.js API Routes)
| Компонент | Технология | Версия | Обоснование |
|-----------|------------|--------|-------------|
| API | **Next.js Route Handlers** | 14.x | REST API в едином проекте |
| ORM | **Prisma** | 5.x | Типобезопасный ORM, миграции |
| Auth | **NextAuth.js** | 4.24.6 | Аутентификация, JWT сессии |
| Validation | **Zod** | 3.x | Схемы валидации |
| PDF | **React-PDF / jsPDF** | - | Генерация PDF-расчетов |

### 1.3 База данных и кеш
| Компонент | Технология | Версия | Обоснование |
|-----------|------------|--------|-------------|
| Database | **PostgreSQL** | 16.x | Надежность, JSON поддержка |
| Cache | **Redis** | 7.x | Кеш, сессии, rate limiting |

### 1.4 Инфраструктура
| Компонент | Технология | Обоснование |
|-----------|------------|-------------|
| Containerization | **Docker + Docker Compose** | Изоляция, воспроизводимость |
| Web Server | **Nginx** (reverse proxy) | SSL, статика, балансировка |
| PM | **PM2** (опционально) | Процессы Node.js |
| CI/CD | **GitHub Actions** | Автоматизация деплоя |

### 1.5 Интеграции
| Сервис | Назначение |
|--------|------------|
| Яндекс.Метрика / Google Analytics | Аналитика |
| Яндекс.Карты | Карта на странице контактов |
| Nodemailer + SMTP | Email-уведомления |
| Telegram Bot API | Уведомления менеджерам |

---

## 2. Архитектура приложения

### 2.1 Общая схема

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                         │
│                    Next.js (React + SSR/SSG)                     │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                      NEXT.JS APPLICATION                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   PAGES     │  │    API      │  │      SERVICES           │ │
│  │  (App Router)│  │  Routes     │  │  - Calculator Engine    │ │
│  │             │  │  (/api/*)   │  │  - PDF Generator        │ │
│  │  /          │  │             │  │  - Email Service        │ │
│  │  /calculator│  │  GET/POST   │  │  - Analytics            │ │
│  │  /portfolio │  │  PUT/DELETE │  │  - Map Integration      │ │
│  │  /contacts  │  │             │  │                         │ │
│  │  /admin/*   │  │             │  │                         │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    ▼                           ▼
          ┌─────────────────┐         ┌─────────────────┐
          │   PostgreSQL    │         │      Redis      │
          │   (Prisma ORM)  │         │   (Cache/Queue) │
          └─────────────────┘         └─────────────────┘
```

### 2.2 Структура директорий

```
project/
├── app/                          # Next.js App Router
│   ├── (public)/                 # Публичные страницы (group route)
│   │   ├── page.tsx              # Главная
│   │   ├── calculator/
│   │   │   ├── fence/
│   │   │   │   └── page.tsx      # Калькулятор забора
│   │   │   └── canopy/
│   │   │       └── page.tsx      # Калькулятор навеса
│   │   ├── services/
│   │   │   └── page.tsx          # Услуги
│   │   ├── portfolio/
│   │   │   └── page.tsx          # Портфолио
│   │   └── contacts/
│   │       └── page.tsx          # Контакты
│   │
│   ├── (admin)/                  # Админ-панель (protected)
│   │   ├── admin/
│   │   │   ├── layout.tsx        # Layout с проверкой auth
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx      # Дашборд
│   │   │   ├── materials/
│   │   │   │   ├── fence/
│   │   │   │   │   └── page.tsx  # Материалы заборов
│   │   │   │   └── canopy/
│   │   │   │       └── page.tsx  # Материалы навесов
│   │   │   ├── orders/
│   │   │   │   └── page.tsx      # Заявки
│   │   │   ├── prices/
│   │   │   │   └── page.tsx      # Цены
│   │   │   ├── content/
│   │   │   │   └── page.tsx      # Контент
│   │   │   └── users/
│   │   │       └── page.tsx      # Пользователи
│   │   │
│   ├── api/                      # API Routes
│   │   ├── auth/[...nextauth]/
│   │   │   └── route.ts          # NextAuth
│   │   ├── calculator/
│   │   │   ├── fence/
│   │   │   │   └── route.ts      # Расчет забора
│   │   │   └── canopy/
│   │   │       └── route.ts      # Расчет навеса
│   │   ├── orders/
│   │   │   ├── route.ts          # CRUD заявок
│   │   │   └── [id]/
│   │   │       └── route.ts
│   │   ├── materials/
│   │   │   └── route.ts          # CRUD материалов
│   │   └── contact/
│   │       └── route.ts          # Форма обратной связи
│   │
│   ├── layout.tsx                # Root layout
│   └── globals.css               # Глобальные стили
│
├── components/
│   ├── ui/                       # shadcn/ui компоненты
│   ├── calculator/               # Компоненты калькуляторов
│   │   ├── FenceCalculator.tsx
│   │   ├── CanopyCalculator.tsx
│   │   ├── ResultDisplay.tsx
│   │   └── ParameterInput.tsx
│   ├── admin/                    # Компоненты админки
│   ├── layout/                   # Layout компоненты
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── Sidebar.tsx
│   └── shared/                   # Общие компоненты
│
├── lib/
│   ├── prisma.ts                 # Prisma client
│   ├── redis.ts                  # Redis client
│   ├── auth.ts                   # NextAuth config
│   ├── validators/               # Zod схемы
│   │   ├── calculator.ts
│   │   └── order.ts
│   ├── utils/                    # Утилиты
│   │   ├── marginCalculator.ts   # Расчет маржи и закупочных цен
│   │   ├── formatters.ts         # Форматирование данных
│   │   └── priceCalculator.ts    # Расчет цен
│   └── permissions/              # Права доступа
│       └── rbac.ts               # Role-based access control
│
├── services/
│   ├── calculator/
│   │   ├── fenceCalculator.ts    # Логика расчета забора
│   │   └── canopyCalculator.ts   # Логика расчета навеса
│   ├── admin/
│   │   └── estimatesService.ts   # Сервис смет с расчетом маржи
│   ├── pdf/
│   │   └── generator.ts          # Генерация PDF
│   ├── email/
│   │   └── sender.ts             # Отправка email
│   └── telegram/
│       └── bot.ts                # Telegram уведомления
│
├── prisma/
│   ├── schema.prisma             # Схема БД
│   ├── migrations/               # Миграции
│   └── seeds/                    # Начальные данные
│
├── types/
│   └── index.ts                  # TypeScript типы
│
├── public/
│   ├── images/
│   └── fonts/
│
├── docker/
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── nginx.conf
│
└── configs/
    └── constants.ts              # Константы приложения
```

---

## 3. Схема базы данных

### 3.1 ER-диаграмма (Prisma Schema)

```prisma
// Пользователи
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  password  String
  role      Role     @default(MANAGER)
  phone     String?
  active    Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  orders    Order[]
}

enum Role {
  ADMIN
  MANAGER
  CONTENT_MANAGER
}

// Материалы для заборов
model FenceMaterial {
  id          String   @id @default(cuid())
  name        String
  category    FenceMaterialCategory
  unit        String       // м², м.п., шт
  basePrice   Float
  description String?
  image       String?
  thickness   Float?       // толщина
  width       Float?       // ширина
  height      Float?       // высота
  coating     String?      // тип покрытия
  active      Boolean  @default(true)
  sortOrder   Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

enum FenceMaterialCategory {
  PROFNASTIL
  SHAKHETNIK
  MESH
  PANELS_3D
  POSTS
  LAGS
  GATES
  WICKETS
  FASTENERS
}

// Материалы для навесов
model CanopyMaterial {
  id          String   @id @default(cuid())
  name        String
  category    CanopyMaterialCategory
  unit        String
  basePrice   Float
  thickness   Float?
  color       String?
  image       String?
  active      Boolean  @default(true)
  sortOrder   Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

enum CanopyMaterialCategory {
  POLYCARBONATE
  PROFNASTIL
  METAL_TILE
  PROFILE
  FASTENERS
  WATER_SYSTEM
}

// Типы заборов
model FenceType {
  id              String   @id @default(cuid())
  name            String
  description     String?
  image           String?
  difficultyCoef  Float    @default(1.0) // Коэффициент сложности
  active          Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

// Типы столбов
model PostType {
  id           String   @id @default(cuid())
  name         String
  section      String       // Сечение
  wallThickness Float      // Толщина стенки
  pricePerMeter Float
  priceWithConcrete Float?
  active       Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

// Типы грунта
model SoilType {
  id                String   @id @default(cuid())
  name              String
  surchargeCoef     Float    // Коэффициент удорожания (%)
  active            Boolean  @default(true)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

// Типы навесов
model CanopyType {
  id                String   @id @default(cuid())
  name              String
  description       String?
  image             String?
  areaCoef          Float    @default(1.0) // Коэффициент площади
  materialCoef      Float    @default(1.0) // Коэффициент расхода
  active            Boolean  @default(true)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

// Цены на работы
model WorkPrice {
  id          String   @id @default(cuid())
  name        String
  category    String       // fence, canopy
  pricePerUnit Float
  unit        String       // м.п., м², шт
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// Заявки
model Order {
  id              String   @id @default(cuid())
  clientName      String
  phone           String
  email           String?
  serviceType     String       // fence, canopy
  parameters      Json         // Параметры из калькулятора
  calculatedCost  Float
  status          OrderStatus @default(NEW)
  managerComment  String?
  assignedTo      String?
  assignedUser    User?    @relation(fields: [assignedTo], references: [id])
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  statusHistory   Json?        // История статусов
}

enum OrderStatus {
  NEW
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

// Портфолио
model PortfolioItem {
  id          String   @id @default(cuid())
  title       String
  category    String       // fence, canopy
  type        String?      // Тип забора/навеса
  description String?
  images      Json         // Массив URL изображений
  cost        Float?
  showCost    Boolean  @default(false)
  active      Boolean  @default(true)
  sortOrder   Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// Отзывы
model Review {
  id        String   @id @default(cuid())
  name      String
  text      String
  rating    Int          // 1-5
  image     String?
  active    Boolean  @default(true)
  sortOrder Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// Контент страниц
model PageContent {
  id          String   @id @default(cuid())
  slug        String   @unique
  title       String
  content     Json         // Блоки контента
  seoTitle       String?
  seoDescription String?
  seoKeywords    String?
  updatedAt   DateTime @updatedAt
  createdAt  DateTime @default(now())
}

// Настройки сайта
model Setting {
  id        String   @id @default(cuid())
  key       String   @unique
  value     String
  updatedAt DateTime @updatedAt
}
```

---

## 3.2 Справочники материалов (Reference Guides)

### Обзор

Система справочников материалов позволяет администраторам гибко управлять параметрами калькулятора без участия разработчиков.

### Структура справочников

**1. Типы заборов (FenceType)**
- Управление типами заборов (профнастил, евроштакетник, сетка-рабица, 3D-панели)
- Параметры: название, описание, изображение, коэффициент сложности, шаг установки столбов, количество лаг
- CRUD операции с проверкой использования в материалах
- Деактивация вместо удаления

**2. Высоты материалов (FenceMaterial.availableHeights)**
- Управление стандартными и нестандартными высотами материалов
- Коэффициенты цен для разных высот
- Пометка "нестандартная" для нестандартных высот
- Комментарии (например, "Под заказ")

**3. Типы покрытия (CoatingType)**
- Управление типами покрытия (оцинковка, полимерное одностороннее, полимерное двустороннее)
- Базовая стоимость (руб/м²)
- Коэффициент наценки

**4. Лаги (LagType)**
- Управление типами лаг (профиль 40x20, 40x40 и т.д.)
- Характеристики: ширина, высота, толщина металла
- Розничная цена за метр погонный (retailPricePerMeter)
- Закупочная цена за метр погонный (purchasePricePerMeter) - для аналитики маржинальности
- Доступные длины
- Период действия (validFrom, expirationDate)
- Приоритет выбора
- Деактивация вместо удаления

**5. Столбы (PostType)**
- Управление типами столбов
- Характеристики: сечение (ширина x высота), толщина стенки
- Цена за метр погонный и с бетонированием
- Доступные длины с ценами

### Архитектура сервисов

```
src/services/admin/
├── fenceTypeService.ts        # CRUD типов заборов
├── fenceHeightService.ts      # Управление высотами материалов
├── coatingTypeService.ts      # CRUD типов покрытия
├── lagTypeService.ts          # CRUD лаг
├── postTypeService.ts         # CRUD столбов
└── materialsService.ts        # Существующий сервис материалов
```

### Валидация

Все данные валидируются с помощью Zod схем:
- `src/lib/validators/fenceType.ts`
- `src/lib/validators/fenceHeight.ts`
- `src/lib/validators/coatingType.ts`
- `src/lib/validators/lagType.ts`
- `src/lib/validators/postType.ts`

### Логирование изменений

Все изменения справочников логируются в модель `ReferenceChangeLog`:
- Тип сущности (FenceType, CoatingType, LagType, PostType, FenceMaterial)
- ID сущности
- Измененное поле
- Старое и новое значение
- Кто и когда изменил

### Формулы расчета стоимости

**1. Расчет с учетом высоты материала:**
```typescript
finalMaterialCost = baseMaterialCost * heightCoef
```

**2. Расчет стоимости покрытия:**
```typescript
coatingCost = baseCoatingCost * area * markupCoef
totalCost = materialCost + coatingCost
```

**3. Расчет стоимости лаг:**
```typescript
// Количество лаг в одном ряду
baseLagsPerRow = roundUp(fenceLengthMm / lagLengthMm)

// Общее количество лаг (+2 на весь забор для компенсации стыков и обрезков)
totalLags = baseLagsPerRow * lagRows + 2

// Цена за одну лагу
pricePerUnit = lag.retailPricePerMeter * (lagLengthMm / 1000)

// Общая стоимость лаг
totalLagCost = totalLags * pricePerUnit
```

**4. Расчет стоимости столбов:**
```typescript
postLength = selectedFenceHeight + 0.7 // +0.7м на заглубление
lengthPrice = post.availableLengths.find(l => l.length === postLength)
totalPostCost = postsCount * postLength * pricePerMeter
```

### API Endpoints для справочников

| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET/POST | `/api/admin/materials/fence-types` | Список/создание типов заборов |
| GET/PUT/DELETE/PATCH | `/api/admin/materials/fence-types/[id]` | Операции с типом забора |
| GET/POST | `/api/admin/fence-heights` | Список материалов/добавление высоты |
| PUT/DELETE | `/api/admin/fence-heights/[materialId]/[height]` | Обновление/удаление высоты |
| GET/POST | `/api/admin/coating-types` | Список/создание типов покрытия |
| GET/PUT/DELETE/PATCH | `/api/admin/coating-types/[id]` | Операции с типом покрытия |
| GET/POST | `/api/admin/lag-types` | Список/создание лаг |
| GET/PUT/DELETE/PATCH | `/api/admin/lag-types/[id]` | Операции с лагой |
| GET/POST | `/api/admin/post-types` | Список/создание столбов |
| GET/PUT/DELETE/PATCH | `/api/admin/post-types/[id]` | Операции со столбом |

### Права доступа

- **ADMIN**: полный доступ ко всем операциям (создание, редактирование, удаление)
- **MANAGER**: чтение и редактирование цен, без удаления
- **CONTENT_MANAGER**: только чтение

---

## 4. API Endpoints

### 4.1 Публичные API

| Метод | Endpoint | Описание |
|-------|----------|----------|
| POST | `/api/calculator/fence` | Расчет стоимости забора |
| POST | `/api/calculator/canopy` | Расчет стоимости навеса |
| POST | `/api/orders` | Создание заявки |
| GET | `/api/materials/fence` | Получение материалов заборов |
| GET | `/api/materials/canopy` | Получение материалов навесов |
| GET | `/api/portfolio` | Список портфолио |
| GET | `/api/reviews` | Список отзывов |
| POST | `/api/contact` | Форма обратной связи |
| GET | `/api/settings` | Публичные настройки |

### 4.2 Административные API (требуется auth)

| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET/POST/PUT/DELETE | `/api/admin/materials/*` | Управление материалами |
| GET/POST/PUT/DELETE | `/api/admin/orders/*` | Управление заявками |
| GET/POST/PUT/DELETE | `/api/admin/prices/*` | Управление ценами |
| GET/POST/PUT/DELETE | `/api/admin/content/*` | Управление контентом |
| GET/POST/PUT/DELETE | `/api/admin/users/*` | Управление пользователями |
| GET | `/api/admin/statistics` | Статистика и аналитика |

### 4.3 Authentication API (NextAuth.js)

| Метод | Endpoint | Описание |
|-------|----------|----------|
| POST/GET | `/api/auth/signin` | Вход в систему |
| POST/GET | `/api/auth/signout` | Выход из системы |
| GET | `/api/auth/session` | Получение текущей сессии |
| GET | `/api/auth/csrf` | CSRF токен |
| POST/GET | `/api/auth/providers` | Доступные провайдеры |
| GET | `/api/auth/me` | Получение информации о текущем пользователе |

#### 4.3.1 Конфигурация NextAuth.js

**Auth Provider**: Credentials Provider

```typescript
// lib/auth.ts
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // Проверка пользователя в БД
        const user = await prisma.user.findUnique({
          where: { email: credentials?.email },
        });

        // Валидация пароля (plaintext для MVP)
        if (user && user.password === credentials?.password && user.active) {
          return {
            id: user.id,
            email: user.email,
            name: user.name,
          };
        }
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/admin/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
```

#### 4.3.2 Защита маршрутов

Админ-панель защищена на уровне компонента layout:

```typescript
// app/(admin)/admin/layout.tsx
export default function AdminLayout({ children }) {
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    const checkSession = async () => {
      const res = await fetch('/api/auth/me');
      if (res.status === 401) {
        redirect('/admin/login');
      }
      const data = await res.json();
      setSession(data.user);
    };
    checkSession();
  }, []);

  if (!session) {
    return null;
  }

  return <>{children}</>;
}
```

#### 4.3.3 Роли пользователей

```typescript
enum Role {
  ADMIN
  MANAGER
  CONTENT_MANAGER
}
```

**Иерархия прав**:
- **ADMIN**: Полный доступ ко всем функциям админки
- **MANAGER**: Доступ к заявкам, ценам, заказам
- **CONTENT_MANAGER**: Доступ к контенту и портфолио

#### 4.3.4 Безопасность

- **Сессии**: JWT токены с временем жизни 24 часа
- **Cookies**: httpOnly для защиты от XSS
- **CSRF**: Встроенная защита NextAuth.js
- **Rate Limiting**: (планируется) 10 запросов/мин на auth endpoints
- **Пароли**: (TODO) хеширование через bcrypt/argon2

#### 4.3.5 Test данные

```typescript
// admin@fences.ru / admin123 - Администратор
// manager@fences.ru / manager123 - Менеджер
```

---

## 5. Компоненты калькулятора

### 5.1 Структура калькулятора забора

```typescript
// types/calculator.ts
interface FenceCalculatorInput {
  fenceType: 'PROFNASTIL' | 'SHAKHETNIK' | 'MESH' | 'PANELS_3D';
  length: number;           // Длина забора (м)
  height: number;           // Высота забора (м)
  postType: string;         // ID типа столба
  lagType: string;          // ID типа лаг
  lagRows: 2 | 3;           // Количество рядов лаг
  hasGate: boolean;
  gateType?: 'SWING' | 'SLIDING';
  gateWidth?: number;
  hasWicket: boolean;
  wicketWidth?: number;
  coating: 'GALVANIZED' | 'POLYMER_SINGLE' | 'POLYMER_DOUBLE';
  color?: string;           // RAL код
  soilType: string;         // ID типа грунта
  region?: string;
}

interface FenceCalculatorResult {
  materials: {
    name: string;
    quantity: number;
    unit: string;
    pricePerUnit: number;
    total: number;
  }[];
  works: {
    name: string;
    quantity: number;
    unit: string;
    pricePerUnit: number;
    total: number;
  }[];
  materialsTotal: number;
  worksTotal: number;
  soilSurcharge: number;
  grandTotal: number;
}
```

### 5.2 Логика расчета (services/calculator/fenceCalculator.ts)

```typescript
export function calculateFence(input: FenceCalculatorInput): FenceCalculatorResult {
  const { length, height, lagRows, hasGate, hasWicket, soilType } = input;
  
  // Количество столбов (шаг 2.5м)
  const postsCount = Math.ceil(length / 2.5) + 1;
  
  // Длина лаг
  const lagsLength = length * lagRows;
  
  // Площадь покрытия
  const coverageArea = length * height;
  
  // Расчет стоимости материалов
  const materials = calculateMaterials(input, postsCount, lagsLength, coverageArea);
  
  // Расчет стоимости работ
  const works = calculateWorks(input, postsCount);
  
  // Коэффициент грунта
  const soilSurchargeCoef = getSoilSurcharge(soilType);
  
  // Итого
  const materialsTotal = materials.reduce((sum, m) => sum + m.total, 0);
  const worksTotal = works.reduce((sum, w) => sum + w.total, 0);
  const soilSurcharge = (materialsTotal + worksTotal) * (soilSurchargeCoef - 1);
  
  return {
    materials,
    works,
    materialsTotal,
    worksTotal,
    soilSurcharge,
    grandTotal: materialsTotal + worksTotal + soilSurcharge
  };
}
```

### 5.2 Компонент Header (Рефакторинг 03.03.2026)

**Файл:** `src/components/layout/Header.tsx`

**Описание:**
Единый компонент хедера для всех публичных страниц с консистентной навигацией, кнопкой "Войти" и hamburger menu для мобильных устройств.

**Функциональность:**
- Логотип со ссылкой на главную страницу
- Навигация: Главная, Калькулятор, Услуги, Портфолио, Контакты
- Кнопка "Войти" с выделением основным цветом бренда (primary)
- Подсветка активной страницы в навигации
- Адаптивная верстка с hamburger menu для мобильных устройств
- Client Component (использует useState для hamburger menu)

**Использование:**
```tsx
import Header from '@/components/layout/Header';

export default function Page() {
  return (
    <div>
      <Header />
      {/* Контент страницы */}
    </div>
  );
}
```

**Технологии:**
- Next.js usePathname() для определения активной страницы
- Lucide React иконки (Menu, X)
- Tailwind CSS для стилей
- Автоматическое определение активной страницы

**Изменения:**
- Устранено дублирование навигации на главной странице
- Кнопка "Войти" перенесена из футера в хедер
- Создана страница выбора калькулятора `/calculator`
- Консистентный хедер на всех публичных страницах

---

## 6. Docker конфигурация

### 6.1 docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: docker/Dockerfile
    container_name: fences-app
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@db:5432/fences
      - REDIS_URL=redis://redis:6379
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - NEXTAUTH_URL=${NEXTAUTH_URL}
    depends_on:
      - db
      - redis
    networks:
      - fences-network

  db:
    image: postgres:16-alpine
    container_name: fences-db
    restart: unless-stopped
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=fences
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - fences-network

  redis:
    image: redis:7-alpine
    container_name: fences-redis
    restart: unless-stopped
    volumes:
      - redis_data:/data
    networks:
      - fences-network

  nginx:
    image: nginx:alpine
    container_name: fences-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./docker/nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    networks:
      - fences-network

volumes:
  postgres_data:
  redis_data:

networks:
  fences-network:
    driver: bridge
```

### 6.2 Dockerfile

```dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
COPY prisma ./prisma/
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npx prisma generate
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

---

## 7. План разработки (MVP)

### Этап 1: Настройка проекта (1 неделя)
- [ ] Инициализация Next.js проекта с TypeScript
- [ ] Настройка Tailwind CSS + shadcn/ui
- [ ] Настройка Prisma + PostgreSQL
- [ ] Настройка Docker окружения
- [ ] Настройка NextAuth.js

### Этап 2: База данных и API (1 неделя)
- [ ] Создание Prisma schema
- [ ] Миграции и seed данные
- [ ] API routes для материалов
- [ ] API routes для калькуляторов

### Этап 3: Калькуляторы (2 недели)
- [ ] Калькулятор забора (UI + логика)
- [ ] Калькулятор навеса (UI + логика)
- [ ] Валидация форм
- [ ] Генерация PDF

### Этап 4: Публичные страницы (1 неделя)
- [ ] Главная страница
- [ ] Страница услуг
- [ ] Портфолио
- [ ] Контакты + карта
- [ ] Формы обратной связи

### Этап 5: Админ-панель (2 недели)
- [ ] Layout и авторизация
- [ ] Управление материалами
- [ ] Управление заявками
- [ ] Управление контентом
- [ ] Статистика

### Этап 6: Интеграции и тестирование (1 неделя)
- [ ] Email уведомления
- [ ] Telegram уведомления
- [ ] Яндекс.Метрика
- [ ] Яндекс.Карты
- [ ] Тестирование
- [ ] SEO оптимизация

### Этап 7: Деплой (3 дня)
- [ ] Настройка VPS
- [ ] SSL сертификат
- [ ] CI/CD pipeline
- [ ] Мониторинг

**Итого: ~8-9 недель**

---

## 8. Безопасность

### 8.1 Реализуемые меры
- HTTPS (Let's Encrypt SSL)
- NextAuth.js с безопасными сессиями
- CSRF защита (встроена в Next.js)
- Rate limiting на API endpoints (Redis)
- Валидация всех входных данных (Zod)
- CAPTCHA в формах (Google reCAPTCHA v3)
- Санитизация пользовательского ввода
- Ежедневное резервное копирование БД

### 8.2 Переменные окружения

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/fences"

# Redis
REDIS_URL="redis://localhost:6379"

# NextAuth
NEXTAUTH_SECRET="your-super-secret-key"
NEXTAUTH_URL="https://yourdomain.com"

# Email
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# Telegram
TELEGRAM_BOT_TOKEN="your-bot-token"
TELEGRAM_CHAT_ID="your-chat-id"

# reCAPTCHA
NEXT_PUBLIC_RECAPTCHA_SITE_KEY="your-site-key"
RECAPTCHA_SECRET_KEY="your-secret-key"

# Analytics
NEXT_PUBLIC_YANDEX_METRIKA_ID="your-id"
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID="your-id"

# Maps
NEXT_PUBLIC_YANDEX_MAPS_API_KEY="your-api-key"
```

---

## 9. SEO оптимизация

### 9.1 Реализация
- Server-Side Rendering (SSR) для всех страниц
- Meta tags через Next.js Metadata API
- Динамический sitemap.xml
- robots.txt
- Schema.org разметка (LocalBusiness, Service)
- Оптимизация изображений (next/image)
- Lazy loading
- Core Web Vitals оптимизация

### 9.2 Структура URL
```
/                           # Главная
/calculator                 # Выбор калькулятора (новое)
/calculator/fence           # Калькулятор забора
/calculator/canopy          # Калькулятор навеса
/services                   # Услуги
/services/fences            # Заборы
/services/canopies          # Навесы
/portfolio                  # Портфолио
/contacts                   # Контакты
```

---

## 10. Мониторинг и логирование

- **Логи**: Pino / Winston
- **Ошибки**: Sentry (опционально)
- **Аптайм**: UptimeRobot
- **Метрики**: Яндекс.Метрика + Vercel Analytics

---

## 11. Критерии готовности MVP

- [ ] Калькуляторы корректно рассчитывают стоимость
- [ ] PDF генерируется с правильными данными
- [ ] Заявки сохраняются и отображаются в админке
- [ ] Email уведомления приходят менеджеру
- [ ] Админка позволяет управлять материалами/ценами
- [ ] Сайт адаптивен (mobile-first)
- [ ] Время загрузки < 3 сек
- [ ] Lighthouse score > 80
- [ ] SEO базовая настройка выполнена

---

*Документ архитектуры v1.1*
*Дата: 03.03.2026*
*Последние изменения: Рефакторинг хедера и навигации*
*Стек: Next.js 14 + PostgreSQL + Docker*
