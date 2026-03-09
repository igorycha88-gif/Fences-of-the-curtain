# 🧪 Тестирование CRUD Лаги и Столбы

## ✅ Docker и сервисы запущены

**Статус:**
- ✅ fences-app (Next.js) - http://localhost:3001
- ✅ fences-nginx (Nginx) - http://localhost
- ✅ fences-db (PostgreSQL) - порт 5433
- ✅ fences-redis (Redis) - порт 6379

---

## 📋 Инструкции для тестирования

### 1. Откройте браузер
- Перейдите на **http://localhost**
- Откройте DevTools (F12 или Cmd+Option+I)
- Перейдите на вкладку **Console**

### 2. Откройте страницу справочника
- Авторизуйтесь в админке
- Перейдите в раздел **"Справочники"** → **"Лаги"** или **"Столбы"**

### 3. Попробуйте создать номенклатуру
- Нажмите кнопку **"Добавить"**
- Заполните форму
- Откройте вкладку **Network** в DevTools
- Нажмите **"Создать"**

---

## 🔍 Что искать в логах

### В консоли браузера:
- [LAGS PAGE] ========== FORM SUBMIT STARTED ==========
- [LAGS PAGE] Sending request: POST /api/admin/lag-types
- [LAGS PAGE] Response status: 201

### В логах сервера:
```bash
docker-compose logs -f app
```

Ожидаемые логи:
- [LAG-TYPES POST] Starting create lag type...
- [LAG-TYPES POST] Created lag with id: ...

---

## 🐛 Команды для отладки

### Просмотр логов в реальном времени:
```bash
docker-compose logs -f app
```

### Поиск конкретных логов:
```bash
docker-compose logs app | grep "LAG"
```
