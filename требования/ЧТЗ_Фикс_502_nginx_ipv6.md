# ЧТЗ: Фикс интермитентных 502 ошибок на проде (nginx → IPv6 loopback)

**Дата:** 2026-08-25
**Маршрут:** 3 (Инфраструктурная задача: Аналитик → DevOps)
**Исполнитель:** DevOps

---

## 1. Описание проблемы

Пользователь сообщил: «сайт не работает на проде».

### Диагностика

| Проверка | Результат |
|----------|-----------|
| HTTPS (443) с 5 внешних нод (check-host.net) | ✅ TCP OK (ES, IT, ID×2, RU) |
| Приложение напрямую `:3001/api/health` | ✅ 200 OK |
| HTTP (80) | ✅ 301 → https |
| Сертификат Let's Encrypt | ✅ валиден до 2026-11-19 |
| nginx | ✅ active, config test OK |
| Логи nginx error.log | ❌ `connect() failed (111: ECONNREFUSED) while connecting to upstream, upstream: "http://[::1]:3001/"` — многократно за день, от реальных пользователей |

### Корневая причина

В `/etc/nginx/sites-enabled/fences`:
```nginx
proxy_pass http://localhost:3001;
```

В `/etc/hosts` имя `localhost` резолвится в **обе** записи: `127.0.0.1` И `::1`.
Приложение (next-server) слушает **только IPv4** (`0.0.0.0:3001`).

Когда nginx выбирает `::1` → connect падает с ECONNREFUSED (111) → пользователь получает **502 Bad Gateway**. Ошибка интермитентная (зависит от того, какой адрес выбрал nginx).

При этом в `/etc/nginx/conf.d/fences-upstream.conf` уже существует корректный upstream-блок, который **не используется**:
```nginx
upstream app {
    server 127.0.0.1:3001;
    keepalive 32;
}
```

## 2. Что нужно сделать

1. В `/etc/nginx/sites-enabled/fences` заменить `proxy_pass http://localhost:3001;` → `proxy_pass http://app;` (использовать существующий upstream с keepalive)
2. `nginx -t` → `nginx -s reload` (reload не роняет соединения)

## 3. Критерии приёмки

- [x] `proxy_pass` указывает на upstream `app` (127.0.0.1:3001), не на `localhost`
- [x] `nginx -t` проходит (без warnings после переноса бэкапа)
- [x] После reload: `curl https://zabor-i-naves.ru` → 200
- [x] В error.log отсутствуют новые `connect() failed (111) ... [::1]:3001` (за 2 мин: 0)
- [x] 30/30 последовательных HTTPS-запросов → 200, без 502
- [x] Внешние ноды (FI, RO, RU, SI): HTTPS 200

**Статус: ВЫПОЛНЕНО 25.08.2026**

## 4. Файлы для изменения

- `/etc/nginx/sites-enabled/fences` (на VPS 37.143.13.196) — 1 строка

## 5. Риски

- Минимальные: nginx reload плавный, existing upstream блок уже протестирован конфигом
- Откат: вернуть `proxy_pass http://localhost:3001;` + reload
