# Скилл AI-DevOps: Продакшн-деплой (VPS)

## Роль

Ты — DevOps-инженер для ПРОДАКШН-деплоя. Отвечаешь за безопасное развёртывание из ветки `master2` на VPS (37.143.13.196) с гарантией отката при любой проблеме. Базовый скилл: `SKILL_DEVOPS.md`. Этот файл — продакшн-расширение.

## Ключевые отличия от Dev-деплоя

| Аспект | Dev (PIPELINE.js) | Prod (PIPELINE_PROD.js) |
|--------|-------------------|-------------------------|
| Среда | docker-compose.dev.yml (локально) | docker-compose.yml (VPS) |
| Сеть | bridge (fences-net) | host networking |
| Порт | 3000 | 3001 (production), 3003 (green) |
| Стратегия | Пересборка всех контейнеров | Blue-Green, образ из GHCR |
| Откат | Не требуется (dev) | Автоматический при провале |
| Бэкап БД | Нет | Обязательный перед деплоем |
| Nginx | Нет | Управление upstream |
| Мониторинг | Нет | Grafana + Prometheus |
| Уведомления | Нет | Telegram |

---

## Архитектура продакшн-деплоя

### VPS (37.143.13.196)

```
┌──────────────────────────────────────────────────┐
│  VPS 37.143.13.196 (4GB RAM)                     │
│                                                  │
│  ┌──────────┐    ┌──────────────┐                │
│  │  Nginx   │───▶│  fences-app  │ (port 3001)   │
│  │ :80/:443 │    │  Docker      │                │
│  └──────────┘    └──────┬───────┘                │
│                         │                         │
│  ┌──────────┐    ┌──────▼───────┐                │
│  │  Redis   │    │  PostgreSQL  │                │
│  │  :6379   │    │  :5432       │                │
│  └──────────┘    └──────────────┘                │
│                                                  │
│  ┌──────────┐    ┌──────────────┐                │
│  │Prometheus│    │   Grafana    │                │
│  │  :9090   │    │   :3002      │                │
│  └──────────┘    └──────────────┘                │
│                                                  │
│  Host: network_mode=host (все сервисы)           │
│  /root/Fences-of-the-curtain/  ← app directory   │
│  /var/www/uploads/             ← uploads volume  │
└──────────────────────────────────────────────────┘
```

### Blue-Green Flow

```
ШАГ 1: BLUE работает на :3001, nginx → :3001

ШАГ 2: GREEN стартует на :3003 (nginx НЕ переключён)
        ┌──────────┐     ┌────────────────┐
        │  Nginx   │────▶│ BLUE (:3001) ✅│ ← пользователи тут
        │          │     │ GREEN(:3003) 🔵│ ← healthcheck
        └──────────┘     └────────────────┘

ШАГ 3: GREEN здоров → nginx → :3003
        ┌──────────┐     ┌────────────────┐
        │  Nginx   │────▶│ BLUE (:3001)   │ ← ещё работает
        │          │────▶│ GREEN(:3003) ✅│ ← пользователи тут
        └──────────┘     └────────────────┘

ШАГ 4: Запускаем новый на :3001, nginx → :3001, GREEN удаляем
        ┌──────────┐     ┌────────────────┐
        │  Nginx   │────▶│ NEW (:3001) ✅ │ ← пользователи тут
        │          │     │ (GREEN удалён) │
        └──────────┘     └────────────────┘
```

---

## Переменные окружения

### Ключевые env-переменные на VPS (.env)

```bash
# App
NODE_ENV=production
PORT=3001
NEXTAUTH_URL=https://zabor-i-naves.ru
NEXTAUTH_SECRET=<secret>

# PostgreSQL (host networking → localhost)
DATABASE_URL=postgresql://postgres:<password>@127.0.0.1:5432/fences

# Redis (host networking → localhost)
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=<password>
REDIS_URL=redis://:<password>@127.0.0.1:6379

# Monitoring
GRAFANA_ADMIN_PASSWORD=<password>

# Notifications
TELEGRAM_BOT_TOKEN=<token>
TELEGRAM_CHAT_ID=<chat_id>

# SMTP
SMTP_HOST=<host>
SMTP_PORT=587
SMTP_USER=<user>
SMTP_PASS=<password>
```

---

## Docker-образы

### Production Dockerfile (docker/Dockerfile)

Multi-stage build:
1. `base` — системные зависимости (curl, fonts)
2. `deps` — npm ci + prisma generate
3. `builder` — next build (с build-time env vars)
4. `runner` — минимальный runtime, non-root user

Expose: 3001
Healthcheck: `curl -f http://127.0.0.1:${PORT}/api/health`
Entrypoint: `docker/entrypoint.sh` (prisma migrate + npm start)

### Registry: GHCR

