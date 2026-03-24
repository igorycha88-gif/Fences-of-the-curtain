# 🧪 План тестирования DevOps Optimizations Stage 1

## ✅ Чек-лист активации

### 1. Workflow активирован
- [x] `.github/workflows/deploy-production.yml` - оптимизированная версия
- [x] `.github/workflows/deploy-production.yml.backup` - оригинальная версия

### 2. Изменения закоммичены
- [x] Commit: `feat: activate optimized production deployment workflow`

---

## 🚋 Тестирование локально

### Тест 1: Smoke Tests

```bash
# Убедитесь, что dev сервер запущен
npm run dev

# В новом терминале запустите smoke tests
./scripts/smoke-test.sh http://localhost:3001
```

**Ожидаемый результат:** Все тесты должны пройти ✓

### Тест 2: Cache скрипт

```bash
# Проверьте статус кэша
./scripts/cache-node-modules.sh status

# Сохраните node_modules в кэш
./scripts/cache-node-modules.sh save

# Удалите node_modules
rm -rf node_modules

# Восстановите из кэша
./scripts/cache-node-modules.sh restore

# Проверьте, что node_modules восстановлен
ls -la node_modules/
```

**Ожидаемый результат:** 
- Кэш создается успешно
- Восстановление работает
- node_modules содержит все файлы

### Тест 3: Migration скрипт

```bash
# Проверьте статус миграций
./scripts/migrate-rollback.sh status

# Посмотрите список миграций
./scripts/migrate-rollback.sh list
```

**Ожидаемый результат:** Статус показывается корректно

---

## 🌐 Тестирование на сервере

### Подготовка сервера

```bash
# SSH на сервер
ssh root@37.143.13.196

# Перейдите в проект
cd /root/Fences-of-the-curtain

# Обновите код
git pull origin master

# Сделайте скрипты исполняемыми
chmod +x scripts/cache-node-modules.sh
chmod +x scripts/migrate-rollback.sh

# Создайте директорию для кэша
mkdir -p .cache

# Проверьте текущий PM2 конфиг
pm2 list
```

### Тест 4: Smoke Tests на сервере

```bash
# Запустите smoke tests
./scripts/smoke-test.sh http://localhost:3001
```

**Ожидаемый результат:** Все тесты проходят ✓

### Тест 5: Кэш на сервере

```bash
# Сохраните текущий node_modules
./scripts/cache-node-modules.sh save

# Проверьте статус
./scripts/cache-node-modules.sh status
```

**Ожидаемый результат:** Кэш создан, показан размер

### Тест 6: PM2 перезапуск

```bash
# Перезагрузите приложение
pm2 reload ecosystem.config.js --env production

# Проверьте логи
pm2 logs fences-app --lines 50

# Проверьте статус
pm2 list
pm2 info fences-app
```

**Ожидаемый результат:** 
- Приложение перезапускается без ошибок
- Память ~1GB
- Статус: online

---

## 🔥 Тестирование деплоя (через GitHub Actions)

### Тест 7: Manual Deploy

1. Откройте GitHub Actions: https://github.com/[your-username]/[repo]/actions

2. Найдите workflow: "Deploy to Production (Optimized)"

3. Нажмите "Run workflow" → "Run workflow"

4. Выберите branch: `master`

5. Добавьте reason: "Testing optimized deployment"

6. Нажмите "Run workflow"

### Мониторинг деплоя

```bash
# На сервере следите за логами
tail -f /var/log/fences-deploy/deploy-production.log

# Или проверьте логи через GitHub Actions UI
```

**Ожидаемый результат:**
- ✅ Pre-deploy checks проходят
- ✅ npm install быстрее (с кэшем)
- ✅ Build проходит успешно
- ✅ Миграции применяются (без `--accept-data-loss`)
- ✅ PM2 перезапускается
- ✅ Health checks проходят
- ✅ Общее время: 1-2 минуты

