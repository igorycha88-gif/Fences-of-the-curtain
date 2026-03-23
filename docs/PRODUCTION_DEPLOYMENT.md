# 🚀 Production Deployment Guide

Быстрый гайд для деплоя приложения на production сервер.

## 📋 Предварительные требования

- ✅ VPS с 4GB+ RAM и 50GB+ SSD
- ✅ Docker и Docker Compose установлены
- ✅ Доменное имя настроено
- ✅ SSL сертификат (Let's Encrypt или свой)

## 🔧 Быстрый деплой (5-10 минут)

### 1. Подключение к серверу

```bash
ssh root@your-server-ip
```

### 2. Клонирование репозитория

```bash
cd /root
git clone <repository-url> Fences-of-the-curtain
cd Fences-of-the-curtain
```

### 3. Настройка окружения

```bash
# Копирование примера .env файла
cp .env.example .env

# Редактирование .env
nano .env
```

**Обязательные переменные:**
```bash
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db:5432/fences"
REDIS_URL="redis://:YOUR_REDIS_PASSWORD@redis:6379"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
NEXTAUTH_URL="https://yourdomain.com"
CRON_SECRET="$(openssl rand -base64 32)"
POSTGRES_PASSWORD="your_strong_password"
REDIS_PASSWORD="your_strong_redis_password"
```

### 4. Генерация Redis пароля

```bash
mkdir -p secrets
openssl rand -base64 32 > secrets/redis_password
chmod 600 secrets/redis_password
```

### 5. Настройка SSL сертификатов

**Способ A: Let's Encrypt (рекомендуется)**
```bash
# Установка certbot
apt install certbot

# Получение сертификата (временно остановить nginx если он запущен)
certbot certonly --standalone -d yourdomain.com

# Копирование сертификатов
mkdir -p ssl
cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ssl/fullchain.pem
cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ssl/privkey.pem
chown -R $USER:$USER ssl
```

**Способ Б: Свои сертификаты**
```bash
mkdir -p ssl
# Скопируйте ваши сертификаты в ssl/fullchain.pem и ssl/privkey.pem
```

### 6. Запуск контейнеров

```bash
# Запуск в фоне
docker-compose up -d

# Проверка статуса
docker-compose ps
```

### 7. Применение миграций

```bash
# Применение миграций (безопасно)
docker-compose exec app npx prisma migrate deploy

# Заполнение тестовыми данными (опционально)
docker-compose exec app npm run db:seed
```

### 8. Проверка работоспособности

```bash
# Проверка логов приложения
docker-compose logs -f app

# Проверка здоровья приложения
curl http://localhost:3001/

# Проверка HTTPS (если домен настроен)
curl https://yourdomain.com/
```

## 🔒 Настройка Firewall

```bash
# Разрешить SSH
ufw allow 22/tcp

# Разрешить HTTP/HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Включить firewall
ufw enable

# Проверка статуса
ufw status
```

## 📊 Мониторинг

```bash
# Просмотр логов всех сервисов
docker-compose logs -f

# Проверка статуса сервисов
docker-compose ps

# Ресурсы контейнеров
docker stats
```

## 🔄 Обновление приложения

### Автоматический деплой (рекомендуется)

1. Создайте PR в master
2. CI проверит качество кода
3. После merge автоматически произойдет деплой

### Ручной деплой

```bash
cd /root/Fences-of-the-curtain

# Получение последних изменений
git pull origin master

# Пересборка контейнеров
docker-compose down
docker-compose build
docker-compose up -d

# Применение миграций
docker-compose exec app npx prisma migrate deploy
```

## 💾 Бэкап БД

### Создание бэкапа

```bash
BACKUP_DIR="/backup/fences/$(date +%Y/%m/%d)"
mkdir -p "$BACKUP_DIR"
docker exec fences-db pg_dump -U postgres fences | gzip > "$BACKUP_DIR/backup_$(date +%H%M%S).sql.gz"
```

### Восстановление из бэкапа

```bash
# Нахождение нужного бэкапа
ls -lah /backup/fences/2026/03/23/

# Восстановление
gunzip < /backup/fences/2026/03/23/backup_HHMMSS.sql.gz | docker exec -i fences-db psql -U postgres fences
```

### Автоматический бэкап (cron)

```bash
# Редактирование crontab
crontab -e

# Добавить строку для ежедневного бэкапа в 2:00
0 2 * * * mkdir -p /backup/fences/$(date +\%Y/\%m/\%d) && docker exec fences-db pg_dump -U postgres fences | gzip > /backup/fences/$(date +\%Y/\%m/\%d)/backup_$(date +\%H\%M\%S).sql.gz
```

## 🔍 Решение проблем

### Контейнер не запускается

```bash
# Проверка логов
docker-compose logs app

# Проверка статуса
docker-compose ps

# Пересоздание контейнера
docker-compose down
docker-compose up -d
```

### Ошибка подключения к БД

```bash
# Проверка статуса БД
docker-compose exec db pg_isready

# Проверка подключения к БД
docker-compose exec app npx prisma db pull
```

### Ошибка подключения к Redis

```bash
# Проверка статуса Redis
docker-compose exec redis redis-cli ping

# Если нужно с паролем
docker-compose exec redis redis-cli -a YOUR_REDIS_PASSWORD ping
```

### Ошибка миграций

```bash
# Проверка статуса миграций
docker-compose exec app npx prisma migrate status

# Применение миграций
docker-compose exec app npx prisma migrate deploy
```

## 📝 Проверка здоровья

```bash
# Проверка приложения
curl http://localhost:3001/

# Проверка API
curl http://localhost:3001/api/health

# Проверка БД
docker-compose exec db psql -U postgres -c "SELECT 1"

# Проверка Redis
docker-compose exec redis redis-cli ping
```

## 🔐 Безопасность

- ✅ PostgreSQL порт НЕ открыт извне (только Docker сеть)
- ✅ Redis работает с аутентификацией
- ✅ SSL/TLS включен для HTTPS
- ✅ Firewall настроен
- ✅ Проверяйте логи регулярно: `docker-compose logs -f`

## 📞 Поддержка

При проблемах:
1. Проверьте логи: `docker-compose logs -f`
2. Проверьте статус: `docker-compose ps`
3. GitHub Actions: Repository → Actions
4. Документация: `docs/` и `DEPLOYMENT.md`
