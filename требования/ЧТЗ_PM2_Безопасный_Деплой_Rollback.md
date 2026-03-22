# ЧТЗ: Безопасный деплой с PM2 и Rollback

## Версия: 1.0
## Дата: 2026-03-21
## Автор: AI-аналитик (ИБ)
## Приоритет: High
## Статус: Draft

---

## 1. Цели и задачи

### 1.1 Бизнес-цель
Устранить критические уязвимости в процессе деплоя:
- **Деструктивный git reset --hard** — потеря данных при сбое
- **Некорректный health check** — проверка localhost:3000 вместо Nginx
- **Отсутствие PM2 конфигурации** — нет graceful shutdown, memory limits, log rotation

### 1.2 Пользовательская ценность
- **Отказоустойчивость**: Возможность отката на предыдущую версию за < 2 минуты
- **Безопасность**: Защита от потери данных при деплое
- **Наблюдаемость**: История деплоев с аудитом за 30 дней
- **Стабильность**: Graceful restart без разрыва соединений

### 1.3 Метрики успеха
- Rollback выполняется за < 2 минут
- Health check проверяет через Nginx (порт 3001)
- PM2 настроен через ecosystem.config.js
- 100% деплоев логируются (коммит, время, результат)
- Zero downtime при graceful restart

---

## 2. Анализ текущего состояния

### 2.1 Выявленные проблемы

| Файл | Строка | Проблема | Критичность | Риск |
|------|--------|----------|-------------|------|
| `.github/workflows/deploy.yml` | 76 | `git reset --hard origin/master` без проверок | **Critical** | Потеря локальных изменений, невозможность отката |
| `.github/workflows/deploy.yml` | 104 | Health check на `localhost:3000` | **High** | Проверка мимо Nginx, несоответствие продакшену |
| `.github/workflows/deploy.yml` | 92-97 | PM2 без ecosystem.config.js | **High** | Нет graceful shutdown, memory limits |
| `.github/workflows/deploy.yml` | - | Нет rollback механизма | **Critical** | При неудачном деплое — ручное восстановление |
| - | - | Нет файла `ecosystem.config.js` | **High** | Нет конфигурации PM2 |

### 2.2 Текущий процесс деплоя

```
1. git fetch origin
2. git reset --hard origin/master  ← ДЕСТРУКТИВНО! Нет сохранения предыдущего состояния
3. npm install
4. npm run build
5. pm2 reload/restart              ← Нет ecosystem.config.js
6. Health check localhost:3000     ← Неверно! Nginx на 3001
```

### 2.3 Ожидаемый процесс деплоя

```
1. Сохранить текущий коммит для rollback
2. git fetch origin
3. git reset --hard origin/master
4. npm install
5. npm run build
6. pm2 reload (через ecosystem.config.js)
7. Health check localhost:3001 (через Nginx)
8. При неудаче → автоматический rollback
```

---

## 3. Функциональные требования

### 3.1 User Stories с Acceptance Criteria

#### US-001: PM2 ecosystem.config.js
**Как** DevOps инженер,  
**Я хочу** иметь конфигурационный файл PM2,  
**Чтобы** управлять настройками процесса через файл.

**Acceptance Criteria**:
```
Given файл ecosystem.config.js не существует
When создается файл
Then он содержит:
  - name: "fences-app"
  - script: "npm"
  - args: "start"
  - instances: 1 (single instance)
  - exec_mode: "fork"
  - max_memory_restart: "500M"
  - kill_timeout: 5000
  - wait_ready: true
  - listen_timeout: 10000
  - env_production с NODE_ENV=production
```

#### US-002: Корректный Health Check
**Как** система деплоя,  
**Я хочу** проверять здоровье через Nginx,  
**Чтобы** убедиться что весь стек работает.

**Acceptance Criteria**:
```
Given Nginx слушает на порту 3001
When выполняется health check
Then curl проверяет http://localhost:3001/
And проверка проходит через весь стек: Nginx → App
And timeout 5 секунд на попытку
And максимум 10 попыток
```

#### US-003: Безопасный Rollback
**Как** оператор,  
**Я хочу** иметь возможность отката на предыдущую версию,  
**Чтобы** восстановить работоспособность при неудачном деплое.

