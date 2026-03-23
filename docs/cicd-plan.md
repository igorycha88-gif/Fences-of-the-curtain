# CI/CD — план реализации

## Анализ текущего состояния

### Архитектура деплоя сейчас

```
feature/* → PR → master (препрод-ветка) → merge → deploy.yml → SSH → VPS (прод)
```

**Важно**: отдельного препрод-сервера нет. `master` — это ветка, которую считают готовой к проду. Любой мёрж в `master` = автоматический деплой на живой продакшн. Это означает, что CI-проверки на PR — единственный барьер перед тем, как сломанный код попадёт к пользователям.

- **Прод VPS**: `37.143.13.196`, root-пользователь, PM2
- **App dir**: `/root/Fences-of-the-curtain`
- **Сборка**: происходит прямо на продакшн-сервере (!)
- **БД**: PostgreSQL 16, работает вне Docker (или внутри — неясно из конфига)
- **docker-compose.yml** существует, но в деплое **не используется**

---

## Найденные проблемы (по приоритету)

### КРИТИЧЕСКИЕ

#### 1. `prisma db push --accept-data-loss` в проде (ПОДТВЕРЖДЕНО — исправлять)
```yaml
# deploy.yml:111
npx prisma db push --accept-data-loss
```
**Проблема**: `db push` — инструмент для разработки. Флаг `--accept-data-loss` может удалить данные при изменении схемы. В продакшне обязателен `prisma migrate deploy`.

**Как падает**: любое изменение типа колонки или удаление поля → потеря данных без предупреждения.

#### 2. ~~Несоответствие ветки~~ — НЕ баг
`master` — это препрод-ветка, именно с неё идёт деплой на прод. Это намеренно.

Актуальная схема ветвления:
```
feature/* → PR → master (препрод) → деплой на прод VPS
```

#### 3. Сборка на продакшн-сервере
**Проблема**: `npm install` + `npm run build` на живом сервере:
- Занимает 2–5 минут, в которых PM2 может перезагрузиться с неполной сборкой
- При ошибке сборки rollback требует пересборки (ещё 2–5 минут downtime)
- Ест RAM/CPU продакшн-сервера

#### 4. SSH аутентификация по паролю
```yaml
password: ${{ secrets.SSH_PASSWORD }}
```
**Проблема**: парольная аутентификация — слабее ключевой, брутфорсируема. GitHub Actions должен использовать SSH-ключ.

---

### ВЫСОКИЙ ПРИОРИТЕТ

#### 5. Нет проверок качества перед деплоем
Воркфлоу `bump-version.yml` сразу триггерит деплой при мёрже PR без:
- Запуска тестов
- Линтинга
- Type-check

**Как падает**: баг в коде → деплой → rollback → downtime.

#### 6. `NEXT_PUBLIC_*` переменные не передаются в Docker-сборку
В `docker-compose.yml` env-переменные вида `NEXT_PUBLIC_*` передаются как runtime, но Next.js встраивает их **в бандл во время сборки**. При использовании Docker без `--build-arg` они будут `undefined` в браузере.

Это касается:
- `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`
- `NEXT_PUBLIC_YANDEX_METRIKA_ID`
- `NEXT_PUBLIC_GOOGLE_ANALYTICS_ID`
- `NEXT_PUBLIC_YANDEX_MAPS_API_KEY`

#### 7. Порт PostgreSQL открыт наружу
```yaml
# docker-compose.yml:41
ports:
  - "5433:5432"
```
**Проблема**: база данных доступна из интернета. Должна быть только в Docker-сети.

#### 8. Nginx без HTTPS
`docker/nginx.conf` слушает только 80 и 3001. HTTPS-конфиг отсутствует (хотя SSL-сертификаты монтируются).

---

### СРЕДНИЙ ПРИОРИТЕТ

#### 9. Redis-пароль: смешанный подход
- В `docker-compose.yml` Redis использует Docker secrets (правильно)
- В `docker-compose.yml` app-контейнер читает `REDIS_PASSWORD` из переменной окружения (не из секрета)
- Два источника для одного секрета — рассинхронизация

#### 10. Нет уведомлений о результате деплоя
Telegram-бот настроен в приложении, но CI/CD не отправляет уведомления об успехе/провале деплоя.

#### 11. Backup БД — ненадёжный
```bash
sudo -u postgres pg_dump -U postgres fences > "$BACKUP_FILE" || log_deploy "Warning: Backup failed, continuing..."
```
Backup-файлы хранятся в `/root/Fences-of-the-curtain/` (в директории приложения). При `git reset --hard` они сохраняются, но это ненадёжно.

---

## Целевая архитектура CI/CD

```
PR → [CI: lint + typecheck + tests] → merge в main
                                            ↓
                               [bump-version: auto-tag + release]
                                            ↓
                               [build: Docker image → push to registry]
                                            ↓
                               [deploy: pull image на VPS + migrate + restart]
                                            ↓
                               [health check → notify Telegram]
```

