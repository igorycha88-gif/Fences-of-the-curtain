# 🚀 План деплоя: main → master → VPS

## 📋 Текущий статус

✅ **PR #17 создан:** https://github.com/igorycha88-gif/Fences-of-the-curtain/pull/17
- База: `master`
- Источник: `main`
- Состояние: **OPEN** (ожидает мерджа)

## 📦 Что в PR #17

### Новые фичи из main:
1. **Портфолио управление**
   - Загрузка изображений
   - Редактирование/удаление
   - Активация/деактивация
   - Сортировка (drag & drop)
   - Массовые операции

2. **Безопасность**
   - ✅ Тестовые креды удалены с `/admin/login`
   - ✅ Rate Limiting для API
   - ✅ Audit Log система
   - ✅ Хеширование паролей bcrypt

3. **Улучшения**
   - Профнастил: purchasePricePerLinearMeter
   - Калькулятор: оптимизация выбора столбов
   - Docker: безопасная конфигурация
   - PM2: graceful restart

4. **VPS Workflows (новые!)**
   - `check-login-file.yml` - проверка отсутствия тестовых кредов
   - `check-response.yml` - проверка HTML ответа
   - `port-check.yml` - проверка портов и процессов
   - `deploy.yml` - авто-rollback и логирование

---

## 🔥 КРИТИЧЕСКИЕ шаги перед деплоем

### 1️⃣ Настройка GitHub Secrets

Заходите в: https://github.com/igorycha88-gif/Fences-of-the-curtain/settings/secrets/actions

**Обязательно:**
```
SSH_PASSWORD=<ваш-ssh-пароль-от-root>
SSH_PORT=22
```

### 2️⃣ Подготовка VPS

**Подключитесь к VPS:**
```bash
ssh root@37.143.13.196
```

**Проверьте наличие `.env` файла:**
```bash
cd /root/Fences-of-the-curtain
ls -la .env
```

**Если нет - создайте:**
```bash
cp .env.example .env
nano .env
```

**Критичные переменные (.env):**
```env
# ⚠️ CRITICAL - приложение НЕ запустится без этого!
NEXTAUTH_SECRET="<openssl-rand-base64-32>"
NEXTAUTH_URL="https://ваш-домен.ru"

# ⚠️ CRITICAL - БД
DATABASE_URL="postgresql://postgres:<СИЛЬНЫЙ-ПАРОЛЬ>@localhost:5432/fences"

# ⚠️ CRITICAL - Cron jobs
CRON_SECRET="<openssl-rand-base64-32>"

# Обязательные
REDIS_URL="redis://localhost:6379"
NODE_ENV=production

# Опциональные
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="ваш-email@gmail.com"
SMTP_PASS="ваш-app-password"
TELEGRAM_BOT_TOKEN="bot-token"
TELEGRAM_CHAT_ID="chat-id"
```

**Генерация секретов:**
```bash
openssl rand -base64 32
# Выполните дважды для NEXTAUTH_SECRET и CRON_SECRET
```

**Проверьте Docker-compose:**
```bash
cd /root/Fences-of-the-curtain
grep -E "DATABASE_URL|POSTGRES_PASSWORD|NEXTAUTH_SECRET|CRON_SECRET" docker-compose.yml
```

**Должно быть (безопасный вариант из main):**
```yaml
environment:
  - DATABASE_URL=postgresql://postgres:${POSTGRES_PASSWORD}@db:5432/fences
  - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
  - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
  - CRON_SECRET=${CRON_SECRET}
```

**НЕ должно быть (старый небезопасный вариант):**
```yaml
environment:
  - DATABASE_URL=postgresql://postgres:password@db:5432/fences
  - POSTGRES_PASSWORD=password
```

### 3️⃣ Резервное копирование БД

**На VPS:**
```bash
ssh root@37.143.13.196
cd /root/Fences-of-the-curtain

# Бэкап текущей БД
sudo -u postgres pg_dump -U postgres fences > backup_before_merge_$(date +%Y%m%d_%H%M%S).sql

# Проверьте размер бэкапа
ls -lh backup_before_merge_*.sql
```

### 4️⃣ Разрешение конфликтов схемы БД (ЕСЛИ БУДУТ)

**После слияния main в master возможны конфликты в `prisma/schema.prisma`:**

