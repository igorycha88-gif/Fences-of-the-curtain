# ✅ Чек-лист: Настройка CI/CD

## 🎯 Что нужно сделать (5 шагов, 15-20 минут)

### 1️⃣ Генерация SSH ключей (2 минуты)
```bash
bash scripts/setup-github-actions-ssh.sh
```

### 2️⃣ Добавление ключа на VPS (5 минут)
```bash
scp scripts/setup-vps-for-actions.sh root@37.143.13.196:/root/
ssh root@37.143.13.196 "bash /root/setup-vps-for-actions.sh"
```

### 3️⃣ Добавление приватного ключа в GitHub (3 минуты)
1. `cat ~/.ssh/github_actions_deploy_key`
2. GitHub → Settings → Secrets → New secret
3. Name: `SSH_PRIVATE_KEY`
4. Value: <приватный ключ>
5. ❌ Удалить `SSH_PASSWORD`

### 4️⃣ Проверка миграций (2 минуты)
```bash
npx prisma migrate status
```

### 5️⃣ Тест деплоя (2 минуты)
Сделайте тестовый PR в master → проверьте GitHub Actions

---

## ✅ Результат

- ✅ SSH key вместо пароля
- ✅ Safe migrations (migrate deploy)
- ✅ Backup в /backup/fences/
- ✅ Готово к деплою!

Подробности: [docs/CICD_SETUP_GUIDE.md](./CICD_SETUP_GUIDE.md)
