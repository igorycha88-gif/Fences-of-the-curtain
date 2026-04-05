# 🚀 План безопасного деплоя master2 на прод

**Дата:** 04.04.2026  
**Ветка:** master2  
**VPS:** root@37.143.13.196  
**Текущий коммит на проде:** `454bec7`  
**Целевой коммит:** `457b8bb`  

---

## 📊 Анализ изменений

### Коммиты для деплоя (3 шт):
1. `457b8bb` - fix: notification-recipients 500 error - wrap getToken in try-catch and add missing migration
2. `6b97aa1` - feat: add safe deployment scripts and documentation for master2
3. `fff1a96` - feat: add SMTP email notifications for new orders with admin-managed recipients

### Изменения в файлах:
- ✉️ Email сервисы (sender.ts)
- 👥 Управление получателями уведомлений (notificationRecipientService.ts)
- 🗃️ Новая модель в Prisma schema (NotificationRecipient)
- 🔧 Admin API endpoints для notification-recipients
- 📱 Обновления в admin layout
- 📊 Скрипты деплоя и отката

### ⚠️ Миграции БД:
**Требуется 1 миграция:** `20260404000000_add_notification_recipient`

```sql
-- CreateTable
CREATE TABLE "NotificationRecipient" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "NotificationRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NotificationRecipient_email_key" ON "NotificationRecipient"("email");
CREATE INDEX "NotificationRecipient_active_idx" ON "NotificationRecipient"("active");
```

**Риск:** НИЗКИЙ (добавление новой таблицы, без изменения существующих данных)

---

## 🔐 Безопасность деплоя

### Резервное копирование:
- ✅ Полный дамп БД PostgreSQL
- ✅ Бэкап директории uploads
- ✅ Сохранение текущего коммита
- ✅ Git tag для быстрого отката

### Откат:
- ✅ Автоматический скрипт отката
- ✅ Возможность восстановления БД
- ✅ Возврат к предыдущему коммиту за ~5 минут

---

## 📝 Пошаговый план деплоя

### ⚡ БЫСТРЫЙ СПОСОБ (рекомендуется)

```bash
# Автоматический деплой (20-25 минут)
bash scripts/deploy-master2-safe-with-monitoring.sh
```

### 📋 РУЧНОЙ СПОСОБ (если нужно больше контроля)

#### ЭТАП 1: Подготовка (локально) ⏱️ 1 мин

```bash
# Проверка текущей ветки
git branch --show-current  # Должно быть master2

# Проверка статуса
git status  # Не должно быть незакоммиченных изменений

# Пуш в origin (если нужно)
git push origin master2
```

#### ЭТАП 2: Резервное копирование (на проде) ⏱️ 3 мин

```bash
# Создание директории для бэкапов
BACKUP_DIR="/root/Fences-of-the-curtain/backups/$(date +%Y%m%d_%H%M%S)"
ssh root@37.143.13.196 "mkdir -p $BACKUP_DIR"

# Бэкап БД
ssh root@37.143.13.196 "cd /root/Fences-of-the-curtain && \
  PGPASSWORD='HVt6G6LE6mduMrAny91F' pg_dump -h localhost -U postgres fences > $BACKUP_DIR/db_backup.sql && \
  gzip $BACKUP_DIR/db_backup.sql"

# Бэкап uploads
ssh root@37.143.13.196 "cd /root/Fences-of-the-curtain && \
  tar czf $BACKUP_DIR/uploads.tar.gz public/uploads/ 2>/dev/null || echo 'No uploads'"

# Сохранение состояния
ssh root@37.143.13.196 "cd /root/Fences-of-the-curtain && \
  git rev-parse HEAD > $BACKUP_DIR/commit.txt && \
  pm2 list > $BACKUP_DIR/pm2_status.txt"
```

#### ЭТАП 3: Обновление кода (на проде) ⏱️ 1 мин

```bash
# Pull последнего кода
ssh root@37.143.13.196 "cd /root/Fences-of-the-curtain && \
  git fetch origin && \
  git pull origin master2"

# Проверка обновления
ssh root@37.143.13.196 "cd /root/Fences-of-the-curtain && \
  git log --oneline -3"
# Ожидается: 457b8bb, 6b97aa1, fff1a96
```

#### ЭТАП 4: Миграции БД (на проде) ⏱️ 2 мин