**Нужно оставить из main:**
```prisma
model RateLimitConfig {
  id          String   @id @default("auth")
  maxAttempts Int      @default(5)
  windowMs    Int      @default(900000)
  updatedAt   DateTime @updatedAt
}

model AuditLog {
  id         String   @id @default(cuid())
  userId     String
  action     String
  entityType String?
  entityId   String?
  oldValues  Json?
  newValues  Json?
  details    Json?
  ipAddress  String?
  userAgent  String?
  createdAt  DateTime @default(now())
  user       User     @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([action])
  @@index([entityType, entityId])
  @@index([createdAt])
  @@map("audit_logs")
}
```

**Нужно удалить из master:**
```prisma
model AdminActionLog {
  # ... вся модель
}
```

---

## 🚀 План деплоя

### Вариант A: Мерж через GitHub UI (Рекомендуется)

1. Перейдите на PR: https://github.com/igorycha88-gif/Fences-of-the-curtain/pull/17
2. Проверьте все изменения (особенно конфликты)
3. Если есть конфликты - разрешите через GitHub UI
4. Нажмите "Merge pull request"
5. Выберите "Squash and merge" для чистого коммита

### Вариант B: Автоматический деплой

**После мерджа PR #17, запустите деплой:**

**Через GitHub UI:**
1. Перейдите: https://github.com/igorycha88-gif/Fences-of-the-curtain/actions
2. Выберите "Deploy to VPS"
3. Нажмите "Run workflow" → "Run workflow"
4. Дождитесь завершения (~5-10 минут)

**Или через GitHub CLI:**
```bash
gh workflow run deploy.yml
```

---

## ✅ Проверка после деплоя

### 1. Проверьте здоровье приложения
```bash
# С локального компьютера
curl -I https://ваш-домен.ru

# С VPS
ssh root@37.143.13.196
curl -I http://localhost:3001
```

**Должно быть:**
```
HTTP/1.1 200 OK
```

### 2. Проверьте отсутствие тестовых кредов
```bash
curl -s https://ваш-домен.ru/admin/login | grep -i "admin@fences.ru\|manager@fences.ru"
```

**Должно быть пусто (ничего не найдено)**

### 3. Проверьте PM2 статус
```bash
ssh root@37.143.13.196
pm2 list
```

**Должно быть:**
```
┌────┬──────────┬────┬──────┬─────────┬─────────┬──────────┐
│ id │ name     │ mode│ status│ restart │ cpu │ memory  │
├────┼──────────┼────┼──────┼─────────┼─────────┼──────────┤
│ 0  │ fences-app│ fork│ online │ 0       │ 0%     │ 150MB    │
└────┴──────────┴────┴──────┴─────────┴─────────┴──────────┘
```

### 4. Проверьте логи
```bash
ssh root@37.143.13.196
pm2 logs fences-app --lines 50
```

**Ищите ошибки:**
```
[NEXTAUTH_ERROR] NEXTAUTH_SECRET not set
[PRISMA_ERROR] Can't reach database
[REDIS_ERROR] Connection refused
```

### 5. Запустите диагностические workflow

**Через GitHub UI:**
- Перейдите на Actions → "Check Login File on VPS" → Run workflow
- Проверьте вывод - тестовые креды не должны быть найдены

- Перейдите на Actions → "Check Response on VPS" → Run workflow
- Проверьте HTML ответ

- Перейдите на Actions → "Direct Port Check on VPS" → Run workflow
- Проверьте порты и процессы

---

## 🔄 Rollback план (если что-то пошло не так)

### Автоматический rollback

**Deploy workflow уже включает авто-rollback:**
- Если health check не проходит за 10 попыток
- Автоматически откатывается на предыдущий коммит

### Ручной rollback

**Шаг 1: Подключитесь к VPS**
```bash
ssh root@37.143.13.196
cd /root/Fences-of-the-curtain
```

**Шаг 2: Найдите предыдущий рабочий коммит**
```bash
git log --oneline -10
```

**Шаг 3: Откатитесь**
```bash
# Вариант A: На конкретный коммит
git reset --hard <commit-hash>

# Вариант B: Используйте rollback скрипт
./scripts/rollback.sh <commit-hash>
```

**Шаг 4: Пересоберите**
```bash
npm install --legacy-peer-deps
npx prisma generate
npm run build
pm2 restart ecosystem.config.js --env production
```

