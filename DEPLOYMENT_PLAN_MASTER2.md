# 🚀 ПЛАН БЕЗОПАСНОГО СЛИЯНИЯ MASTER2 С ПРОДОМ

**Дата:** 31.03.2026  
**Версия на проде:** master2 (коммит 831bbba)  
**Статус:** ⚠️ Требуется применение миграции

---

## 📊 АНАЛИЗ СИТУАЦИИ

### ✅ Что УЖЕ сделано на проде:
1. Код обновлен до ветки **master2**
2. Миграции применены (Panel3D, PicketProfile, PicketCoating)
3. БД PostgreSQL 14 работает локально
4. PM2 запускает приложение fences-app

### ❌ ПРОБЛЕМА:
**Отсутствуют поля picket* в таблице FenceEstimate**

```
Ошибка: The column `FenceEstimate.picketNomenclatureId` does not exist
Результат: 68 рестартов приложения
```

### 🔍 Причина:
Миграция `20260324233000_add_panel3d_model` добавила поля panel3d*, но НЕ добавила picket-поля. Schema.prisma содержит эти поля, но в БД их нет.

---

## 🎯 ПЛАН ДЕЙСТВИЙ

### Шаг 1: Подготовка (локально)
```bash
# Проверить, что мы на ветке master2
git branch --show-current

# Убедиться, что код актуален
git pull origin master2

# Проверить наличие новой миграции
ls -la prisma/migrations/20260331230000_add_picket_fields_to_fence_estimate/
```

### Шаг 2: Применение миграции на проде
```bash
# Выполнить скрипт безопасного применения
bash scripts/apply-picket-migration.sh
```

**Что делает скрипт:**
1. ✅ Создает полный бэкап БД
2. ✅ Пушит изменения в GitHub
3. ✅ Обновляет код на VPS
4. ✅ Применяет миграцию вручную
5. ✅ Генерирует Prisma Client
6. ✅ Перезапускает PM2
7. ✅ Проверяет работоспособность
8. ✅ Показывает статус колонок

### Шаг 3: Верификация
```bash
# Подключиться к VPS
ssh root@37.143.13.196

# Проверить статус PM2
pm2 list

# Проверить логи
pm2 logs fences-app --lines 50

# Проверить колонки в БД
sudo -u postgres psql -d fences -c "
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'FenceEstimate' 
AND column_name LIKE 'picket%'
ORDER BY column_name;
"

# Проверить API
curl -I http://localhost:3001/
```

---

## 🔄 ВОЗМОЖНОСТЬ ОТКАТА

### Автоматический откат:
```bash
# Скрипт отката миграции
bash scripts/rollback-picket-migration.sh
```

### Ручной откат:
```bash
ssh root@37.143.13.196

# Остановить приложение
pm2 stop fences-app

# Восстановить БД из бэкапа
sudo -u postgres dropdb fences
sudo -u postgres createdb fences
gunzip -c /var/www/backups/db_before_picket_migration_*.sql.gz | sudo -u postgres psql fences

# Откатить код на master
cd /var/www/fences-of-the-curtain
git checkout master
npm ci
npx prisma generate
npm run build

# Запустить приложение
pm2 start fences-app
```

---

## 📋 ЧЕК-ЛИСТ ПЕРЕД ДЕПЛОЕМ

- [ ] Убедиться, что на локали все тесты проходят
- [ ] Проверить, что ветка master2 актуальна
- [ ] Убедиться, что есть SSH доступ к VPS
- [ ] Проверить свободное место на VPS (df -h)
- [ ] Убедиться, что бэкапы будут созданы

---

## 🔧 ТЕХНИЧЕСКИЕ ДЕТАЛИ

### Новые поля в FenceEstimate:
```sql
picketNomenclatureId     TEXT
picketNomenclatureName   TEXT
picketTotal              DOUBLE PRECISION DEFAULT 0
picketStep               INTEGER
picketMountingType       TEXT
picketProfileType        TEXT
picketCoatingName        TEXT
```

### Поля Panel3D (уже применены):
```sql
panel3dId                TEXT
panel3dNomenclatureName  TEXT
panel3dTotal             DOUBLE PRECISION DEFAULT 0
panel3dInstallationTotal DOUBLE PRECISION DEFAULT 0
```

### Связанные таблицы:
- ✅ Panel3D - создана
- ✅ PicketProfileType - создана и заполнена
- ✅ PicketCoating - создана и заполнена

---

## 🚨 КРИТИЧЕСКИЕ МОМЕНТЫ

1. **Бэкап БД ОБЯЗАТЕЛЕН** перед любыми изменениями
2. **Проверка логов** после применения миграции
3. **Мониторинг PM2** - если рестарты продолжатся, откатываем
4. **Проверка API** - убедиться, что приложение отвечает

---

## 📊 МОНИТОРИНГ ПОСЛЕ ДЕПЛОЯ

### В течение 5 минут:
```bash
# Следить за логами в реальном времени
ssh root@37.143.13.196 'pm2 logs fences-app --lines 0'
```

### В течение 1 часа:
- Проверить количество рестартов: `pm2 list` (колонка ↺)
- Проверить потребление памяти: `pm2 monit`
- Проверить логи на ошибки: `pm2 logs fences-app --err`

### В течение 24 часов:
- Мониторинг производительности
- Проверка работы калькулятора
- Тестирование создания estimates

---

## 🎯 КРИТЕРИИ УСПЕХА

1. ✅ PM2 статус: **online**
2. ✅ Количество рестартов не увеличивается
3. ✅ Нет ошибок в логах
4. ✅ API отвечает (HTTP 200)
5. ✅ Калькулятор работает
6. ✅ Колонки picket* существуют в БД

---

## 📞 КОНТАКТЫ ДЛЯ ЭКСТРЕННЫХ СИТУАЦИЙ

**VPS доступ:**
- Host: 37.143.13.196
- User: root
- Password: (см. .env)

**Бэкапы:**
- Локация: /var/www/backups/
- Retention: проверить настройки

**GitHub:**
- Repo: git@github.com:igorycha88-gif/Fences-of-the-curtain.git
- Ветка: master2

---

## ⚡ БЫСТРЫЙ СТАРТ

```bash
# 1. Проверить готовность
git status

# 2. Запустить деплой
bash scripts/apply-picket-migration.sh

# 3. Проверить результат
ssh root@37.143.13.196 'pm2 list && pm2 logs fences-app --lines 20'
```

---

**Время выполнения:** ~5-10 минут  
**Downtime:** ~30-60 секунд (перезапуск PM2)  
**Риск:** Минимальный (есть бэкапы и откат)
