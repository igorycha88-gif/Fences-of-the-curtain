# 🚀 Руководство по настройке CI/CD с GitHub Actions

## ✅ Что уже сделано

- ✅ SSH аутентификация вместо пароля (безопаснее)
- ✅ `migrate deploy` вместо `db push` (безопаснее для данных)
- ✅ Backup БД в отдельное место (/backup/fences/)
- ✅ Сжатие бэкапов (gzip)
- ✅ Автоматическая очистка старых бэкапов (90 дней)

---

## 📋 Действия для настройки (15-20 минут)

### Шаг 1: Генерация SSH ключей (локально)

Выполните на вашей машине:

```bash
bash scripts/setup-github-actions-ssh.sh
```

Или вручную:

```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions_deploy_key
```

**Важно:** Не добавляйте пароль к ключу (нажмите Enter при запросе passphrase).

---

### Шаг 2: Добавление публичного ключа на VPS

**Способ А: Автоматический (рекомендуется)**

```bash
scp scripts/setup-vps-for-actions.sh root@37.143.13.196:/root/
ssh root@37.143.13.196 "bash /root/setup-vps-for-actions.sh"
```

**Способ Б: Вручную**

```bash
# Подключитесь к VPS
ssh root@37.143.13.196

# Добавьте публичный ключ
mkdir -p /root/.ssh
cat >> /root/.ssh/authorized_keys << 'EOF'
<Вставьте сюда содержимое ~/.ssh/github_actions_deploy_key.pub>
EOF

chmod 600 /root/.ssh/authorized_keys

# Создайте директорию для бэкапов
sudo mkdir -p /backup/fences
sudo chown postgres:postgres /backup/fences
sudo chmod 700 /backup/fences
```

---

### Шаг 3: Добавление SSH ключа в GitHub Secrets

1. Считайте приватный ключ:
```bash
cat ~/.ssh/github_actions_deploy_key
```

2. Зайдите в GitHub:
```
https://github.com/igorycha88-gif/Fences-of-the-curtain/settings/secrets/actions
```

3. Создайте секрет:
- **Name:** `SSH_PRIVATE_KEY`
- **Value:** Вставьте содержимое приватного ключа (включая строки `-----BEGIN OPENSSH PRIVATE KEY-----` и `-----END OPENSSH PRIVATE KEY-----`)

4. **Удалите старый секрет:**
- Удалите `SSH_PASSWORD` из секретеов

---

### Шаг 4: Проверка миграций

Локально выполните:

```bash
cd "/Users/igor/PycharmProjects/Fences of the curtain"
npx prisma migrate status
```

Вы должны увидеть список миграций, которые применены или ожидают применения.

Если миграции не применены, примените их локально:

```bash
npx prisma migrate dev
```

---

### Шаг 5: Тестирование деплоя

**Тестовое деплой:**

1. Создайте тестовый PR или измените что-то в master
2. Мерж в master должен автоматически:
   - Бампить версию
   - Создать релиз
   - Запустить деплой на VPS

**Ручной деплой:**

Если нужно деплойнуть вручную:

```bash
# На VPS:
cd /root/Fences-of-the-curtain

# Обновление
git pull origin master

# Зависимости
npm install --legacy-peer-deps

# Prisma
npx prisma generate
npx prisma migrate deploy

# Сборка
npm run build

# Рестарт
pm2 reload ecosystem.config.js --env production
```

---

## 🔍 Проверка работоспособности

### 1. Проверка SSH подключения

```bash
ssh -i ~/.ssh/github_actions_deploy_key root@37.143.13.196 "echo 'SSH работает!'"
```

### 2. Проверка миграций на VPS

```bash
ssh root@37.143.13.196 "cd /root/Fences-of-the-curtain && npx prisma migrate status"
```

### 3. Проверка бэкапов

```bash
ssh root@37.143.13.196 "ls -lah /backup/fences/"
```

### 4. Проверка логов деплоя

```bash
ssh root@37.143.13.196 "tail -f /var/log/fences-deploy/deploy.log"
```

---

## 🎯 Как теперь работает деплой

```
PR → merge в master
           ↓
    bump-version.yml
    (auto version + release)
           ↓
    deploy.yml
    (SSH с ключом)
           ↓
    Backup БД → /backup/fences/
           ↓
    Git pull
           ↓
    npm install
           ↓
    prisma generate
           ↓
    npm build
           ↓
    prisma migrate deploy (безопасно!)
           ↓
    PM2 reload
           ↓
    Health check
           ↓
    Успех или Rollback
```

---

## ⚠️ Важные правила

### Для разработчиков:

1. **Всегда создавайте миграции** при изменении schema.prisma:
```bash
npx prisma migrate dev --name "описание_изменения"
```

2. **Никогда не используйте** `prisma db push` в проде!

3. **Коммитьте миграции** в репозиторий вместе с изменениями schema.prisma

4. **Тестируйте миграции** локально перед пушем

### При работе с БД:

- Миграции не удаляют данные (если явно не указано в миграции)
- `migrate deploy` применяет только **новые** миграции
- При проблеме миграции деплой не продолжится

---

## 🛠️ Восстановление из бэкапа

Если нужно восстановить БД:

```bash
# На VPS:
ssh root@37.143.13.196

# Найти нужный бэкап
ls -lah /backup/fences/2026/03/23/

# Восстановить
gunzip < /backup/fences/2026/03/23/backup_HHMMSS.sql.gz | sudo -u postgres psql -U postgres fences
```

---

## 📞 Поддержка

При проблемах:

1. Проверьте логи деплоя: `/var/log/fences-deploy/deploy.log`
2. Проверьте PM2 логи: `pm2 logs fences-app`
3. Проверьте миграции: `npx prisma migrate status`
4. GitHub Actions: Repository → Actions

---

## 🎉 Всё готово!

После выполнения этих шагов ваш деплой будет:
- ✅ Безопаснее (SSH key)
- ✅ Надежнее (migrate deploy)
- ✅ С бэкапами (/backup/fences/)
- ✅ Автоматизирован

Деплойте! 🚀
