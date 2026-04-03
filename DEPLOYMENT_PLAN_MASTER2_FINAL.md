# 🚀 План безопасного деплоя master2 на прод VPS

**Дата:** 03.04.2026  
**Ветка:** master2  
**VPS:** root@37.143.13.196  
**Текущий коммит на проде:** 454bec7  
**Целевой коммит:** fff1a96  

---

## 📊 Анализ изменений

### Коммиты для деплоя (1 новый):
1. `fff1a96` - feat: add SMTP email notifications for new orders with admin-managed recipients

### Изменения в файлах:
- ✉️ Email сервисы (sender.ts, emailService.test.ts)
- 👥 Управление получателями уведомлений (notificationRecipientService.ts)
- 🗃️ Новая модель в Prisma schema (NotificationRecipient)
- 🔧 Admin API endpoints для notification-recipients
- 📱 Обновления в admin layout

### Миграции БД:
**Статус:** ✅ На проде все миграции применены (Database schema is up to date!)  
**Новые миграции:** Требуется проверить наличие миграции для NotificationRecipient  
**Риск:** Низкий (добавление новой таблицы)

---

## 🔐 Безопасность

### Резервное копирование:
- [ ] Полный дамп БД PostgreSQL
- [ ] Бэкап директории uploads
- [ ] Сохранение состояния PM2
- [ ] Git tag для быстрого отката

### Откат:
- [ ] Скрипт автоматического отката готов
- [ ] Возможность восстановления БД
- [ ] Возврат к предыдущему коммиту за ~5 минут

---

## 📝 Пошаговый план

### ЭТАП 1: Подготовка (локально) ⏱️ 2 мин

```bash
# 1.1 Проверка текущей ветки
git branch --show-current  # Должно быть master2

# 1.2 Проверка незакоммиченных изменений
git status

# 1.3 Пуш всех изменений в origin
git push origin master2

# 1.4 Проверка что на проде актуальный remote
git fetch origin
git log origin/master2 --oneline -3
```

### ЭТАП 2: Резервное копирование (на проде) ⏱️ 3 мин

```bash
# 2.1 Создание директории для бэкапов
BACKUP_DIR="/root/Fences-of-the-curtain/backups/$(date +%Y%m%d_%H%M%S)"
ssh root@37.143.13.196 "mkdir -p $BACKUP_DIR"

# 2.2 Бэкап БД
ssh root@37.143.13.196 "cd /root/Fences-of-the-curtain && \
  PGPASSWORD='HVt6G6LE6mduMrAny91F' pg_dump -h localhost -U postgres fences > $BACKUP_DIR/db_backup.sql && \
  gzip $BACKUP_DIR/db_backup.sql"

# 2.3 Бэкап uploads
ssh root@37.143.13.196 "cd /root/Fences-of-the-curtain && \
  tar czf $BACKUP_DIR/uploads.tar.gz public/uploads/ 2>/dev/null || echo 'No uploads'"

# 2.4 Сохранение состояния
ssh root@37.143.13.196 "cd /root/Fences-of-the-curtain && \
  git rev-parse HEAD > $BACKUP_DIR/commit.txt && \
  pm2 list > $BACKUP_DIR/pm2_status.txt && \
  git log --oneline -5 > $BACKUP_DIR/git_log.txt"
```

### ЭТАП 3: Обновление кода (на проде) ⏱️ 2 мин

```bash
# 3.1 Pull последнего кода
ssh root@37.143.13.196 "cd /root/Fences-of-the-curtain && \
  git fetch origin && \
  git pull origin master2"

# 3.2 Проверка обновления
ssh root@37.143.13.196 "cd /root/Fences-of-the-curtain && \
  git log --oneline -3"
```

### ЭТАП 4: Миграции БД (на проде) ⏱️ 2 мин

```bash
# 4.1 Проверка статуса миграций
ssh root@37.143.13.196 "cd /root/Fences-of-the-curtain && \
  npx prisma migrate status"

# 4.2 Применение миграций (безопасный режим)
ssh root@37.143.13.196 "cd /root/Fences-of-the-curtain && \
  npx prisma migrate deploy"

# 4.3 Генерация Prisma Client
ssh root@37.143.13.196 "cd /root/Fences-of-the-curtain && \
  npx prisma generate"
```

### ЭТАП 5: Сборка приложения (на проде) ⏱️ 5-8 мин

```bash
# 5.1 Установка зависимостей
ssh root@37.143.13.196 "cd /root/Fences-of-the-curtain && \
  npm ci --legacy-peer-deps"

# 5.2 Очистка кэша
ssh root@37.143.13.196 "cd /root/Fences-of-the-curtain && \
  rm -rf .next"

# 5.3 Сборка
ssh root@37.143.13.196 "cd /root/Fences-of-the-curtain && \
  npm run build"
```

