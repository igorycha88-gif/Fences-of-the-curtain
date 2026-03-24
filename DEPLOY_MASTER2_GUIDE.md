# 🚀 ИНСТРУКЦИЯ ПО СЛИЯНИЮ MASTER2 С ПРОДОМ

## 📋 СОДЕРЖАНИЕ

1. [Анализ ситуации](#анализ-ситуации)
2. [Подготовка к деплою](#подготовка-к-деплою)
3. [Выполнение деплоя](#выполнение-деплоя)
4. [Проверка и откат](#проверка-и-откат)
5. [Автоматизация на будущее](#автоматизация-на-будущее)

---

## 📊 АНАЛИЗ СИТУАЦИИ

### Текущее состояние

| Компонент | Master (прод) | Master2 (новый) |
|-----------|---------------|-----------------|
| Версия | 1.3.1 | 1.4.0 |
| Последний коммит | bdb8922 | e19b147 |
| PostgreSQL | 14.22 (нативный) | 16-alpine (в Docker) |
| Запуск | PM2 | PM2 + Docker |
| Panel3D таблица | ❌ НЕ СУЩЕСТВУЕТ | ✅ Есть в коде |
| Panel3D колонки | ❌ НЕ СУЩЕСТВУЮТ | ✅ Есть в схеме |

### Критичные проблемы

1. **Таблица Panel3D отсутствует на проде** - Функционал 3D-панелей не будет работать
2. **Колонки panel3d* отсутствуют в FenceEstimate** - Расчеты не будут сохраняться
3. **Несоответствие конфигурации** - docker-compose.yml ожидает Docker, но на VPS PM2

### Созданные файлы

✅ `prisma/migrations/20260324233000_add_panel3d_model/migration.sql` - Миграция Panel3D
✅ `scripts/deploy-master2-safe.sh` - Безопасный деплой
✅ `scripts/rollback-to-master.sh` - Откат на master
✅ `scripts/verify-deployment.sh` - Проверка деплоя

---

## 🔧 ПОДГОТОВКА К ДЕПЛОЮ

### Шаг 1: Проверка локального окружения

```bash
# Переключиться на master2
git checkout master2

# Проверить незакоммиченные изменения
git status

# Обновить ветку
git pull origin master2
```

### Шаг 2: Применить миграцию локально

```bash
# Применить миграцию Panel3D
npx prisma migrate dev

# Проверить что таблица создана
psql -U postgres -d fences -c "\d Panel3D"
```

### Шаг 3: Проверить переменные окружения на VPS

```bash
# Подключиться к VPS
ssh root@37.143.13.196

# Проверить .env
cat /root/Fences-of-the-curtain/.env | grep -E "DATABASE_URL|REDIS_URL|NEXTAUTH_SECRET"

# Проверить что Redis пароль настроен
grep REDIS_PASSWORD /root/Fences-of-the-curtain/.env
```

**Ожидаемые значения:**
```
DATABASE_URL=postgresql://postgres:HVt6G6LE6mduMrAny91F@localhost:5432/fences
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=g3xVlty76Op1vIbTuwy+8M+0ZUXx4XgtQX2+YrTtbLY
NEXTAUTH_SECRET=<ваш_секрет>
```

### Шаг 4: Установить необходимые пакеты на VPS

```bash
# Проверить наличие sshpass (если не установлен)
ssh root@37.143.13.196 "which sshpass || apt-get install -y sshpass"
```

---

## 🚀 ВЫПОЛНЕНИЕ ДЕПЛОЯ

### Вариант 1: Автоматический деплой (рекомендуется)

```bash
# Запустить скрипт безопасного деплоя
bash scripts/deploy-master2-safe.sh
```

**Скрипт автоматически выполнит:**
1. ✅ Проверки перед деплоем
2. ✅ Создание резервных копий (БД, код, uploads)
3. ✅ Применение миграций (включая Panel3D)
4. ✅ Обновление кода до master2
5. ✅ Сборку приложения
6. ✅ Перезапуск PM2
7. ✅ Проверку работоспособности
8. ✅ Автоматический откат при ошибках

### Вариант 2: Ручной деплой (для опытных)

#### Шаг 1: Создать бэкапы

```bash
# На VPS
ssh root@37.143.13.196

# Бэкап БД
cd /root/Fences-of-the-curtain
BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR
PGPASSWORD=HVt6G6LE6mduMrAny91F pg_dump -U postgres fences > $BACKUP_DIR/db_backup.sql
gzip $BACKUP_DIR/db_backup.sql

# Бэкап кода
git log --oneline -5 > $BACKUP_DIR/git_state.txt
git rev-parse HEAD >> $BACKUP_DIR/git_state.txt

# Бэкап uploads
tar czf $BACKUP_DIR/uploads.tar.gz public/uploads/

echo "Бэкапы созданы в: $BACKUP_DIR"
```

#### Шаг 2: Применить миграции

```bash
# Проверить наличие таблицы Panel3D
PGPASSWORD=HVt6G6LE6mduMrAny91F psql -U postgres -d fences -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Panel3D')"

# Если таблицы нет - применить миграцию
PGPASSWORD=HVt6G6LE6mduMrAny91F psql -U postgres -d fences -f prisma/migrations/20260324233000_add_panel3d_model/migration.sql

# Применить остальные миграции
npx prisma migrate deploy

# Сгенерировать Prisma Client
npx prisma generate
```

#### Шаг 3: Обновить код

```bash
# Переключиться на master2
git fetch origin
git checkout master2
git pull origin master2

# Установить зависимости
npm ci

# Очистить кэш
rm -rf .next

# Собрать приложение
npm run build
```

#### Шаг 4: Перезапустить приложение

```bash
# Перезапуск PM2
pm2 restart fences-app

# Проверить статус
pm2 list
pm2 logs fences-app --lines 50
```

---

## ✅ ПРОВЕРКА И ОТКАТ

### Проверка работоспособности

#### Автоматическая проверка

```bash
# Запустить скрипт проверки
bash scripts/verify-deployment.sh
```

**Проверки включают:**
- PM2 статус
- Логи на ошибки
- API endpoints
- Panel3D функционал
- БД таблицы
- Redis подключение
- Дисковое пространство

#### Ручная проверка

```bash
# 1. Проверить PM2 статус
ssh root@37.143.13.196 "pm2 list"

# 2. Проверить логи
ssh root@37.143.13.196 "pm2 logs fences-app --lines 100"

# 3. Проверить главную страницу
curl -I http://37.143.13.196:3001/

# 4. Проверить Panel3D API
curl -I http://37.143.13.196:3001/api/admin/panel3d

# 5. Проверить таблицу Panel3D в БД
ssh root@37.143.13.196 "PGPASSWORD=HVt6G6LE6mduMrAny91F psql -U postgres -d fences -c '\d Panel3D'"
```

### Откат при проблемах

#### Автоматический откат

```bash
# Запустить скрипт отката
bash scripts/rollback-to-master.sh
```

#### Ручной откат

```bash
# На VPS
ssh root@37.143.13.196

# Переключиться на master
cd /root/Fences-of-the-curtain
git checkout master
git pull origin master

# Установить зависимости и собрать
npm ci
npx prisma generate
npm run build

# Перезапустить
pm2 restart fences-app

# Откатить миграции (если нужно)
npx prisma migrate resolve --applied "20260324233000_add_panel3d_model"
```

#### Восстановление из бэкапа

```bash
# Восстановить БД
cd /root/Fences-of-the-curtain/backups/<дата>
gunzip db_backup.sql.gz
PGPASSWORD=HVt6G6LE6mduMrAny91F psql -U postgres -d fences < db_backup.sql

# Восстановить uploads
tar xzf uploads.tar.gz -C /root/Fences-of-the-curtain/public/
```

---

## 🔄 АВТОМАТИЗАЦИЯ НА БУДУЩЕЕ

### Создать алиасы для быстрого деплоя

Добавить в `~/.bashrc` или `~/.zshrc`:

```bash
# Деплой master2 на прод
alias deploy-prod='bash ~/Fences-of-the-curtain/scripts/deploy-master2-safe.sh'

# Откат на master
alias rollback-prod='bash ~/Fences-of-the-curtain/scripts/rollback-to-master.sh'

# Проверка деплоя
alias check-prod='bash ~/Fences-of-the-curtain/scripts/verify-deployment.sh'

# Статус PM2 на проде
alias pm2-prod='ssh root@37.143.13.196 "pm2 list"'

# Логи PM2 на проде
alias logs-prod='ssh root@37.143.13.196 "pm2 logs fences-app --lines 100"'
```

### Настройка GitHub Actions (опционально)

Создать файл `.github/workflows/deploy-master2.yml`:

```yaml
name: Deploy Master2 to Production

on:
  push:
    branches: [master2]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to VPS
        uses: appleboy/ssh-action@master
        with:
          host: 37.143.13.196
          username: root
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /root/Fences-of-the-curtain
            git checkout master2
            git pull origin master2
            npm ci
            npx prisma migrate deploy
            npm run build
            pm2 restart fences-app
```

---

## 📝 CHECKLIST ДЕПЛОЯ

Перед деплоем:
- [ ] Находиться на ветке master2
- [ ] Нет незакоммиченных изменений
- [ ] Миграция Panel3D протестирована локально
- [ ] Переменные окружения настроены на VPS
- [ ] Бэкапы созданы

Во время деплоя:
- [ ] Миграции применены успешно
- [ ] Код обновлен до master2
- [ ] Приложение собрано без ошибок
- [ ] PM2 перезапущен

После деплоя:
- [ ] PM2 статус: online
- [ ] Нет ошибок в логах
- [ ] Главная страница доступна
- [ ] Panel3D API работает
- [ ] Таблица Panel3D существует в БД
- [ ] Функционал калькулятора работает

---

## 🚨 ПРОБЛЕМЫ И РЕШЕНИЯ

### Проблема: Миграция Panel3D не применяется

**Решение:**
```bash
# Применить миграцию вручную
PGPASSWORD=HVt6G6LE6mduMrAny91F psql -U postgres -d fences \
  -f prisma/migrations/20260324233000_add_panel3d_model/migration.sql

# Проверить создание
PGPASSWORD=HVt6G6LE6mduMrAny91F psql -U postgres -d fences -c "\d Panel3D"
```

### Проблема: PM2 не запускается после деплоя

**Решение:**
```bash
# Проверить логи PM2
pm2 logs fences-app --err

# Проверить порт
netstat -tulpn | grep 3001

# Убить процесс на порту
kill -9 $(lsof -t -i:3001)

# Перезапустить PM2
pm2 restart fences-app
```

### Проблема: 401 ошибка при доступе к Panel3D API

**Решение:**
- Проверьте NEXTAUTH_SECRET в .env
- Проверьте что сессии работают корректно
- Проверьте логи на ошибки аутентификации

### Проблема: БД не обновилась

**Решение:**
```bash
# Проверить миграции
npx prisma migrate status

# Принудительно применить миграцию
npx prisma migrate resolve --applied "20260324233000_add_panel3d_model"

# Пересоздать Prisma Client
npx prisma generate
```

---

## 📞 КОНТАКТЫ И ПОДДЕРЖКА

При проблемах с деплоем:

1. Проверьте логи: `pm2 logs fences-app --lines 200`
2. Проверьте миграции: `npx prisma migrate status`
3. Проверьте БД: `\d Panel3D`
4. Используйте откат: `bash scripts/rollback-to-master.sh`

---

## 📚 ДОПОЛНИТЕЛЬНАЯ ДОКУМЕНТАЦИЯ

- [README.md](README.md) - Общая документация
- [DEPLOYMENT.md](DEPLOYMENT.md) - Руководство по деплою
- [docs/PRODUCTION_DEPLOYMENT.md](docs/PRODUCTION_DEPLOYMENT.md) - Деплой на прод
- [deploy-master2-to-prod.sh](deploy-master2-to-prod.sh) - Оригинальный скрипт деплоя

---

**Создано:** $(date +%Y-%m-%d)
**Версия:** 1.0
**Автор:** DevOps Team