**Шаг 5: Восстановите БД**
```bash
# Если схема изменилась
sudo -u postgres psql -U postgres -d fences < backup_before_merge_YYYYMMDD_HHMMSS.sql
```

---

## 📋 Чек-лист для успешного деплоя

### Перед деплоем:
- [ ] GitHub Secrets настроены (SSH_PASSWORD, SSH_PORT)
- [ ] `.env` существует на VPS
- [ ] NEXTAUTH_SECRET валиден (32+ символов, не placeholder)
- [ ] CRON_SECRET валиден (32+ символов, не placeholder)
- [ ] DATABASE_URL использует переменные, не хардкод пароля
- [ ] POSTGRES_PASSWORD использует переменные, не хардкод пароля
- [ ] Бэкап БД создан

### После деплоя:
- [ ] PR #17 смержен в master
- [ ] Деплой workflow завершен успешно
- [ ] PM2 показывает `online` статус
- [ ] curl https://домен.ru возвращает 200
- [ ] curl https://домен.ru/admin/login не содержит тестовые креды
- [ ] Логи PM2 без ошибок NEXTAUTH_SECRET
- [ ] Логи PM2 без ошибок подключения к БД
- [ ] Логи PM2 без ошибок подключения к Redis
- [ ] Вход в админку работает
- [ ] Калькулятор работает
- [ ] Портфолио работает

---

## 🆘 Типичные проблемы и решения

### Проблема 1: NEXTAUTH_SECRET invalid
**Ошибка в логах:**
```
[next-auth][error] NEXTAUTH_SECRET was not found
```

**Решение:**
```bash
ssh root@37.143.13.196
cd /root/Fences-of-the-curtain
nano .env

# Добавьте:
NEXTAUTH_SECRET="<openssl-rand-base64-32>"

# Перезапустите:
pm2 restart ecosystem.config.js --env production
```

### Проблема 2: Database connection failed
**Ошибка в логах:**
```
Can't reach database server at `localhost:5432`
```

**Решение:**
```bash
# Проверьте БД работает
sudo -u postgres psql -U postgres -d fences -c "SELECT 1;"

# Проверьте пароль в docker-compose.yml
grep DATABASE_URL docker-compose.yml

# Перезапустите Docker
docker-compose down
docker-compose up -d
```

### Проблема 3: PM2 процесс не запускается
**Решение:**
```bash
# Проверьте ошибки
pm2 logs fences-app --err

# Перезапустите
pm2 restart ecosystem.config.js --env production

# Проверьте статус
pm2 list
```

### Проблема 4: Тестовые креды видны на странице
**Решение:**
```bash
# Проверьте какой коммит развернут
ssh root@37.143.13.196
cd /root/Fences-of-the-curtain
git log --oneline -1

# Если не последний коммит из main
git pull origin master
git reset --hard origin/master
npm run build
pm2 reload ecosystem.config.js --env production
```

---

## 📊 Статус изменений

| Компонент | Статус | Примечания |
|-----------|---------|------------|
| GitHub PR #17 | ✅ СОЗДАН | https://github.com/igorycha88-gif/Fences-of-the-curtain/pull/17 |
| GitHub Secrets | ⚠️ ПРОВЕРИТЬ | SSH_PASSWORD, SSH_PORT |
| VPS .env | ⚠️ ПРОВЕРИТЬ | NEXTAUTH_SECRET, CRON_SECRET |
| Docker-compose | ✅ Готов в main | Безопасный вариант |
| Database Schema | ✅ Готов в main | RateLimitConfig, AuditLog |
| VPS Workflows | ✅ Добавлены | 3 диагностических |
| Security | ✅ Улучшена | Тестовые креды удалены |

---

## 📞 Контакты для поддержки

**Если возникнут проблемы:**
1. Проверьте логи: `pm2 logs fences-app --lines 100`
2. Проверьте GitHub Actions: https://github.com/igorycha88-gif/Fences-of-the-curtain/actions
3. Запустите диагностический workflow
4. Создайте issue в репозитории

---

## 🎯 Следующие шаги

1. ✅ Настроить GitHub Secrets
2. ✅ Проверить `.env` на VPS
3. ✅ Создать бэкап БД
4. ✅ Слить PR #17
5. ✅ Запустить Deploy workflow
6. ✅ Проверить здоровье приложения
7. ✅ Верифицировать тестовые креды удалены
8. ✅ Проверить все функции

---

**Готовность к деплою:** 🟡 Ждет действий