```bash
# Проверка статуса миграций
ssh root@37.143.13.196 "cd /root/Fences-of-the-curtain && \
  npx prisma migrate status"

# Применение миграций (безопасный режим)
ssh root@37.143.13.196 "cd /root/Fences-of-the-curtain && \
  npx prisma migrate deploy"

# Генерация Prisma Client
ssh root@37.143.13.196 "cd /root/Fences-of-the-curtain && \
  npx prisma generate"
```

#### ЭТАП 5: Установка зависимостей (на проде) ⏱️ 2 мин

```bash
ssh root@37.143.13.196 "cd /root/Fences-of-the-curtain && \
  npm ci --legacy-peer-deps --prefer-offline --no-audit --no-fund"
```

#### ЭТАП 6: Сборка приложения (на проде) ⏱️ 5-8 мин

```bash
# Очистка кэша
ssh root@37.143.13.196 "cd /root/Fences-of-the-curtain && \
  rm -rf .next"

# Сборка
ssh root@37.143.13.196 "cd /root/Fences-of-the-curtain && \
  npm run build"
```

#### ЭТАП 7: Zero-downtime перезапуск ⏱️ 1 мин

```bash
# Graceful reload через PM2
ssh root@37.143.13.196 "cd /root/Fences-of-the-curtain && \
  pm2 reload fences-app || pm2 restart fences-app"

# Сохранение конфигурации PM2
ssh root@37.143.13.196 "pm2 save"

# Ожидание стабилизации
sleep 15
```

#### ЭТАП 8: Проверка работоспособности приложения ⏱️ 2 мин

```bash
# Проверка PM2 статуса
ssh root@37.143.13.196 "pm2 list | grep fences-app"
# Должно быть: online

# Health check
ssh root@37.143.13.196 "curl -s http://localhost:3001/api/health"
# Должно вернуть: {"status":"ok"}

# Проверка главной страницы
curl -s -o /dev/null -w "%{http_code}" http://37.143.13.196:3001/
# Должно вернуть: 200

# Проверка новых API endpoints
ssh root@37.143.13.196 "curl -s -o /dev/null -w '%{http_code}' http://localhost:3001/api/admin/notification-recipients"
# Должно вернуть: 401 (Unauthorized) или 200

# Проверка логов на ошибки
ssh root@37.143.13.196 "pm2 logs fences-app --lines 50 --nostream | grep -i error || echo 'No errors'"
```

#### ЭТАП 9: Запуск мониторинга ⏱️ 5 мин

```bash
# Проверка .env на наличие паролей для мониторинга
ssh root@37.143.13.196 "cd /root/Fences-of-the-curtain && \
  grep -E 'GRAFANA_ADMIN_PASSWORD|POSTGRES_PASSWORD|REDIS_PASSWORD' .env"

# Если нет GRAFANA_ADMIN_PASSWORD, добавить
ssh root@37.143.13.196 "cd /root/Fences-of-the-curtain && \
  echo 'GRAFANA_ADMIN_PASSWORD=SecureGrafanaPass2026!' >> .env"

# Запуск мониторинга через Docker Compose
ssh root@37.143.13.196 "cd /root/Fences-of-the-curtain && \
  docker-compose -f docker-compose.monitoring.yml up -d"

# Проверка статуса контейнеров
ssh root@37.143.13.196 "docker ps | grep -E 'grafana|prometheus'"

# Ожидание запуска
sleep 30
```

#### ЭТАП 10: Проверка мониторинга ⏱️ 2 мин

```bash
# Проверка доступности Grafana
ssh root@37.143.13.196 "curl -s http://localhost:3000/api/health"
# Должно вернуть JSON со статусом

# Проверка Prometheus
ssh root@37.143.13.196 "curl -s http://localhost:9090/-/healthy"
# Должно вернуть: Prometheus is Healthy.

# Проверка Node Exporter
ssh root@37.143.13.196 "curl -s http://localhost:9100/metrics | head -1"
# Должно вернуть метрики

# Проверка Redis Exporter
ssh root@37.143.13.196 "curl -s http://localhost:9121/metrics | head -1"
# Должно вернуть метрики
```

---

## ✅ Критерии успеха