---

## План реализации

### Фаза 1 — Критические исправления (делать немедленно)

#### 1.1 Исправить имя ветки
В файлах `.github/workflows/deploy.yml` и `.github/workflows/bump-version.yml`:
- `origin/master` → `origin/main`
- `base.ref == 'master'` → `base.ref == 'main'`
- `git push origin master` → `git push origin main`

#### 1.2 Заменить `prisma db push` на `prisma migrate deploy`
```bash
# Было (ОПАСНО):
npx prisma db push --accept-data-loss

# Должно быть:
npx prisma migrate deploy
```

**Требования**:
- Все изменения схемы должны сопровождаться файлом миграции (`prisma migrate dev --name <name>` локально)
- Миграции коммитятся в репозиторий в `prisma/migrations/`
- `prisma migrate deploy` применяет только новые, безопасные миграции

#### 1.3 Перейти на SSH key аутентификацию
1. Сгенерировать ключ: `ssh-keygen -t ed25519 -C "github-actions-deploy"`
2. Публичный ключ добавить в `/root/.ssh/authorized_keys` на VPS
3. Приватный ключ добавить в GitHub Secrets как `SSH_PRIVATE_KEY`
4. Удалить `SSH_PASSWORD` из секретов

```yaml
# В deploy.yml заменить:
password: ${{ secrets.SSH_PASSWORD }}
# На:
key: ${{ secrets.SSH_PRIVATE_KEY }}
```

---

### Фаза 2 — CI (проверки перед деплоем)

Создать `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci --legacy-peer-deps

      - name: Type check
        run: npx tsc --noEmit

      - name: Lint
        run: npm run lint

      - name: Generate Prisma Client
        run: npx prisma generate

      - name: Run tests
        run: npm test -- --coverage --passWithNoTests
        env:
          DATABASE_URL: "postgresql://postgres:test@localhost:5432/fences_test"
```

**Важно**: добавить в `bump-version.yml` условие — запускать деплой только если CI прошёл.

---

### Фаза 3 — Docker-based деплой

Текущий деплой через PM2 работает, но не использует преимущества Docker-сборки. Переход на Docker даёт:
- Сборка происходит в CI, а не на проде
- Артефакт (image) один и тот же для всех сред
- Откат — это `docker pull <prev-tag>` (секунды, не минуты)

#### 3.1 GitHub Container Registry (GHCR)

```yaml
# .github/workflows/build.yml
name: Build & Push Docker Image

on:
  push:
    tags: ['v*']

jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - uses: actions/checkout@v4

      - name: Log in to GHCR
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          file: docker/Dockerfile
          push: true
          tags: |
            ghcr.io/${{ github.repository }}:${{ github.ref_name }}
            ghcr.io/${{ github.repository }}:latest
          build-args: |
            NEXT_PUBLIC_RECAPTCHA_SITE_KEY=${{ secrets.NEXT_PUBLIC_RECAPTCHA_SITE_KEY }}
            NEXT_PUBLIC_YANDEX_METRIKA_ID=${{ secrets.NEXT_PUBLIC_YANDEX_METRIKA_ID }}
            NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=${{ secrets.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID }}
            NEXT_PUBLIC_YANDEX_MAPS_API_KEY=${{ secrets.NEXT_PUBLIC_YANDEX_MAPS_API_KEY }}
```

**Dockerfile изменения** — добавить ARG для публичных переменных:
```dockerfile
FROM base AS builder
# ...
ARG NEXT_PUBLIC_RECAPTCHA_SITE_KEY
ARG NEXT_PUBLIC_YANDEX_METRIKA_ID
ARG NEXT_PUBLIC_GOOGLE_ANALYTICS_ID
ARG NEXT_PUBLIC_YANDEX_MAPS_API_KEY

ENV NEXT_PUBLIC_RECAPTCHA_SITE_KEY=$NEXT_PUBLIC_RECAPTCHA_SITE_KEY
ENV NEXT_PUBLIC_YANDEX_METRIKA_ID=$NEXT_PUBLIC_YANDEX_METRIKA_ID
ENV NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=$NEXT_PUBLIC_GOOGLE_ANALYTICS_ID
ENV NEXT_PUBLIC_YANDEX_MAPS_API_KEY=$NEXT_PUBLIC_YANDEX_MAPS_API_KEY

RUN npx prisma generate
RUN npm run build
```

#### 3.2 Обновить deploy.yml для Docker

```bash
# На сервере:
cd $APP_DIR

# Backup БД
pg_dump_to_safe_location

# Pull нового образа
docker compose pull app

# Применить миграции (отдельным контейнером, до рестарта)
docker compose run --rm app npx prisma migrate deploy

# Перезапустить с новым образом
docker compose up -d app

# Health check...
```

---

### Фаза 4 — Секреты и безопасность

#### 4.1 GitHub Secrets (полный список)

Добавить в Settings → Secrets and variables → Actions:

