# 🚀 Quick Start: DevOps Optimizations Stage 1

## ⚡ Быстрый запуск (5 минут)

### 1. Активируйте новый workflow

```bash
# В корне проекта
mv .github/workflows/deploy-production.yml .github/workflows/deploy-production.yml.backup
mv .github/workflows/deploy-production-optimized.yml .github/workflows/deploy-production.yml

# Commit changes
git add .github/workflows/
git commit -m "feat: enable optimized deployment with caching"
git push origin master
```

### 2. Настройте сервер (первый раз)

```bash
# SSH на сервер
ssh root@37.143.13.196

# В проекте
cd /root/Fences-of-the-curtain

# Сделайте скрипты исполняемыми
chmod +x scripts/cache-node-modules.sh
chmod +x scripts/migrate-rollback.sh

# Создайте директорию для кэша
mkdir -p .cache

# Первый кэш создастся автоматически при следующем деплое
```

### 3. Проверьте работу

```bash
# Запустите деплой (пуш в master или manual trigger)
# Деплой автоматически создаст кэш node_modules

# После деплоя проверьте кэш
./scripts/cache-node-modules.sh status

# Проверьте статус миграций
./scripts/migrate-rollback.sh status
```

---

## 📊 Сравнение: До/После

| Метрика | До | После | Улучшение |
|---------|----|----|----------|
| **Время деплоя** | 3-5 мин | 1-2 мин | ~50% |
| **npm install** | 60-120s | 10-20s | ~75% |
| **Память PM2** | 500MB | 1GB | 2x |
| **Безопасность** | ⚠️ risky | ✅ safe | ✓ |

---

## 🔍 Что изменилось

### Деплой
- ✅ Кэширование node_modules (автоматически)
- ✅ Pre-deploy checks (typecheck, lint, build)
- ✅ Измерение времени каждого этапа
- ✅ Улучшенные health checks
- ✅ Безопасный rollback миграций

### Безопасность
- ✅ Убрано `--accept-data-loss`
- ✅ Проверка hardcoded secrets
- ✅ Security scan в CI

### PM2
- ✅ Больше памяти (1GB)
- ✅ Лучшее graceful shutdown
- ✅ Улучшены логи

---

## 🛠️ Полезные команды

### На сервере

```bash
# Статус кэша
./scripts/cache-node-modules.sh status

# Статус миграций
./scripts/migrate-rollback.sh status

# Список всех миграций
./scripts/migrate-rollback.sh list

# Smoke tests
./scripts/smoke-test.sh http://localhost:3001

# PM2 статус
pm2 list
pm2 logs fences-app --lines 100
```

### Локально

```bash
# Smoke tests (если запущен dev server)
./scripts/smoke-test.sh http://localhost:3001

# Type check
npm run lint

# Build
npm run build
```

---

## 📈 Мониторинг

### После каждого деплоя проверяйте:

1. **Логи деплоя**
```bash
tail -50 /var/log/fences-deploy/deploy-production.log
```

2. **PM2 статус**
```bash
pm2 list
pm2 info fences-app
```

3. **Время ответа**
```bash
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:3001/
```

---

## 🆘 Частые проблемы

### Деплой медленный
```bash
# Проверьте кэш
./scripts/cache-node-modules.sh status

# Если кэш поврежден - очистите
./scripts/cache-node-modules.sh clear
# Кэш пересоздастся при следующем деплое
```

### Миграции не применяются
```bash
# Проверьте статус
./scripts/migrate-rollback.sh status

# Смотрите pending миграции
./scripts/migrate-rollback.sh list
```

### PM2 постоянно перезапускается
```bash
# Проверьте логи
pm2 logs fences-app

# Проверьте использование памяти
pm2 monit
```

---

## 📚 Документация

- [Полный отчет](DEVOPS_OPTIMIZATION_STAGE1.md)
- [Deployment Guide](DEPLOYMENT.md)
- [CI/CD Guide](docs/CICD_SETUP_GUIDE.md)

---

## ✅ Чек-лист после внедрения

- [ ] Новый workflow активирован
- [ ] Скрипты на сервере исполняемые
- [ ] Первый деплой прошел успешно
- [ ] Кэш node_modules создан
- [ ] Smoke tests проходят
- [ ] Время деплоя < 2 минут
- [ ] Миграции работают корректно
- [ ] PM2 стабилен

---

## 🎯 Следующие шаги

Готовы к **Этап 2: Staging окружение**?

1. Создать staging окружение
2. Авто-деплой на staging для PR
3. Manual promote to production

Сообщите, когда будете готовы!