**Acceptance Criteria**:
```
Given деплой завершился неудачно (health check failed)
When срабатывает rollback
Then приложение возвращается к предыдущему коммиту
And npm install && npm run build выполняются
And pm2 reload запускается
And health check подтверждает восстановление
And логируется событие rollback
```

#### US-004: Аудит деплоев
**Как** администратор безопасности,  
**Я хочу** видеть историю всех деплоев,  
**Чтобы** анализировать инциденты.

**Acceptance Criteria**:
```
Given выполняется деплой
When деплой завершается (успех или неудача)
Then создается запись в логе:
  - timestamp
  - commit_from
  - commit_to
  - result (success/failed/rolled_back)
  - duration
  - initiator (GitHub actor или manual)
And логи хранятся 30 дней
```

#### US-005: Защита от git reset --hard
**Как** разработчик,  
**Я хочу** чтобы текущее состояние сохранялось перед reset,  
**Чтобы** можно было восстановить данные при ошибке.

**Acceptance Criteria**:
```
Given выполняется git reset --hard
When команда готова к выполнению
Then текущий HEAD сохраняется в переменную
And создается git tag deploy-backup-TIMESTAMP
And после успешного деплоя tag удаляется
And при rollback используется сохраненный коммит
```

---

## 4. Нефункциональные требования

### 4.1 Производительность
- Rollback выполняется за < 2 минут
- Graceful restart без разрыва соединений (wait_ready)
- Memory limit 500MB с автоматическим restart

### 4.2 Безопасность
- Git tag для резервирования перед reset
- Автоматический rollback при неудачном health check
- Логирование всех деплоев

### 4.3 Надёжность
- 10 попыток health check с интервалом 5 секунд
- Kill timeout 5 секунд для graceful shutdown
- Listen timeout 10 секунд для старта приложения

---

## 5. Техническая архитектура

### 5.1 Файл ecosystem.config.js

**Файл**: `ecosystem.config.js` (корень проекта)

```javascript
module.exports = {
  apps: [
    {
      name: 'fences-app',
      script: 'npm',
      args: 'start',
      cwd: '/root/Fences-of-the-curtain',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '500M',
      
      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      
      // Environment
      env_production: {
        NODE_ENV: 'production',
      },
      
      // Logging
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: '/var/log/fences-app/error.log',
      out_file: '/var/log/fences-app/out.log',
      merge_logs: true,
      
      // Auto restart on crash
      exp_backoff_restart_delay: 100,
      max_restarts: 10,
      restart_delay: 1000,
    },
  ],
};
```

### 5.2 Обновленный deploy.yml

**Файл**: `.github/workflows/deploy.yml`