| Секрет | Описание |
|--------|----------|
| `SSH_PRIVATE_KEY` | Ed25519 приватный ключ для деплоя |
| `NEXTAUTH_SECRET` | Минимум 32 символа |
| `POSTGRES_PASSWORD` | Пароль PostgreSQL |
| `REDIS_PASSWORD` | Пароль Redis |
| `CRON_SECRET` | Секрет для cron-эндпоинтов |
| `SMTP_USER` | Email аккаунт |
| `SMTP_PASS` | App password от Gmail |
| `TELEGRAM_BOT_TOKEN` | Токен Telegram бота |
| `TELEGRAM_CHAT_ID` | ID чата для уведомлений |
| `RECAPTCHA_SECRET_KEY` | Серверный ключ reCAPTCHA |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | Публичный ключ reCAPTCHA (build-time) |
| `NEXT_PUBLIC_YANDEX_METRIKA_ID` | ID Яндекс.Метрики (build-time) |
| `NEXT_PUBLIC_GOOGLE_ANALYTICS_ID` | ID Google Analytics (build-time) |
| `NEXT_PUBLIC_YANDEX_MAPS_API_KEY` | Ключ Яндекс.Карт (build-time) |

#### 4.2 Закрыть порт PostgreSQL

```yaml
# docker-compose.yml — убрать внешний проброс порта
db:
  # ports:          # удалить эту секцию
  #   - "5433:5432"  # БД не должна быть доступна снаружи
```

При необходимости подключиться к БД: `docker compose exec db psql -U postgres fences`

#### 4.3 HTTPS в Nginx

Добавить в `docker/nginx.conf`:
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;

    # ... остальная конфигурация
}
```

---

### Фаза 5 — Уведомления и мониторинг

#### 5.1 Telegram-уведомления из CI/CD

Добавить в конец `deploy.yml`:
```yaml
- name: Notify Telegram on success
  if: success()
  run: |
    curl -s -X POST "https://api.telegram.org/bot${{ secrets.TELEGRAM_BOT_TOKEN }}/sendMessage" \
      -d chat_id="${{ secrets.TELEGRAM_CHAT_ID }}" \
      -d text="✅ Деплой успешен: v${{ github.ref_name }}"

- name: Notify Telegram on failure
  if: failure()
  run: |
    curl -s -X POST "https://api.telegram.org/bot${{ secrets.TELEGRAM_BOT_TOKEN }}/sendMessage" \
      -d chat_id="${{ secrets.TELEGRAM_CHAT_ID }}" \
      -d text="❌ Деплой упал: v${{ github.ref_name }}. Проверьте логи: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}"
```

#### 5.2 Health check endpoint

Убедиться, что `/api/health` или аналог возвращает статус с проверкой БД и Redis. Использовать в CI вместо проверки homepage.

---

## Итоговый порядок воркфлоу

```
PR открыт → ci.yml [typecheck + lint + tests]
                ↓ (pass only)
PR merge в main → bump-version.yml [version tag]
                        ↓
                  build.yml [Docker image → GHCR]
                        ↓
                  deploy.yml [pull image → migrate → restart → health check → notify]
```

---

## Порядок выполнения работ

| # | Задача | Риск | Время |
|---|--------|------|-------|
| 1 | Исправить ветку master → main в воркфлоу | Высокий (деплой не работает) | 15 мин |
| 2 | Заменить `db push` на `migrate deploy` | Критический (потеря данных) | 30 мин + тест |
| 3 | SSH key вместо пароля | Высокий (безопасность) | 20 мин |
| 4 | Создать `ci.yml` с тестами | Средний | 30 мин |
| 5 | Закрыть порт PostgreSQL | Высокий (безопасность) | 5 мин |
| 6 | ARG в Dockerfile для NEXT_PUBLIC_* | Средний (функциональность) | 20 мин |
| 7 | Docker build + GHCR | Низкий (улучшение) | 1-2 ч |
| 8 | HTTPS в Nginx | Средний | 30 мин |
| 9 | Telegram-уведомления из CI | Низкий | 20 мин |

---

## Что НЕ трогать

- Структура `docker-compose.yml` в целом — хорошая
- Docker secrets для Redis — правильный подход
- Структура Rollback в deploy.yml — рабочая, только починить ветку
- PM2 ecosystem.config.js — можно оставить как fallback
- Система backup SQL-файлов — оставить, улучшить место хранения

---

## Проверка перед запуском нового CI/CD

```bash
# 1. Убедиться, что все миграции созданы
npx prisma migrate status

# 2. Убедиться, что .env на сервере актуален
ssh root@37.143.13.196 "cat /root/Fences-of-the-curtain/.env | grep -v '=.*[a-z]'"  # проверить ключи

# 3. Убедиться, что GITHUB_TOKEN имеет права на packages
# Settings → Actions → General → Workflow permissions: Read and write

# 4. Протестировать SSH-ключ
ssh -i ~/.ssh/deploy_key root@37.143.13.196 "echo OK"
```