### Тест 8: Rollback тест (опционально)

```bash
# Создайте故意 failing commit
echo "FAIL" > test.txt
git add test.txt
git commit -m "test: failing commit"
git push origin master

# Дождитесь деплоя (он должен откатиться)
# Или остановите деплой вручную

# После неудачного деплоя проверьте:
tail -50 /var/log/fences-deploy/deploy-production.log

# Приложение должно быть в рабочем состоянии
pm2 list
curl http://localhost:3001/
```

**Ожидаемый результат:** 
- Деплой распознает ошибку
- Rollback выполняется автоматически
- Приложение остается работоспособным

---

## 📊 Измерение результатов

### До оптимизаций (базовые метрики)

```bash
# Время деплоя
# Посмотрите предыдущие деплои в логах
grep "DEPLOY RESULT" /var/log/fences-deploy/deploy-production.log | tail -5

# Время npm install (посмотрите в логах)
grep "Dependencies installed" /var/log/fences-deploy/deploy-production.log | tail -5
```

### После оптимизаций

```bash
# Время деплоя
grep "Total deployment time" /var/log/fences-deploy/deploy-production.log | tail -1

# Время npm install
grep "Dependencies installed" /var/log/fences-deploy/deploy-production.log | tail -1
```

### Сравнительная таблица

| Метрика | До | После | Улучшение |
|---------|----|----|----------|
| npm install | _сек | _сек | _% |
| Build | _сек | _сек | _% |
| Итого | _мин | _мин | _% |

---

## ✅ Критерии успеха

### Минимум (MVP)
- [ ] Деплой проходит без ошибок
- [ ] Приложение работает после деплоя
- [ ] Smoke tests проходят
- [ ] PM2 перезапускается корректно

### Хорошо
- [ ] Время деплоя уменьшилось на ~30%
- [ ] npm install быстрее на ~50%
- [ ] Кэш работает
- [ ] Логи детальные и понятные

### Отлично
- [ ] Время деплоя < 2 минут
- [ ] npm install < 30 секунд
- [ ] Rollback работает автоматически
- [ ] Метрики собираются

---

## 🆘 Troubleshooting

### Деплой застрял

```bash
# Проверьте GitHub Actions status
# Проверьте логи на сервере
tail -100 /var/log/fences-deploy/deploy-production.log

# Проверьте PM2
pm2 list
pm2 logs fences-app

# Если нужно - ручной rollback
./scripts/rollback.sh <commit-hash>
```

### Кэш не работает

```bash
# Проверьте права доступа
ls -la .cache/

# Проверьте место на диске
df -h

# Очистите кэш и создайте заново
./scripts/cache-node-modules.sh clear
./scripts/cache-node-modules.sh save
```

### Миграции не применяются

```bash
# Проверьте статус
./scripts/migrate-rollback.sh status

# Проверьте базу данных
sudo -u postgres psql -U postgres -d fences

# Ручное применение миграций
npx prisma migrate deploy
```

---

## 📝 Отчет о тестировании

После тестирования заполните:

```
## Результаты тестирования

### Успешные тесты:
- [ ] Smoke tests (local) - ✓
- [ ] Cache script - ✓
- [ ] Migration script - ✓
- [ ] Smoke tests (server) - ✓
- [ ] PM2 restart - ✓
- [ ] Deploy via GitHub Actions - ✓

### Метрики:
- Время деплоя до: _ мин
- Время деплоя после: _ мин
- Улучшение: _%

### Проблемы:
_описание проблем_

### Вывод:
_общий вывод_
```

---

## 🎯 Следующие шаги

После успешного тестирования:

1. ✅ Активировать workflow на production (пуш в master)
2. ✅ Мониторить следующие деплои
3. ✅ Собирать метрики
4. ✅ Переходить к Этапу 2: Staging окружение

---

**Версия:** 1.0.0  
**Дата:** 2026-03-24
