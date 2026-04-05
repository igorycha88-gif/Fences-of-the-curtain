# План безопасного деплоя master2 → Production

**Дата:** 2026-04-03  
**Ветка:** master2 → production  
**VPS:** 37.143.13.196 (root)

---

## 📊 Анализ изменений

### Миграции БД (3 новые миграции)

#### 1. `20260331000000_rename_picket_prices_to_per_unit`
- **Тип:** Безопасная
- **Действие:** Переименование полей цен в PicketType
- **Откат:** Автоматический через Prisma
- **Риск:** ✅ Низкий

#### 2. `20260331120000_add_picket_profile_and_coating` ⚠️
- **Тип:** Критическая
- **Действие:** 
  - Создание таблиц `PicketProfileType` и `PicketCoating`
  - Seed стандартных данных (4 профиля, покрытия из существующих)
  - Миграция существующих данных в новые таблицы
  - Добавление FK constraints
- **Откат:** Возможен через rollback.sql
- **Риск:** ⚠️ Средний (преобразование данных)
- **Важно:** Миграция использует транзакцию - безопасна

#### 3. `20260331230000_add_picket_fields_to_fence_estimate`
- **Тип:** Безопасная
- **Действие:** Добавление полей picket в FenceEstimate
- **Откат:** Автоматический
- **Риск:** ✅ Низкий

### Изменения в коде
- **Файлы:** 416 изменено
- **Строки:** +4,400 / -42,478
- **Основное:** Рефакторинг, удаление старых скриптов, улучшение UI
- **Мониторинг:** Grafana + Prometheus уже настроены

---

## 🎯 Стратегия деплоя

### Вариант 1: Автоматический деплой (Рекомендуется)

**Преимущества:**
- ✅ Автоматический откат при ошибках
- ✅ Полное логирование
- ✅ Проверка здоровья приложения
- ✅ Создание backup БД

**Команда:**
```bash
./scripts/deploy-master2-to-production.sh
```

### Вариант 2: Ручной деплой с GitHub Actions

**Преимущества:**
- ✅ Интеграция с CI/CD
- ✅ Автоматические проверки
- ✅ История деплоев

**Команда:**
1. Merge master2 → master
2. Push в master
3. GitHub Actions автоматически задеплоит

### Вариант 3: Полностью ручной деплой

**Для опытных пользователей:**
```bash
# На VPS
cd /root/Fences-of-the-curtain
git fetch origin master2
git checkout master2
git pull origin master2
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build
pm2 reload fences-app
```

---

## 📝 Пошаговый план (Автоматический)

### Шаг 0: Подготовка (Локально)
```bash
# 1. Убедиться, что sshpass установлен
brew install sshpass  # macOS
# или
sudo apt install sshpass  # Linux

# 2. Проверить скрипт
cat scripts/deploy-master2-to-production.sh

# 3. Убедиться, что находимся в ветке master2
git status
```

### Шаг 1: Запуск деплоя
```bash
./scripts/deploy-master2-to-production.sh
```

### Шаг 2: Автоматические действия скрипта
1. ✅ Создание backup БД → `/root/backups/db_fences_backup_YYYYMMDD_HHMMSS.sql`
2. ✅ Backup .env файла
3. ✅ Проверка статуса миграций
4. ✅ Обновление кода из master2
5. ✅ Исправление .env (POSTGRES_PASSWORD)
6. ✅ Установка зависимостей (`npm ci`)
7. ✅ Генерация Prisma Client
8. ✅ **Применение миграций БД** (безопасно)
9. ✅ Сборка приложения (`npm run build`)
10. ✅ Перезапуск PM2 (graceful reload)
11. ✅ Проверка здоровья (health check)
12. ✅ Проверка логов на ошибки
13. ✅ Создание скрипта отката

### Шаг 3: Проверка результатов
```bash
# Проверить статус приложения
ssh root@37.143.13.196 "pm2 status"

# Проверить логи
ssh root@37.143.13.196 "pm2 logs fences-app --lines 50"

# Проверить health endpoint
curl http://37.143.13.196/

# Проверить Grafana (если настроен)
curl http://37.143.13.196/grafana/api/health
```

---

## 🔄 План отката

### Автоматический откат (если деплой не удался)
Скрипт автоматически откатит изменения если:
- ❌ Ошибка npm ci
- ❌ Ошибка prisma generate
- ❌ Ошибка применения миграций
- ❌ Ошибка сборки
- ❌ Health check не прошел после 5 попыток

### Ручной откат

#### Вариант A: Использовать созданный скрипт
```bash
# На VPS
bash /root/backups/rollback_YYYYMMDD_HHMMSS.sh
```

#### Вариант B: Полный ручной откат
```bash
# На VPS
cd /root/Fences-of-the-curtain

# 1. Остановить приложение
pm2 stop fences-app

# 2. Вернуть код
git reset --hard <PREVIOUS_COMMIT>

# 3. Восстановить .env
cp /root/backups/.env.backup .env

# 4. Переустановить зависимости
npm ci

# 5. Сгенерировать Prisma
npx prisma generate

# 6. Восстановить БД
sudo -u postgres psql -d fences < /root/backups/db_fences_backup_YYYYMMDD_HHMMSS.sql

# 7. Пересобрать
npm run build

# 8. Запустить
pm2 restart fences-app
```

---

## ✅ Чеклист проверки после деплоя

### 1. Приложение работает
```bash
# Health check
curl -I http://37.143.13.196/

# Ожидается: HTTP/1.1 200 OK
```

