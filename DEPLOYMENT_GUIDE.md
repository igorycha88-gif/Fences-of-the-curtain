# Production Deployment Guide

## Required GitHub Secrets

Configure these secrets in your GitHub repository settings:

### Required for Deployment:
- **SSH_PASSWORD**: SSH password for server access
- **SSH_HOST**: Server IP address (e.g., 37.143.13.196)
- **SSH_PORT**: SSH port (default: 22)

### Server Environment Variables (set on VPS in `/root/Fences-of-the-curtain/.env`):

```bash
# Required (App will NOT start without valid values):
NEXTAUTH_SECRET=$(openssl rand -base64 32)
NEXTAUTH_URL=https://yourdomain.com
DATABASE_URL=postgresql://postgres:password@localhost:5432/fences
REDIS_URL=redis://:password@localhost:6379

# Optional but recommended:
CRON_SECRET=$(openssl rand -base64 32)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_CHAT_ID=your-chat-id
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your-site-key
RECAPTCHA_SECRET_KEY=your-secret-key
NEXT_PUBLIC_YANDEX_METRIKA_ID=your-metrika-id
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=your-analytics-id
NEXT_PUBLIC_YANDEX_MAPS_API_KEY=your-maps-api-key

# Security:
POSTGRES_PASSWORD=strong-postgres-password
REDIS_PASSWORD=strong-redis-password
```

## Quick Fix for Production Issues

### 1. Run Diagnostics on Server:
```bash
cd /root/Fences-of-the-curtain
bash scripts/diagnose.sh
```

### 2. Fix Port Mismatch:
Already fixed in docker/nginx.conf:
- Next.js runs on port 3001
- Nginx proxies to port 3001
- Health check checks port 3001

### 3. Setup SSL Certificates:
```bash
# On server, run:
bash scripts/setup-ssl.sh yourdomain.com
```

### 4. Setup Database Backups:
```bash
# Add to crontab:
0 2 * * * /root/Fences-of-the-curtain/scripts/backup-db.sh

# Manual backup:
bash scripts/backup-db.sh
```

### 5. Deploy Changes:
```bash
# Push to GitHub and trigger deployment via:
# Repository dispatch event or manual workflow trigger
```

## Security Best Practices

1. **Never commit .env files** - use server environment variables
2. **Use strong passwords** - generate with: `openssl rand -base64 32`
3. **Enable SSL** - use Let's Encrypt certificates
4. **Regular backups** - automated daily backups with 30-day retention
5. **Monitor logs** - check `/var/log/fences-app/` and `/var/log/fences-deploy/`

## Troubleshooting

### Application not responding:
```bash
pm2 logs fences-app --lines 100
pm2 restart fences-app
```

### Database issues:
```bash
sudo -u postgres psql -d fences
sudo systemctl restart postgresql
```

### Redis issues:
```bash
redis-cli ping
sudo systemctl restart redis
```

### Nginx issues:
```bash
nginx -t
sudo systemctl reload nginx
```

### Port conflicts:
```bash
netstat -tlnp | grep -E ':(3000|3001|80|443)'
```

## Monitoring

Check logs:
- Application: `/var/log/fences-app/error.log`
- Deployment: `/var/log/fences-deploy/deploy.log`
- Database: `/var/log/postgresql/`
- Nginx: `/var/log/nginx/`

## Rollback

If deployment fails, rollback is automatic. Manual rollback:
```bash
cd /root/Fences-of-the-curtain
git tag  # list backup tags
git reset --hard deploy-backup-YYYYMMDDHHMMSS
npm install --legacy-peer-deps
npx prisma generate
npm run build
pm2 reload ecosystem.config.js --env production
```
