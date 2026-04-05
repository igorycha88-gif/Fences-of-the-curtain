# 🚀 Docker Deployment - Готово!

## ✅ Все сервисы запущены успешно!

### Контейнеры:
```
✓ fences-app     - Next.js приложение (порт 3000)
✓ fences-db      - PostgreSQL база данных (порт 5432)
✓ fences-redis   - Redis кеш (порт 6379)
✓ fences-nginx   - Nginx reverse proxy (порты 80, 443)
```

### Проверка статуса:
```bash
docker-compose ps
```

### Доступ к приложению:

**Главная страница:**
- http://localhost:3000 (через Node.js)
- http://localhost (через Nginx)

**Админ-панель:**
- http://localhost:3000/admin/login
- http://localhost/admin/login

**Тестовые аккаунты:**
- **Админ:** admin@fences.ru / admin123
- **Менеджер:** manager@fences.ru / manager123

### База данных:

**Подключение:**
```bash
docker exec -it fences-db psql -U postgres -d fences
```

**Проверка данных:**
```bash
# Пользователи
docker exec fences-db psql -U postgres -d fences -c "SELECT email, role FROM \"User\";"

# Материалы
docker exec fences-db psql -U postgres -d fences -c "SELECT name, category FROM \"FenceMaterial\" LIMIT 5;"

# Заявки
docker exec fences-db psql -U postgres -d fences -c "SELECT \"clientName\", status FROM \"Order\";"
```

**Тестовые данные:**
- 2 пользователя (admin, manager)
- 7 материалов для заборов
- 5 материалов для навесов
- 4 типа заборов
- 3 типа навесов
- 5 цен на работы
- 3 тестовые заявки

### Логи:

**Все сервисы:**
```bash
docker-compose logs
```

**Только приложение:**
```bash
docker-compose logs app
```

**Следить за логами в реальном времени:**
```bash
docker-compose logs -f app
```

### Управление:

**Остановить все сервисы:**
```bash
docker-compose down
```

**Перезапустить:**
```bash
docker-compose restart
```

**Пересобрать и запустить:**
```bash
docker-compose up -d --build
```

**Остановить и удалить volumes:**
```bash
docker-compose down -v
```

### Реализованные функции:

✅ **Публичная часть:**
- Главная страница
- Калькулятор заборов
- Калькулятор навесов
- Портфолио
- Контакты

✅ **Админ-панель:**
- Дашборд со статистикой
- Управление материалами (заборы/навесы)
- Управление заявками
- Управление пользователями
- Ролевой доступ (RBAC)

✅ **API:**
- Авторизация (NextAuth.js)
- CRUD для материалов
- CRUD для заявок
- Статистика и аналитика

### Переменные окружения (.env):

```bash
DATABASE_URL="postgresql://postgres:password@db:5432/fences"
REDIS_URL="redis://redis:6379"
NEXTAUTH_SECRET="your-super-secret-key-change-in-production"
NEXTAUTH_URL="http://localhost:3000"
```

### Мониторинг:

**Проверка здоровья сервисов:**
```bash
# PostgreSQL
docker exec fences-db pg_isready

# Redis
docker exec fences-redis redis-cli ping

# Приложение
curl http://localhost:3000/api/auth/me
```

### Резервное копирование:

**Создать бэкап БД:**
```bash
docker exec fences-db pg_dump -U postgres fences > backup.sql
```

**Восстановить из бэкапа:**
```bash
cat backup.sql | docker exec -i fences-db psql -U postgres fences
```

### Обновление:

**Обновить код:**
```bash
git pull
docker-compose down
docker-compose up -d --build
```

**Применить миграции:**
```bash
docker-compose exec app npx prisma migrate deploy
```

---

## 🎉 Проект готов к использованию!

**Доступ:** http://localhost:3000/admin/login
**Логин:** admin@fences.ru
**Пароль:** admin123

Все функции кабинета администратора реализованы и работают! 🚀