### 2. База данных в порядке
```bash
ssh root@37.143.13.196 "sudo -u postgres psql -d fences -c '\dt'" | grep -E "PicketProfileType|PicketCoating"

# Ожидается: обе таблицы существуют
```

### 3. PM2 статус
```bash
ssh root@37.143.13.196 "pm2 status"

# Ожидается: fences-app | online | 0 restarts
```

### 4. Логи без критических ошибок
```bash
ssh root@37.143.13.196 "pm2 logs fences-app --lines 100 --nostream | grep -i error"

# Ожидается: нет критических ошибок
```

### 5. Миграции применены
```bash
ssh root@37.143.13.196 "cd /root/Fences-of-the-curtain && npx prisma migrate status"

# Ожидается: Database schema is up to date!
```

### 6. Grafana работает (если настроена)
```bash
curl http://37.143.13.196/grafana/api/health

# Ожидается: {"commit":"...","database":"ok","version":"..."}
```

### 7. Функциональная проверка
- [ ] Открыть сайт: http://37.143.13.196/
- [ ] Проверить калькулятор евроштакетника
- [ ] Проверить админ-панель: http://37.143.13.196/admin
- [ ] Проверить список PicketType в админке
- [ ] Создать тестовую смету

---

## 🔧 Мониторинг и Grafana

### Проверка Grafana
```bash
# Health check
curl http://37.143.13.196/grafana/api/health

# Web UI
open http://37.143.13.196/grafana
# Login: admin / <GRAFANA_ADMIN_PASSWORD из .env>
```

### Запуск мониторинга (если не запущен)
```bash
ssh root@37.143.13.196 << 'EOF'
cd /root/Fences-of-the-curtain

# Проверить .env содержит GRAFANA_ADMIN_PASSWORD
grep GRAFANA_ADMIN_PASSWORD .env

# Запустить мониторинг
docker-compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d

# Проверить статус
docker-compose -f docker-compose.yml -f docker-compose.monitoring.yml ps
EOF
```

### Остановка мониторинга (если нужно)
```bash
ssh root@37.143.13.196 "cd /root/Fences-of-the-curtain && docker-compose -f docker-compose.monitoring.yml down"
```

---

## ⚠️ Возможные проблемы и решения

### Проблема 1: Миграция зависла
**Симптом:** `prisma migrate deploy` висит  
**Решение:**
```bash
# Проверить блокировки БД
sudo -u postgres psql -d fences -c "SELECT * FROM pg_locks WHERE NOT granted;"

# Перезапустить миграцию
npx prisma migrate deploy --force
```

### Проблема 2: Приложение не запускается
**Симптом:** PM2 status = errored  
**Решение:**
```bash
# Проверить логи
pm2 logs fences-app --err --lines 100

# Проверить порт
lsof -i :3001

# Перезапустить
pm2 restart fences-app
```

### Проблема 3: Нет доступа к Grafana
**Симптом:** 403 Forbidden  
**Решение:**
```bash
# Проверить пароль в .env
grep GRAFANA_ADMIN_PASSWORD .env

# Пересоздать контейнер
docker-compose -f docker-compose.monitoring.yml restart grafana
```

### Проблема 4: Новые поля в админке не отображаются
**Симптом:** Нет PicketProfileType/PicketCoating  
**Решение:**
```bash
# Проверить seed данных
sudo -u postgres psql -d fences -c "SELECT COUNT(*) FROM \"PicketProfileType\";"
sudo -u postgres psql -d fences -c "SELECT COUNT(*) FROM \"PicketCoating\";"

# Если пусто - запустить seed
npm run db:seed
```

---

## 📞 Контакты для экстренной связи

- **VPS:** root@37.143.13.196
- **Логи деплоя:** `/var/log/fences-deploy/deploy-production.log`
- **Backup БД:** `/root/backups/`
- **PM2 мониторинг:** `pm2 monit`

---

## 🎯 Рекомендации

### Перед деплоем:
1. ✅ Убедиться, что на проде нет активных пользователей (ночью/выходные)
2. ✅ Создать вручную backup БД (дополнительно к автоматическому)
3. ✅ Проверить свободное место на диске: `df -h`

### После деплоя:
1. ✅ Протестировать основные функции в течение 30 минут
2. ✅ Мониторить логи на ошибки
3. ✅ Проверить Grafana dashboards
4. ✅ Сохранить backup минимум на 7 дней

### Оптимизации для будущего:
1. 🔄 Настроить автоматические бэкапы в crontab
2. 🔄 Настроить alerting в Grafana
3. 🔄 Добавить smoke tests в CI/CD
4. 🔄 Настроить staging environment

---

## 📅 Timeline

- **T-1 час:** Создание дополнительного backup БД
- **T-0:** Запуск деплоя
- **T+5 мин:** Обновление кода
- **T+10 мин:** Миграции БД
- **T+20 мин:** Сборка приложения
- **T+25 мин:** Перезапуск и проверка
- **T+30 мин:** Функциональное тестирование
- **T+1 час:** Мониторинг и финальная проверка

**Общее время деплоя:** ~25-30 минут  
**Время отката:** ~10-15 минут

---

## 🚦 Go/No-Go Checklist

### GO условия:
- [x] Миграции протестированы локально
- [x] Скрипт деплоя готов
- [x] Backup стратегия определена
- [x] План отката готов
- [x] Мониторинг настроен

### NO-GO условия:
- [ ] На проде высокая нагрузка
- [ ] Есть нерешенные критические баги
- [ ] Нет доступа к VPS
- [ ] Недостаточно свободного места на диске

---

**Документ подготовлен:** 2026-04-03  
**Версия:** 1.0  
**Автор:** DevOps Team