```
ghcr.io/<owner>/fences-of-the-curtain/app:sha-XXXXXXX
ghcr.io/<owner>/fences-of-the-curtain/app:latest
ghcr.io/<owner>/fences-of-the-curtain/app:YYYYMMDD
```

---

## Версионирование приложения

### Принцип

Каждый деплой на прод = новая версия в package.json (semver).
Git tag `vMAJOR.MINOR.PATCH` создаётся перед деплоем.
Версия отображается в `/api/health` → `version` и в Telegram уведомлениях.

### Определение типа изменения

| Тип | Коммиты | Пример | Версия |
|-----|---------|--------|--------|
| **patch** | fix:, refactor:, chore:, docs:, style: | `fix: починил форму` | 1.3.1 → 1.3.2 |
| **minor** | feat: | `feat: новый калькулятор` | 1.3.1 → 1.4.0 |
| **major** | feat!: или BREAKING CHANGE | `feat!: новый API` | 1.3.1 → 2.0.0 |

### Команды версионирования

```bash
# Текущая версия
grep '"version"' package.json | head -1 | sed 's/.*: "//;s/".*//'

# Список изменений с прошлой версии
git log v$(grep '"version"' package.json | head -1 | sed 's/.*: "//;s/".*//')..HEAD --oneline

# Bump версии (patch / minor / major)
npm version patch --no-git-tag-version   # 1.3.1 → 1.3.2
npm version minor --no-git-tag-version   # 1.3.1 → 1.4.0
npm version major --no-git-tag-version   # 1.3.1 → 2.0.0

# Git commit + tag
git add package.json package-lock.json CHANGELOG.md
git commit -m "chore: release v1.3.2"
git tag -a "v1.3.2" -m "Release v1.3.2: $(date +%Y-%m-%d)"
```

### CHANGELOG.md

Формат при добавлении записи:
```markdown
## [1.3.2] - 2026-04-14

### Исправлено
- fix: починил валидацию формы (abc1234)
- fix: исправил баг с Redis (def5678)

### Добавлено
- feat: новый калькулятор 3D-панели (ghi9012)
```

### Версия в /api/health

Health endpoint возвращает `version` из `process.env.npm_package_version`.
В Docker контейнере эта переменная устанавливается автоматически из `package.json`
при запуске через `node server.js` (Next.js standalone).

---

## Полное тестирование на проде

### Обзор

После успешного деплоя и верификации — проводится **полное тестирование**
на рабочем проде. Делится на два блока:

| Блок | Тип | Количество | Автоматический? |
|------|-----|------------|-----------------|
| A: API-тесты | curl + grep | 6 тестов | Да (SSH на VPS) |
| B: E2E ручные | Браузер | 6 чеклистов | Нет (пользователь) |

### Блок A: Автоматические API-тесты

Выполняются через SSH на VPS. Не требуют участия пользователя.

| ID | Тест | Проверка | Critical |
|----|------|----------|----------|
| FT1 | Health endpoint | status=ok, version=X.X.X, db=true, redis=true | **Да** |
| FT2 | HTTP статусы | /, /api/health, /admin/login, /api/materials → 200 | **Да** |
| FT3 | API функциональность | /api/materials возвращает данные, структура ответа | **Да** |
| FT4 | SSL + Headers | HTTPS, HSTS, X-Frame-Options, redirect | Нет |
| FT5 | Performance | Время ответа < 3s (internal + external) | Нет |
| FT6 | Логи | Нет fatal/panic/unhandled за время деплоя | Нет |

### Блок B: Ручное E2E тестирование

Выводится чеклист. Пользователь проверяет в браузере и отвечает «Да/Нет».

| ID | Тест | Что проверять | Critical |
|----|------|---------------|----------|
| FT7 | Главная страница | Загрузка, шапка, навигация, футер, мобильная | **Да** |
| FT8 | Калькулятор | Выбор типа, ввод параметров, расчёт, результат | **Да** |
| FT9 | Форма заявки | Поля, валидация, отправка, reCAPTCHA | **Да** |
| FT10 | Админ-панель | /admin/login, форма логина, ошибки | Нет |
| FT11 | SEO | Title, description, OG, метрики, sitemap | Нет |
| FT12 | Мобильная версия | Бургер-меню, адаптивность, кнопки, скролл | Нет |

### Вердикт тестирования

| Результат | Условие | Действие |
|-----------|---------|----------|
| **GO** | Все critical = ✅ | → FINALIZE |
| **CONDITIONAL GO** | critical = ✅, есть warnings | → FINALIZE (с замечаниями) |
| **NO-GO** | Хотя бы один critical = ❌ | → АВТОМАТИЧЕСКИЙ ОТКАТ |

---

## Команды продакшн-деплоя

### Pre-flight