### ЭТАП 6: Zero-downtime перезапуск ⏱️ 1 мин

```bash
# 6.1 Graceful reload через PM2
ssh root@37.143.13.196 "cd /root/Fences-of-the-curtain && \
  pm2 reload fences-app"

# 6.2 Сохранение конфигурации PM2
ssh root@37.143.13.196 "pm2 save"

# 6.3 Ожидание стабилизации
sleep 15
```

### ЭТАП 7: Проверка работоспособности ⏱️ 2 мин

```bash
# 7.1 Проверка PM2 статуса
ssh root@37.143.13.196 "pm2 list | grep fences-app"

# 7.2 Health check
ssh root@37.143.13.196 "curl -s http://localhost:3001/api/health"

# 7.3 Проверка главной страницы
curl -s -o /dev/null -w "%{http_code}" http://37.143.13.196:3001/

# 7.4 Проверка логов на ошибки
ssh root@37.143.13.196 "pm2 logs fences-app --lines 50 --nostream | grep -i error || echo 'No errors'"

# 7.5 Проверка новых API endpoints
ssh root@37.143.13.196 "curl -s -o /dev/null -w '%{http_code}' http://localhost:3001/api/admin/notification-recipients"
```

### ЭТАП 8: Запуск мониторинга ⏱️ 5 мин

```bash
# 8.1 Проверка .env на наличие паролей для мониторинга
ssh root@37.143.13.196 "cd /root/Fences-of-the-curtain && \
  grep -E 'GRAFANA_ADMIN_PASSWORD|POSTGRES_PASSWORD|REDIS_PASSWORD' .env"

# 8.2 Если нет GRAFANA_ADMIN_PASSWORD, добавить
ssh root@37.143.13.196 "cd /root/Fences-of-the-curtain && \
  echo 'GRAFANA_ADMIN_PASSWORD=SecureGrafanaPass2026!' >> .env"

# 8.3 Запуск мониторинга через Docker Compose
ssh root@37.143.13.196 "cd /root/Fences-of-the-curtain && \
  docker-compose -f docker-compose.monitoring.yml up -d"

# 8.4 Проверка статуса контейнеров
ssh root@37.143.13.196 "docker ps | grep -E 'grafana|prometheus'"

# 8.5 Ожидание запуска
sleep 30

# 8.6 Проверка доступности Grafana
ssh root@37.143.13.196 "curl -s http://localhost:3000/api/health" # Grafana internal port

# 8.7 Проверка Prometheus
ssh root@37.143.13.196 "curl -s http://localhost:9090/-/healthy"
```

---

## ✅ Критерии успеха

1. ✅ PM2 процесс в статусе **online**
2. ✅ Health endpoint возвращает `{"status":"ok"}`
3. ✅ Главная страница отдает HTTP 200
4. ✅ Нет критических ошибок в логах PM2
5. ✅ Новые API endpoints доступны (даже если возвращают 401)
6. ✅ Grafana запущена и доступна
7. ✅ Prometheus собирает метрики

---

## 🚨 План отката (Rollback)

### Автоматический откат:
```bash
# Запуск скрипта отката
bash scripts/rollback-to-master.sh
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

## 📞 Контакты для экстренной связи

- **DevOps:** [Ваш контакт]
- **Разработчик:** [Контакт разработчика]
- **VPS провайдер:** [Контакт хостинга]

---

## 📊 Мониторинг после деплоя

### Grafana Dashboards:
- **URL:** http://37.143.13.196/grafana (после настройки nginx)
- **Логин:** admin
- **Пароль:** SecureGrafanaPass2026!

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
- [ ] Бэкап БД создан
- [ ] Есть доступ к VPS по SSH
- [ ] Известен пароль от БД
- [ ] Готов план отката
- [ ] Уведомлены stakeholders

---

## ⏱️ Общее время деплоя: ~20-25 минут

- Подготовка: 2 мин
- Бэкап: 3 мин
- Обновление кода: 2 мин
- Миграции: 2 мин
- Сборка: 5-8 мин
- Перезапуск: 1 мин
- Проверка: 2 мин
- Мониторинг: 5 мин

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
2. ✅ Протестировать admin panel управления получателями
3. ✅ Настроить alerts в Grafana
4. ✅ Обновить документацию
5. ✅ Закрыть тикеты/задачи

---

**Подготовлено:** DevOps Team  
**Дата подготовки:** 03.04.2026  
**Версия документа:** 1.0