```yaml
name: Deploy to VPS

on:
  repository_dispatch:
    types: [deploy-triggered]
  workflow_dispatch:

permissions:
  contents: read

jobs:
  deploy:
    runs-on: ubuntu-latest
    if: github.event_name == 'repository_dispatch' || github.event_name == 'workflow_dispatch'

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Deploy to VPS via SSH
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: 37.143.13.196
          username: root
          password: ${{ secrets.SSH_PASSWORD }}
          port: ${{ secrets.SSH_PORT || 22 }}
          script_stop: true
          command_timeout: 15m
          script: |
            set -e
            
            APP_DIR="/root/Fences-of-the-curtain"
            APP_NAME="fences-app"
            LOG_DIR="/var/log/fences-deploy"
            DEPLOY_LOG="$LOG_DIR/deploy.log"
            
            mkdir -p "$LOG_DIR"
            mkdir -p /var/log/fences-app
            
            log_deploy() {
              echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$DEPLOY_LOG"
            }
            
            cd $APP_DIR
            
            log_deploy "=== DEPLOY STARTED ==="
            log_deploy "Initiator: ${GITHUB_ACTOR:-manual}"
            
            log_deploy "=== Checking environment ==="
            if [ ! -f .env ]; then
              log_deploy "ERROR: .env file not found!"
              exit 1
            fi
            
            log_deploy "=== Saving current state for rollback ==="
            PREVIOUS_COMMIT=$(git rev-parse HEAD 2>/dev/null || echo "none")
            BACKUP_TAG="deploy-backup-$(date +%Y%m%d%H%M%S)"
            git tag "$BACKUP_TAG" 2>/dev/null || true
            log_deploy "Previous commit: $PREVIOUS_COMMIT"
            log_deploy "Backup tag: $BACKUP_TAG"
            
            log_deploy "=== Creating database backup ==="
            BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
            sudo -u postgres pg_dump -U postgres fences > "$BACKUP_FILE" || log_deploy "Warning: Backup failed, continuing..."
            
            log_deploy "=== Pulling latest changes ==="
            git fetch origin
            
            TARGET_COMMIT=$(git rev-parse origin/master)
            log_deploy "Target commit: $TARGET_COMMIT"
            
            git reset --hard origin/master
            
            log_deploy "=== Installing dependencies ==="
            npm install --legacy-peer-deps
            
            log_deploy "=== Generating Prisma Client ==="
            npx prisma generate
            
            log_deploy "=== Building application ==="
            npm run build
            
            log_deploy "=== Pushing schema changes ==="
            npx prisma db push --accept-data-loss
            
            log_deploy "=== Graceful restart with PM2 ==="
            if pm2 list | grep -q "$APP_NAME"; then
              log_deploy "Reloading existing process..."
              pm2 reload ecosystem.config.js --env production || pm2 restart ecosystem.config.js --env production
            else
              log_deploy "Starting new process..."
              pm2 start ecosystem.config.js --env production
            fi
            pm2 save
            
            log_deploy "=== Health check via Nginx (10 attempts, 5s each) ==="
            SUCCESS=0
            for i in $(seq 1 10); do
              sleep 5
              if curl -sf --max-time 5 http://localhost:3001/ > /dev/null 2>&1; then
                log_deploy "Health check passed on attempt $i!"
                SUCCESS=1
                break
              fi
              log_deploy "Attempt $i/10 failed..."
              if [ $i -eq 3 ] || [ $i -eq 6 ]; then
                log_deploy "=== PM2 logs at attempt $i ==="
                pm2 logs $APP_NAME --lines 20 --nostream || true
              fi
            done
            
            if [ $SUCCESS -eq 0 ]; then
              log_deploy "=== DEPLOYMENT FAILED - INITIATING ROLLBACK ==="
              
              log_deploy "=== Rolling back to previous commit ==="
              git reset --hard "$PREVIOUS_COMMIT"
              
              log_deploy "=== Reinstalling dependencies ==="
              npm install --legacy-peer-deps
              npx prisma generate
              
              log_deploy "=== Rebuilding application ==="
              npm run build
              
              log_deploy "=== Restarting with previous version ==="
              pm2 reload ecosystem.config.js --env production || pm2 restart ecosystem.config.js --env production
              
              log_deploy "=== Health check after rollback ==="
              ROLLBACK_SUCCESS=0
              for i in $(seq 1 5); do
                sleep 5
                if curl -sf --max-time 5 http://localhost:3001/ > /dev/null 2>&1; then
                  log_deploy "Rollback health check passed on attempt $i!"
                  ROLLBACK_SUCCESS=1
                  break
                fi
              done
              
              if [ $ROLLBACK_SUCCESS -eq 1 ]; then
                log_deploy "=== ROLLBACK SUCCESSFUL ==="
                log_deploy "DEPLOY RESULT: rolled_back (from $PREVIOUS_COMMIT to $TARGET_COMMIT, back to $PREVIOUS_COMMIT)"
              else
                log_deploy "=== ROLLBACK FAILED - MANUAL INTERVENTION REQUIRED ==="
                log_deploy "DEPLOY RESULT: rollback_failed"
              fi
              
              log_deploy "=== Final PM2 logs ==="
              pm2 logs $APP_NAME --lines 100 --nostream || true
              pm2 list
              
              git tag -d "$BACKUP_TAG" 2>/dev/null || true
              exit 1
            fi
            
            log_deploy "=== Cleaning up backup tag ==="
            git tag -d "$BACKUP_TAG" 2>/dev/null || true
            
            log_deploy "=== DEPLOYMENT SUCCESSFUL ==="
            log_deploy "DEPLOY RESULT: success (from $PREVIOUS_COMMIT to $TARGET_COMMIT)"
            
            pm2 list
            
            # Cleanup old deploy logs (30 days retention)
            find "$LOG_DIR" -name "deploy.log" -mtime +30 -delete 2>/dev/null || true
            find "$APP_DIR" -name "backup_*.sql" -mtime +7 -delete 2>/dev/null || true
```