### Приложение:
1. ✅ PM2 процесс в статусе **online**
2. ✅ Health endpoint возвращает `{"status":"ok"}`
3. ✅ Главная страница отдает HTTP 200
4. ✅ Нет критических ошибок в логах PM2
5. ✅ Новые API endpoints доступны (даже если возвращают 401)

### Мониторинг:
1. ✅ Grafana запущена и доступна
2. ✅ Prometheus собирает метрики
3. ✅ Node Exporter работает
4. ✅ Redis Exporter работает
5. ✅ PostgreSQL Exporter работает

---

## 🚨 План отката (Rollback)

### Автоматический откат:

```bash
# Экстренный откат (требуется путь к бэкапу)
bash scripts/rollback-master2-emergency.sh /root/Fences-of-the-curtain/backups/YYYYMMDD_HHMMSS
```

### Ручной откат:

```bash
# 1. Возврат к предыдущему коммиту
ssh root@37.143.13.196 "cd /root/Fences-of-the-curtain && \
  git reset --hard 454bec7"

# 2. Восстановление БД (при необходимости)
ssh root@37.143.13.196 "cd /root/Fences-of-the-curtain && \
  gunzip -c backups/YYYYMMDD_HHMMSS/db_backup.sql.gz | \
  PGPASSWORD='HVt6G6LE6mduMrAny91F' psql -h localhost -U postgres fences"

# 3. Переустановка зависимостей и сборка
ssh root@37.143.13.196 "cd /root/Fences-of-the-curtain && \
  npm ci --legacy-peer-deps && \
  npx prisma generate && \
  npm run build"

# 4. Перезапуск
ssh root@37.143.13.196 "pm2 restart fences-app"
```

---

## 📊 Проверка после деплоя

### Ссылки для проверки:
- **Health check:** http://37.143.13.196:3001/api/health
- **Главная страница:** http://37.143.13.196:3001/
- **Admin panel:** http://37.143.13.196:3001/admin
- **API notification-recipients:** http://37.143.13.196:3001/api/admin/notification-recipients

### Мониторинг:
- **Grafana:** http://37.143.13.196:3000
  - Логин: `admin`
  - Пароль: `SecureGrafanaPass2026!`
- **Prometheus:** http://37.143.13.196:9090

### Проверяемые метрики:
1. CPU utilization
2. Memory usage
3. Response time
4. Error rate
5. Database connections
6. Redis hit rate

---

## 📝 Чек-лист перед деплоем

- [ ] Все изменения протестированы локально
- [ ] Код находится в ветке master2
- [ ] Все изменения запушены в origin/master2
- [ ] Нет незакоммиченных изменений
- [ ] Есть доступ к VPS по SSH
- [ ] Известен пароль от БД
- [ ] Готов план отката
- [ ] Уведомлены stakeholders

---

## ⏱️ Общее время деплоя: ~20-25 минут

- Подготовка: 1 мин
- Бэкап: 3 мин
- Обновление кода: 1 мин
- Миграции: 2 мин
- Зависимости: 2 мин
- Сборка: 5-8 мин
- Перезапуск: 1 мин
- Проверка приложения: 2 мин
- Запуск мониторинга: 5 мин
- Проверка мониторинга: 2 мин

---

## 🎯 Рекомендации

1. **Деплоить лучше вечером или ночью** (минимум пользователей)
2. **Иметь открыто 2 терминала:** один для деплоя, второй для мониторинга логов
3. **Подготовить команду для быстрого отката** в буфере обмена
4. **Уведомить команду** о начале и завершении деплоя
5. **Мониторить приложение** в течение 30 минут после деплоя

---

## 📌 После успешного деплоя

1. ✅ Проверить работу email уведомлений
2. ✅ Протестировать admin panel управления получателями уведомлений
   - Перейти в: http://37.143.13.196:3001/admin/references/notification-recipients
   - Добавить тестового получателя
   - Создать тестовый заказ и проверить уведомление
3. ✅ Настроить alerts в Grafana
4. ✅ Обновить документацию
5. ✅ Закрыть тикеты/задачи

---

## 📞 Контакты для экстренной связи

- **DevOps:** [Ваш контакт]
- **Разработчик:** [Контакт разработчика]
- **VPS провайдер:** [Контакт хостинга]

---

**Подготовлено:** DevOps Team  
**Дата подготовки:** 04.04.2026  
**Версия документа:** 2.0