```bash
# Проверка VPS доступности
ssh -o ConnectTimeout=10 root@37.143.13.196 "echo OK"

# Проверка диска
ssh root@37.143.13.196 "df -m /root | tail -1 | awk '{print \$4}'"

# Проверка .env
ssh root@37.143.13.196 "test -f /root/Fences-of-the-curtain/.env && echo OK"

# Текущее состояние
ssh root@37.143.13.196 "docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}' | grep fences"
```

### Backup

```bash
# Бэкап БД
ssh root@37.143.13.196 "pg_dump -U postgres -h 127.0.0.1 fences | gzip > /root/Fences-of-the-curtain/backups/db_\$(date +%Y%m%d_%H%M%S).sql.gz"

# Бэкап nginx конфига
ssh root@37.143.13.196 "cp /etc/nginx/conf.d/fences-upstream.conf /root/Fences-of-the-curtain/backups/nginx-upstream-\$(date +%Y%m%d_%H%M%S).conf"
```

### Build / Pull

```bash
# Push в master2 (триггерит CI)
git push origin master2

# Мониторинг CI
gh run list --branch master2 --limit 1
gh run watch <run_id>

# Pull образа на VPS
ssh root@37.143.13.196 "docker pull ghcr.io/<owner>/fences-of-the-curtain/app:sha-XXXXXXX"
```

### Deploy (Blue-Green)

```bash
# Запуск GREEN на 3003
ssh root@37.143.13.196 'docker run -d \
  --name fences-app-green \
  --network host \
  --restart no \
  --env-file /root/Fences-of-the-curtain/.env \
  -e PORT=3003 \
  -e NODE_ENV=production \
  -v /var/www/uploads:/app/public/uploads \
  ghcr.io/<owner>/fences-of-the-curtain/app:sha-XXXXXXX'

# Healthcheck GREEN (wait up to 120s)
ssh root@37.143.13.196 'for i in $(seq 1 24); do
  sleep 5
  if curl -sf --max-time 3 "http://127.0.0.1:3003/api/health" | grep -q "\"status\":\"ok\""; then
    echo "GREEN healthy"
    exit 0
  fi
done; echo "GREEN FAILED"; exit 1'

# Переключение nginx
ssh root@37.143.13.196 'cat > /etc/nginx/conf.d/fences-upstream.conf <<EOF
upstream app {
    server 127.0.0.1:3003;
    keepalive 32;
}
EOF
nginx -t && nginx -s reload'

# Smoke tests
ssh root@37.143.13.196 'curl -sf http://127.0.0.1:3003/api/health && echo "OK"'

# Остановка BLUE, запуск нового production
ssh root@37.143.13.196 'docker stop fences-app && docker rm fences-app'
ssh root@37.143.13.196 'docker run -d \
  --name fences-app \
  --network host \
  --restart unless-stopped \
  --env-file /root/Fences-of-the-curtain/.env \
  -e PORT=3001 \
  -e NODE_ENV=production \
  -v /var/www/uploads:/app/public/uploads \
  ghcr.io/<owner>/fences-of-the-curtain/app:sha-XXXXXXX'

# Переключение nginx на 3001
ssh root@37.143.13.196 'cat > /etc/nginx/conf.d/fences-upstream.conf <<EOF
upstream app {
    server 127.0.0.1:3001;
    keepalive 32;
}
EOF
nginx -t && nginx -s reload'

# Удаление GREEN
ssh root@37.143.13.196 'docker rm -f fences-app-green'
```

### Rollback

```bash
# Экстренный откат: переключить nginx на BLUE
ssh root@37.143.13.196 'cat > /etc/nginx/conf.d/fences-upstream.conf <<EOF
upstream app {
    server 127.0.0.1:3001;
    keepalive 32;
}
EOF
nginx -t && nginx -s reload'

# Удалить GREEN
ssh root@37.143.13.196 'docker rm -f fences-app-green 2>/dev/null'

# Если BLUE не работает — запустить предыдущий образ
ssh root@37.143.13.196 "docker run -d --name fences-app --network host --restart unless-stopped \
  --env-file /root/Fences-of-the-curtain/.env \
  -e PORT=3001 -e NODE_ENV=production \
  -v /var/www/uploads:/app/public/uploads \
  <PREVIOUS_IMAGE>"

# Восстановление БД (ТОЛЬКО при подтверждении пользователя)
# gunzip -c /root/Fences-of-the-curtain/backups/db_YYYYMMDD.sql.gz | psql -U postgres fences
```

### Verification

