# Инструкция по запуску проекта

## ✅ Проект готов к работе!

### Что было сделано:

1. ✅ **База данных**: Созданы все таблицы вручную через SQL
2. ✅ **Тестовые данные**: Добавлены пользователи admin@fences.ru и manager@fences.ru
3. ✅ **Исправлен layout**: Заменен `redirect()` на `router.push()` для корректной работы на клиенте
4. ✅ **Backend сервисы**: Все сервисы реализованы (materialsService, ordersService, statisticsService, etc.)
5. ✅ **API Routes**: Все endpoints созданы и защищены авторизацией
6. ✅ **UI страницы**: Дашборд, материалы, заявки, пользователи

### Как запустить:

```bash
# 1. Запустить контейнеры (если не запущены)
docker-compose up -d

# 2. Запустить development сервер
npm run dev
```

### Доступ:

**Главная страница:**
- http://localhost:3000

**Админ-панель:**
- http://localhost:3000/admin/login
- **Email**: admin@fences.ru
- **Пароль**: admin123

**Альтернативный пользователь:**
- **Email**: manager@fences.ru
- **Пароль**: manager123

### Реализованные функции:

✅ **Дашборд** (`/admin/dashboard`)
- Статистика: новые заявки, в работе, завершено, конверсия
- Последние заявки

✅ **Управление материалами** (`/admin/materials`)
- Вкладки: заборы и навесы
- Фильтрация по категориям
- Поиск
- Активация/деактивация
- Удаление

✅ **Управление заявками** (`/admin/orders`)
- Фильтрация по статусу, типу услуги
- Поиск по имени, телефону
- Изменение статуса
- Цветовая индикация

✅ **Управление пользователями** (`/admin/users`)
- Фильтрация по роли, активности
- Поиск по email, имени
- Активация/деактивация
- Удаление

✅ **Ролевой доступ (RBAC)**
- ADMIN: полный доступ
- MANAGER: материалы, заявки, цены
- CONTENT_MANAGER: контент

✅ **API Endpoints**
- Все CRUD операции для материалов, заявок, пользователей
- Статистика и аналитика
- Защита авторизацией

### База данных:

**Контейнер PostgreSQL:**
- Host: localhost:5432
- Database: fences
- User: postgres
- Password: password

**Проверка данных:**
```bash
docker exec fences-db psql -U postgres -d fences -c "SELECT email, role FROM \"User\";"
```

### Тестирование:

```bash
npm test
```

**Результат:** 22 теста проходят успешно

### Следующие шаги (опционально):

- [ ] Детальная страница заявки (`/admin/orders/[id]`)
- [ ] Управление ценами с историей (`/admin/prices`)
- [ ] Управление контентом (`/admin/content`)
- [ ] Страница статистики с графиками (`/admin/statistics`)
- [ ] Экспорт данных в Excel/CSV
- [ ] Уведомления по email/Telegram

### Технические детали:

**Стек:**
- Next.js 14 (App Router)
- TypeScript
- Prisma ORM
- PostgreSQL 16
- NextAuth.js
- Tailwind CSS

**Структура:**
- `/src/app/(admin)/admin/*` - страницы админки
- `/src/app/api/admin/*` - API endpoints
- `/src/services/admin/*` - бизнес-логика
- `/src/lib/permissions/rbac.ts` - ролевой доступ
- `/prisma/schema.prisma` - схема БД

### Устранение проблем:

**Если не работает авторизация:**
1. Проверьте NEXTAUTH_SECRET в .env
2. Проверьте NEXTAUTH_URL в .env
3. Перезапустите сервер: `npm run dev`

**Если база данных недоступна:**
1. Проверьте контейнеры: `docker-compose ps`
2. Перезапустите: `docker-compose restart db`
3. Проверьте логи: `docker-compose logs db`

**Если страница не загружается:**
1. Очистите кеш: `rm -rf .next`
2. Перезапустите: `npm run dev`