### 5.3 Скрипт ручного rollback

**Файл**: `scripts/rollback.sh`

```bash
#!/bin/bash
set -e

APP_DIR="/root/Fences-of-the-curtain"
APP_NAME="fences-app"
LOG_DIR="/var/log/fences-deploy"
DEPLOY_LOG="$LOG_DIR/deploy.log"

mkdir -p "$LOG_DIR"

log_rollback() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] [ROLLBACK] $1" | tee -a "$DEPLOY_LOG"
}

cd "$APP_DIR"

if [ -z "$1" ]; then
  echo "Usage: ./scripts/rollback.sh <commit-hash-or-tag>"
  echo ""
  echo "Available backup tags:"
  git tag -l "deploy-backup-*" | sort -r | head -5
  echo ""
  echo "Recent commits:"
  git log --oneline -5
  exit 1
fi

TARGET="$1"
log_rollback "=== MANUAL ROLLBACK STARTED ==="
log_rollback "Target: $TARGET"
log_rollback "Current: $(git rev-parse HEAD)"

log_rollback "=== Resetting to $TARGET ==="
git reset --hard "$TARGET"

log_rollback "=== Installing dependencies ==="
npm install --legacy-peer-deps
npx prisma generate

log_rollback "=== Building application ==="
npm run build

log_rollback "=== Restarting application ==="
pm2 reload ecosystem.config.js --env production || pm2 restart ecosystem.config.js --env production
pm2 save

log_rollback "=== Health check ==="
for i in $(seq 1 10); do
  sleep 5
  if curl -sf --max-time 5 http://localhost:3001/ > /dev/null 2>&1; then
    log_rollback "Health check passed on attempt $i!"
    log_rollback "=== ROLLBACK SUCCESSFUL ==="
    pm2 list
    exit 0
  fi
  log_rollback "Attempt $i/10 failed..."
done

log_rollback "=== ROLLBACK FAILED ==="
pm2 logs $APP_NAME --lines 50 --nostream || true
exit 1
```

### 5.4 Структура файлов

```
.
├── ecosystem.config.js           # NEW: PM2 конфигурация
├── scripts/
│   └── rollback.sh               # NEW: Скрипт ручного отката
├── .github/
│   └── workflows/
│       └── deploy.yml            # UPDATE: Безопасный деплой с rollback
└── /var/log/
    ├── fences-app/               # NEW: Логи приложения
    │   ├── out.log
    │   └── error.log
    └── fences-deploy/            # NEW: Логи деплоев
        └── deploy.log
```

---

## 6. Декомпозиция на задачи

### Infrastructure

#### TASK-INF-001: Создание ecosystem.config.js
**Направление**: Infrastructure  
**Приоритет**: High  
**Оценка**: 0.5 часа  
**Зависимости**: нет

**Описание**:
Создать конфигурационный файл PM2 с настройками для продакшена.

**Критерии приемки**:
- [ ] Файл `ecosystem.config.js` создан в корне проекта
- [ ] Настроен single instance mode
- [ ] Настроен max_memory_restart: 500M
- [ ] Настроен graceful shutdown (wait_ready, kill_timeout)
- [ ] Настроены пути к логам (/var/log/fences-app/)
- [ ] PM2 может стартовать с этой конфигурацией

**Технические детали**:
- Файлы: `ecosystem.config.js`
- PM2 команда проверки: `pm2 start ecosystem.config.js --env production`

---

#### TASK-INF-002: Обновление deploy.yml — безопасный git reset
**Направление**: Infrastructure  
**Приоритет**: Critical  
**Оценка**: 1 час  
**Зависимости**: нет

**Описание**:
Добавить сохранение текущего состояния перед git reset --hard.

