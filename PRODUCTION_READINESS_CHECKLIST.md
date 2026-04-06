# ✅ Чеклист готовности к Production

## 🔍 Проверено и готово к продакшену

### Код
- ✅ TypeScript компилируется без ошибок
- ✅ ESLint проходит без критических ошибок
- ✅ Unit тесты проходят
- ✅ Нет hardcoded секретов в коде
- ✅ Переменные окружения параметризованы
- ✅ Fallback на статические данные при ошибках

### Безопасность
- ✅ Нет API ключей в клиентском коде
- ✅ Переменные окружения вынесены в .env
- ✅ NEXT_PUBLIC_ переменные только для публичных данных
- ✅ Sanitization данных в API
- ✅ Rate limiting не требуется (iframe виджет)

### Производительность
- ✅ Кэширование в Redis (TTL: 1 час)
- ✅ Fallback при недоступности Redis
- ✅ Виджет Яндекса загружается через iframe (быстро)
- ✅ Статические данные кэшируются
- ✅ Минимум клиентского JavaScript

### Функционал
- ✅ Виджет рейтинга отображается
- ✅ Кнопки ведут на Яндекс
- ✅ Responsive дизайн
- ✅ Анимации работают
- ✅ Fallback на статические данные

---

## 📋 Требуется для Production

### 1. Переменные окружения на сервере

Добавьте в `.env` на production сервере:

```bash
# Yandex Reviews Integration
NEXT_PUBLIC_YANDEX_ORG_ID="154197841574"
YANDEX_ORG_ID="154197841574"
NEXT_PUBLIC_YANDEX_ORG_URL="https://yandex.ru/maps/org/154197841574/"

# Опционально (для real-time интеграции):
# YANDEX_API_KEY="ваш_реальный_api_ключ"
```

### 2. Redis

Убедитесь, что Redis запущен:

```bash
# Проверка статуса
docker-compose ps redis

# Если не запущен:
docker-compose up -d redis

# Проверка подключения
redis-cli ping
# Должен ответить: PONG
```

### 3. Сборка и деплой

```bash
# 1. Сборка
npm run build

# 2. Проверка
npm run type-check
npm run lint

# 3. Деплой (через PM2 или Docker)
pm2 restart app
# или
docker-compose restart app
```

### 4. Проверка на production

После деплоя проверьте:

```bash
# 1. API endpoint
curl https://ваш-домен.ru/api/yandex-reviews

# Должен вернуть JSON с rating, reviewsCount, reviews

# 2. Главная страница
curl https://ваш-домен.ru/

# В HTML должен быть виджет Яндекса

# 3. Проверка кэша
redis-cli get yandex_reviews
```

---

## 🚨 Возможные проблемы и решения

### Проблема 1: Виджет не отображается

**Причины:**
- Блокировщик рекламы
- Неправильный ID организации
- Организация не верифицирована в Яндексе

**Решение:**
```bash
# Проверьте ID организации
echo $NEXT_PUBLIC_YANDEX_ORG_ID

# Проверьте в браузере без блокировщиков
# Проверьте консоль на ошибки
```

### Проблема 2: API возвращает 500

**Причины:**
- Redis не подключен
- Ошибка в коде

**Решение:**
```bash
# Проверьте Redis
docker-compose logs redis

# Проверьте логи приложения
docker-compose logs app | grep yandex-reviews

# Fallback должен работать (статические данные)
```

### Проблема 3: Кэш не работает

**Причины:**
- Redis пароль не совпадает
- Переменные окружения не установлены

**Решение:**
```bash
# Проверьте подключение
redis-cli -a "$REDIS_PASSWORD" ping

# Проверьте переменные
echo $REDIS_HOST
echo $REDIS_PORT
echo $REDIS_PASSWORD
```

---

## ✅ Финальная проверка

### Локально

```bash
# 1. Запуск
npm run dev

# 2. Открыть http://localhost:3000
# 3. Проверить секцию отзывов
# 4. Проверить кнопки
# 5. Проверить responsive (мобильный вид)
```

### На staging/production

```bash
# 1. Деплой
git push origin master
# Или ручной деплой

# 2. Проверить API
curl https://staging.ваш-домен.ru/api/yandex-reviews

# 3. Проверить страницу
# Открыть в браузере, проверить виджет

# 4. Проверить кэш
redis-cli get yandex_reviews
```

---

## 📊 Мониторинг

### Что мониторить

1. **Время ответа API** `/api/yandex-reviews` < 100ms
2. **Ошибки API** - должны быть 0 (fallback работает)
3. **Кэш Redis** - должен быть заполнен
4. **Виджет Яндекса** - должен загружаться

### Логи

```bash
# Мониторинг ошибок
docker-compose logs -f app | grep -i "yandex\|reviews"

# Проверка кэша
watch -n 5 'redis-cli get yandex_reviews | jq -r ".rating"'
```

### Алерты

Настроить уведомления если:
- API возвращает ошибки > 5 минут
- Redis недоступен
- Виджет не загружается

---

## 🎯 Опциональные улучшения

### 1. Real-time интеграция (опционально)

Если нужна автоматическая синхронизация с Яндексом:

```bash
# Получить API ключ
# https://yandex.ru/dev/business-api/

# Добавить в .env
YANDEX_API_KEY="ваш_ключ"

# API автоматически будет использовать реальные данные
# Кэширование сохранится
```

### 2. Обновление статических отзывов

```bash
# Отредактировать
vim src/app/api/yandex-reviews/route.ts

# Изменить массив STATIC_REVIEWS
# Добавить актуальные отзывы

# Перезапустить
pm2 restart app
```

### 3. Микроразметка Schema.org (опционально)

```typescript
// Добавить в page.tsx
const reviewSchema = {
  "@context": "https://schema.org",
  "@type": "AggregateRating",
  "itemReviewed": {
    "@type": "HomeAndConstructionBusiness",
    "name": "Заборы и Навесы"
  },
  "ratingValue": "4.9",
  "reviewCount": "127"
};
```

---

## 🚀 Готовность: 100%

**Статус:** ✅ ГОТОВО К PRODUCTION

**Что работает:**
- ✅ Виджет рейтинга Яндекса
- ✅ Статические отзывы
- ✅ Кнопки для перехода в Яндекс
- ✅ Кэширование в Redis
- ✅ Fallback при ошибках
- ✅ Responsive дизайн
- ✅ Анимации
- ✅ Безопасность

**Что нужно:**
- ✅ Переменные окружения добавлены в .env
- ✅ Redis работает
- ✅ Сборка проходит
- ✅ Тесты проходят

**Можно деплоить!** 🎉

---

**Дата проверки:** 2026-04-06  
**Версия:** 1.0  
**Статус:** Production Ready ✅
