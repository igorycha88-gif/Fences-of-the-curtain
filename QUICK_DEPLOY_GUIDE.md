# 🚀 БЫСТРЫЙ СТАРТ ДЕПЛОЯ MASTER2

## ⚡ Одна команда для запуска:

```bash
bash scripts/deploy-master2-final.sh
```

---

## 📋 Что произойдет:

1. ✅ Проверки перед деплоем (ветка, изменения, SSH)
2. 💾 Резервное копирование (БД, uploads, git state)
3. 📥 Обновление кода (git pull)
4. 🗃️ Миграции БД (prisma migrate)
5. 🔨 Сборка приложения (npm run build)
6. 🔄 Zero-downtime перезапуск (pm2 reload)
7. ✅ Проверка работоспособности (health checks)
8. 📊 Запуск мониторинга (Grafana + Prometheus)

---

## ⏱️ Общее время: ~20-25 минут

---

## 🎯 После деплоя проверить:

### 1. Приложение:
```bash
# Health check
curl http://37.143.13.196:3001/api/health

# Главная страница
curl -I http://37.143.13.196:3001/

# PM2 статус
ssh root@37.143.13.196 "pm2 list"
```

### 2. Email уведомления:
- Зайти в админ-панель: http://37.143.13.196/admin
- Раздел "Получатели уведомлений"
- Добавить email для теста
- Создать тестовый заказ
- Проверить получение email

### 3. Мониторинг (если запущен):
```bash
# Prometheus
curl http://37.143.13.196:9090/-/healthy

# Grafana (потребуется настройка nginx)
curl http://37.143.13.196:3000/api/health
```

---

## 🚨 Откат (если что-то пошло не так):

### Автоматический:
```bash
bash scripts/rollback-to-master.sh
```

### Ручной:
```bash
ssh root@37.143.13.196 << 'EOF'
cd /root/Fences-of-the-curtain
git reset --hard 454bec7
npm ci --legacy-peer-deps
npx prisma generate
npm run build
pm2 restart fences-app
EOF
```

---

## 📞 Контакты:

- **VPS:** root@37.143.13.196 (пароль: *********)
- **БД:** postgres / HVt6G6LE6mduMrAny91F
- **Grafana:** admin / SecureGrafanaPass2026!

---

## 📝 Логи:

- **Деплой:** `/var/log/fences-deploy/deploy-*.log`
- **Приложение:** `pm2 logs fences-app`
- **Бэкапы:** `/root/Fences-of-the-curtain/backups/`

---

## ✅ Чек-лист перед запуском:

- [ ] Я на ветке master2
- [ ] Все изменения закоммичены и запушены
- [ ] Я прочитал DEPLOYMENT_PLAN_MASTER2_FINAL.md
- [ ] У меня есть доступ к VPS
- [ ] Я готов откатить изменения при необходимости

---

**Готовы? Запускайте:**

```bash
bash scripts/deploy-master2-final.sh
```

**Удачи! 🍀**