**Критерии приемки**:
- [ ] Текущий коммит сохраняется в переменную PREVIOUS_COMMIT
- [ ] Создается git tag deploy-backup-TIMESTAMP
- [ ] Tag удаляется после успешного деплоя
- [ ] Tag используется при rollback

**Технические детали**:
- Файлы: `.github/workflows/deploy.yml`
- Строки: добавить после "Checking environment"

---

#### TASK-INF-003: Обновление deploy.yml — корректный health check
**Направление**: Infrastructure  
**Приоритет**: High  
**Оценка**: 0.5 часа  
**Зависимости**: нет

**Описание**:
Изменить health check с localhost:3000 на localhost:3001 (через Nginx).

**Критерии приемки**:
- [ ] curl проверяет http://localhost:3001/
- [ ] Добавлен --max-time 5
- [ ] Health check проходит через Nginx → App стек

**Технические детали**:
- Файлы: `.github/workflows/deploy.yml`
- Строка 104: изменить URL

---

#### TASK-INF-004: Обновление deploy.yml — автоматический rollback
**Направление**: Infrastructure  
**Приоритет**: Critical  
**Оценка**: 1.5 часа  
**Зависимости**: TASK-INF-002

**Описание**:
Добавить автоматический rollback при неудачном health check.

**Критерии приемки**:
- [ ] При FAILED health check запускается rollback
- [ ] git reset --hard к PREVIOUS_COMMIT
- [ ] npm install && npm run build
- [ ] pm2 reload
- [ ] Health check после rollback
- [ ] Логирование результата rollback

**Технические детали**:
- Файлы: `.github/workflows/deploy.yml`
- Добавить блок после health check

---

#### TASK-INF-005: Обновление deploy.yml — PM2 через ecosystem.config.js
**Направление**: Infrastructure  
**Приоритет**: High  
**Оценка**: 0.5 часа  
**Зависимости**: TASK-INF-001

**Описание**:
Изменить запуск PM2 на использование ecosystem.config.js.

**Критерии приемки**:
- [ ] pm2 start использует ecosystem.config.js
- [ ] pm2 reload использует ecosystem.config.js
- [ ] Передается --env production

**Технические детали**:
- Файлы: `.github/workflows/deploy.yml`
- Строки: 92-97

---

#### TASK-INF-006: Обновление deploy.yml — аудит деплоев
**Направление**: Infrastructure  
**Приоритет**: Medium  
**Оценка**: 1 час  
**Зависимости**: TASK-INF-002, TASK-INF-004

**Описание**:
Добавить логирование всех деплоев в файл с retention 30 дней.

**Критерии приемки**:
- [ ] Создается директория /var/log/fences-deploy/
- [ ] Логи пишутся в deploy.log
- [ ] Формат: timestamp, action, result
- [ ] Cleanup логов старше 30 дней
- [ ] Cleanup бэкапов БД старше 7 дней

**Технические детали**:
- Файлы: `.github/workflows/deploy.yml`
- Добавить log_deploy функцию

---

#### TASK-INF-007: Создание scripts/rollback.sh
**Направление**: Infrastructure  
**Приоритет**: Medium  
**Оценка**: 0.5 часа  
**Зависимости**: TASK-INF-001

**Описание**:
Создать скрипт для ручного отката на указанный коммит или tag.

**Критерии приемки**:
- [ ] Скрипт создан в scripts/rollback.sh
- [ ] Принимает аргумент: commit hash или tag
- [ ] Без аргумента показывает список backup tags
- [ ] Выполняет git reset → npm install → build → pm2 reload
- [ ] Логирует в deploy.log

**Технические детали**:
- Файлы: `scripts/rollback.sh`
- Права: chmod +x

---

### Testing

#### TASK-TST-001: Тестирование PM2 конфигурации
**Направление**: Testing  
**Приоритет**: High  
**Оценка**: 0.5 часа  
**Зависимости**: TASK-INF-001

**Критерии приемки**:
- [ ] pm2 start ecosystem.config.js запускается
- [ ] pm2 reload выполняет graceful restart
- [ ] Memory limit корректно настроен
- [ ] Логи пишутся в /var/log/fences-app/

