# ЧТЗ: Безопасный деплой master2 → Прод VPS

**Дата:** 2026-04-09
**Версия master2 HEAD:** `71160b4` (30 коммитов впереди прода)
**Текущий прод:** `9844933`

---

## 1. Текущее состояние

### VPS (37.143.13.196)
| Компонент | Статус | Расположение |
|-----------|--------|-------------|
| Код | `/var/www/fences-of-the-curtain` @ `9844933` | master2 (устарел на 30 коммитов) |
| App (fences-app) | **DOWN** | — |
| DB (fences-db) | **DOWN** | Volume: `fences-of-the-curtain_postgres_data` |
| Redis (fences-redis) | UP (2 недели) | От основного compose |
| Nginx (fences-nginx) | **DOWN** | — |
| Monitoring | UP (Grafana:3002, Prometheus:9090) | `/root/Fences-of-the-curtain/` |
| SSL | Let's Encrypt → `/etc/letsencrypt/live/zabor-i-naves.ru/` (до 20.06.2026) | Не подключен к compose |
| Portainer | UP :9443 | — |

### Данные БД
- Справочники: Users(3), FenceType(4), Materials, WorkPrice(21), PostType, LagType, GateType, WicketType, PicketType, ProfnastilType
- **Нет** пользовательских данных: Order(0), FenceEstimate(0)
- SoilType(12) — будет удалён (модель убрана)

### Проблемы
1. SSL-сертификаты не подключены (ssl/ директория пуста)
2. docker-compose не подхватывает `.env` автоматически (требуется `--env-file .env`)
3. Nginx конфиг содержит HTTPS-блок — упадёт без SSL-сертификатов

---

## 2. Изменения схемы Prisma (9844933 → 71160b4)

| Изменение | Тип | Риск |
|-----------|-----|------|
| `MultiFenceEstimate` (новая модель) | CREATE TABLE | Низкий |
| `NotificationRecipient` (новая модель) | CREATE TABLE | Низкий |
| `SoilType` (удалена модель) | DROP TABLE | Низкий (нет зависимых данных) |
| `Order.multiEstimateId` (новое поле) | ALTER TABLE ADD | Низкий |
| `Order.adminEstimateId` (новое поле) | ALTER TABLE ADD | Низкий |
| `Order.active` (новое поле) | ALTER TABLE ADD | Низкий |
| `FenceEstimate` — 7 новых полей | ALTER TABLE ADD | Низкий |
| `User.multiEstimates` (новая связь) | FK | Низкий |

**Оценка риска миграции:** НИЗКИЙ (нет пользовательских данных в Order/FenceEstimate)

---

## 3. План деплоя

### Этап A: Предварительные проверки
- [ ] Проверить SSH-доступ
- [ ] Проверить свободное место на диске (>10GB)
- [ ] Проверить текущее состояние контейнеров

### Этап B: Бэкап
- [ ] Запустить DB контейнер
- [ ] `pg_dump` → `/root/backup_pre_deploy_YYYYMMDD_HHMMSS.sql`
- [ ] Верифицировать бэкап (проверить размер, первые строки)
- [ ] Остановить DB

### Этап C: Обновление кода
- [ ] `cd /var/www/fences-of-the-curtain && git pull origin master2`
- [ ] Верифицировать коммит (`git rev-parse HEAD` = `71160b4`)

### Этап D: Настройка SSL
- [ ] Создать симлинки: `ssl/fullchain.pem → /etc/letsencrypt/live/.../fullchain.pem`
- [ ] Создать симлинки: `ssl/privkey.pem → /etc/letsencrypt/live/.../privkey.pem`

### Этап E: Сборка Docker-образов
- [ ] `docker compose --env-file .env build --no-cache`
- [ ] Верифицировать успешность сборки

### Этап F: Остановка текущих сервисов
- [ ] `docker compose --env-file .env down` (остановить app, nginx, db)
- [ ] Redis оставить работающим

### Этап G: Запуск БД + миграции
- [ ] `docker compose --env-file .env up -d db`
- [ ] Дождаться healthy
- [ ] `docker compose --env-file .env exec app npx prisma db push`
- [ ] Верифицировать: `\\dt` — проверить новые таблицы

### Этап H: Запуск всех сервисов
- [ ] `docker compose --env-file .env up -d --force-recreate`
- [ ] Дождаться healthy всех контейнеров
- [ ] Проверить логи на ошибки

### Этап I: Верификация
- [ ] HTTP: `curl -f http://localhost:3000/` → 200
- [ ] HTTPS: `curl -f https://zabor-i-naves.ru/` → 200
- [ ] API: `curl -f http://localhost:3000/api/health` → 200
- [ ] Redis: `docker exec fences-redis redis-cli -a <pass> ping` → PONG
- [ ] DB: `docker exec fences-db pg_isready -U postgres`
- [ ] Логи: нет `error`, `fatal`, `NOAUTH`, `ECONNREFUSED`

---

## 4. План отката

### Шаги отката (если что-то пошло не так):
1. `docker compose --env-file .env down`
2. Восстановить БД:
   ```bash
   docker compose --env-file .env up -d db
   # wait for healthy
   cat /root/backup_pre_deploy_*.sql | docker exec -i fences-db psql -U postgres -d fences
   ```
3. Откатить код:
   ```bash
   git checkout 9844933
   docker compose --env-file .env build --no-cache
   docker compose --env-file .env up -d
   ```

### Критерии отката:
- Любой контейнер не становится healthy за 2 минуты
- HTTP/HTTPS недоступен после запуска
- Критические ошибки в логах (NOAUTH, ECONNREFUSED, panic)

---

## 5. Критерии приёмки

| AC | Критерий | Проверка |
|----|----------|----------|
| AC-1 | Код на VPS обновлён до `71160b4` | `git rev-parse HEAD` |
| AC-2 | Все 4 сервиса healthy (app, db, redis, nginx) | `docker compose ps` |
| AC-3 | БД мигрирована, новые таблицы созданы | `\\dt` содержит MultiFenceEstimate, NotificationRecipient |
| AC-4 | SoilType таблица удалена | `\\dt` НЕ содержит SoilType |
| AC-5 | HTTPS работает | `curl -f https://zabor-i-naves.ru/` |
| AC-6 | HTTP → HTTPS редирект | `curl -I http://zabor-i-naves.ru/` → 301/302 |
| AC-7 | API healthcheck OK | `curl http://localhost:3000/api/health` |
| AC-8 | Redis подключение OK | Проверка в healthcheck |
| AC-9 | Бэкап БД создан | Файл существует и >0 байт |
| AC-10 | Нет ошибок в логах | Проверка grep на error/fatal |