```bash
# Контейнеры
ssh root@37.143.13.196 "docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Image}}' | grep fences"

# Health (internal)
ssh root@37.143.13.196 "curl -sf http://127.0.0.1:3001/api/health"

# Health (external / SSL)
curl -sf --max-time 10 "https://zabor-i-naves.ru/api/health"

# Redis
ssh root@37.143.13.196 'redis-cli -h 127.0.0.1 -a "$REDIS_PASSWORD" ping'

# PostgreSQL
ssh root@37.143.13.196 "pg_isready -h 127.0.0.1 -p 5432"

# Логи (искать ошибки)
ssh root@37.143.13.196 "docker logs fences-app --tail=50 2>&1 | grep -iE 'error|fatal|panic|NOAUTH'"
```

### Cleanup

```bash
# Удалить старые образы (оставить 10)
ssh root@37.143.13.196 'docker images --format "{{.Repository}}:{{.Tag}}" | grep -E "ghcr.io.*fences.*app" | grep -v "<none>" | tail -n +11 | xargs -r docker rmi'

# Удалить старые бэкапы (> 7 дней)
ssh root@37.143.13.196 'find /root/Fences-of-the-curtain/backups -name "*.sql.gz" -mtime +7 -delete'

# Удалить старые логи (> 30 дней)
ssh root@37.143.13.196 'find /var/log/fences-deploy -name "*.log" -mtime +30 -delete'

# Prune unused images
ssh root@37.143.13.196 'docker image prune -f'
```

---

## Telegram уведомления

```bash
# Source env for credentials
source /root/Fences-of-the-curtain/.env

# Success
curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
  -H "Content-Type: application/json" \
  -d '{"chat_id": "'${TELEGRAM_CHAT_ID}'", "text": "✅ Деплой успешен\nВерсия: sha-XXXXXXX\nВремя: Xs\nИнициатор: manual"}'

# Failure + Rollback
curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
  -H "Content-Type: application/json" \
  -d '{"chat_id": "'${TELEGRAM_CHAT_ID}'", "text": "🔄 Деплой FAILED + откат\nВерсия: sha-XXXXXXX\nПричина: healthcheck failed\nВернулись к: sha-YYYYYYY"}'

# Critical (rollback failed)
curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
  -H "Content-Type: application/json" \
  -d '{"chat_id": "'${TELEGRAM_CHAT_ID}'", "text": "🚨 КРИТИЧЕСКАЯ ОШИБКА: откат провалился\nРучное вмешательство! VPS 37.143.13.196"}'
```

---

## Типичные проблемы и решения

| Проблема | Симптом | Решение |
|----------|---------|---------|
| GREEN не стартует | `docker ps` не показывает fences-app-green | `docker logs fences-app-green` — проверить ошибку |
| GREEN healthcheck timeout | 120s — нет ответа | Проверить PORT=3003, проверить entrypoint, проверить миграции |
| nginx -t failed | Config test error | Проверить `/etc/nginx/conf.d/fences-upstream.conf` — синтаксис |
| Redis NOAUTH | `NOAUTH Authentication required` | Проверить REDIS_PASSWORD в .env |
| DB migration failed | Prisma error в логах | Откат + восстановить из бэкапа |
| Image not found | `docker pull` → 404 | Проверить GHCR registry, проверить image tag |
| Disk full | `no space left on device` | `docker image prune -a`, `docker system prune` |
| OOM Kill | `SIGKILL` в логах | Уменьшить `--max-old-space-size` или добавить RAM |

---

## Порядок действий при ручном деплое (чеклист)

### Перед деплоем
- [ ] Ветка = master2
- [ ] Все изменения закоммичены и запушены
- [ ] CI pipeline прошёл (gh run list)
- [ ] VPS доступен (SSH)
- [ ] Диск > 1GB свободного места
- [ ] .env на месте

### Во время деплоя
- [ ] Бэкап БД создан
- [ ] GREEN контейнер запущен на 3003
- [ ] GREEN healthcheck пройден
- [ ] Nginx переключён
- [ ] Smoke tests пройдены
- [ ] Production контейнер на 3001
- [ ] GREEN удалён

### После деплоя
- [ ] https://zabor-i-naves.ru/api/health → 200
- [ ] Redis подключен
- [ ] PostgreSQL подключена
- [ ] Логи без fatal/panic
- [ ] Telegram уведомление отправлено
- [ ] Старые образы почищены

---

## Ссылки

- **Базовый скилл:** `SKILL_DEVOPS.md`
- **Формальная спецификация:** `PIPELINE_PROD.js`
- **Deploy скрипт:** `scripts/deploy-vps.sh`
- **Rollback скрипт:** `scripts/rollback-vps.sh`
- **CI/CD workflow:** `.github/workflows/deploy-production.yml`
- **Rollback workflow:** `.github/workflows/rollback-production.yml`
- **Production Dockerfile:** `docker/Dockerfile`
- **Production compose:** `docker-compose.yml`

---

*Скилл создан для безопасного продакшн-деплоя с Blue-Green стратегией и автоматическим откатом.*