---

#### TASK-TST-002: Тестирование rollback сценария
**Направление**: Testing  
**Приоритет**: High  
**Оценка**: 1 час  
**Зависимости**: TASK-INF-004

**Критерии приемки**:
- [ ] Симуляция failed health check
- [ ] Автоматический rollback срабатывает
- [ ] Приложение восстанавливается
- [ ] Логи содержат информацию о rollback

---

### Documentation

#### TASK-DOC-001: Обновление README.md
**Направление**: Documentation  
**Приоритет**: Low  
**Оценка**: 0.5 часа  
**Зависимости**: TASK-INF-001, TASK-INF-007

**Критерии приемки**:
- [ ] Добавлен раздел "Deployment"
- [ ] Описан процесс деплоя
- [ ] Описан процесс rollback
- [ ] Указаны пути к логам

---

## 7. Тестирование

### 7.1 Сценарии тестирования

| Сценарий | Шаги | Ожидаемый результат |
|----------|------|---------------------|
| Успешный деплой | Push → Deploy | Health check passed, tag удален |
| Rollback при failed build | Сломать build → Deploy | Автоматический rollback |
| Rollback при failed health check | Сломать health → Deploy | Автоматический rollback |
| Ручной rollback | ./scripts/rollback.sh tag | Откат на tag |
| PM2 graceful restart | pm2 reload | Zero downtime |

### 7.2 Edge Cases

| Case | Обработка |
|------|-----------|
| Нет предыдущего коммита | PREVIOUS_COMMIT = "none", rollback невозможен |
| Нет .env файла | Ошибка на этапе проверки |
| PM2 не установлен | Ошибка на этапе restart |
| Nginx не запущен | Health check failed → rollback |

---

## 8. Риски и зависимости

### 8.1 Риски

| Риск | Вероятность | Влияние | Митигация |
|------|-------------|---------|-----------|
| Rollback не срабатывает | Low | Critical | Backup tag + ручной скрипт |
| Nginx недоступен | Low | High | Проверка Nginx перед health check |
| Диск переполнен логами | Low | Medium | Retention 30 дней + cleanup |
| Memory leak в приложении | Medium | Medium | max_memory_restart: 500M |

### 8.2 Зависимости

- **TASK-INF-001** должна быть выполнена первой (ecosystem.config.js)
- **TASK-INF-002** → **TASK-INF-004** (rollback зависит от сохранения коммита)
- **TASK-INF-001** → **TASK-INF-005** (PM2 через config)

---

## 9. План внедрения

### 9.1 Этап 1: PM2 конфигурация (30 мин)
1. TASK-INF-001: Создать ecosystem.config.js
2. TASK-TST-001: Протестировать локально

### 9.2 Этап 2: Безопасный деплой (2 часа)
1. TASK-INF-002: Сохранение состояния
2. TASK-INF-003: Корректный health check
3. TASK-INF-005: PM2 через config
4. TASK-INF-006: Аудит деплоев

### 9.3 Этап 3: Rollback (1.5 часа)
1. TASK-INF-004: Автоматический rollback
2. TASK-INF-007: Ручной rollback скрипт
3. TASK-TST-002: Тестирование

### 9.4 Этап 4: Документация (30 мин)
1. TASK-DOC-001: Обновить README

---

## 10. Чек-лист Definition of Done

### Код
- [ ] ecosystem.config.js создан и протестирован
- [ ] deploy.yml обновлен с rollback
- [ ] Health check проверяет через Nginx :3001
- [ ] Логи деплоев пишутся с retention 30 дней

### Тестирование
- [ ] Успешный деплой протестирован
- [ ] Rollback при failed build протестирован
- [ ] Rollback при failed health check протестирован
- [ ] Ручной rollback протестирован

### Безопасность
- [ ] Git tag создается перед reset
- [ ] Автоматический rollback срабатывает
- [ ] Логи содержат всю информацию для аудита

---

## 11. Согласование

- [ ] Заказчик (Product Owner)
- [ ] Техлид
- [ ] DevOps

---

*ЧТЗ подготовлено для реализации AI-разработчиком.*
