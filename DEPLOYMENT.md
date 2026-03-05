# Deployment Guide

## Prerequisites

- VPS/VDS with minimum 4GB RAM and 50GB SSD
- Docker and Docker Compose installed
- Domain name configured
- SSL certificate (Let's Encrypt recommended)

## Deployment Steps

### 1. Server Setup

Login to your server and update packages:

```bash
ssh user@your-server-ip
sudo apt update && sudo apt upgrade -y
```

Install Docker and Docker Compose:

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. Clone Repository

```bash
git clone <repository-url> /opt/fences-curtain
cd /opt/fences-curtain
```

### 3. Configure Environment

```bash
cp .env.example .env
nano .env
```

Set the following variables:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/fences"
REDIS_URL="redis://localhost:6379"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="https://yourdomain.com"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
TELEGRAM_BOT_TOKEN="your-bot-token"
TELEGRAM_CHAT_ID="your-chat-id"
NEXT_PUBLIC_RECAPTCHA_SITE_KEY="site-key"
RECAPTCHA_SECRET_KEY="secret-key"
NEXT_PUBLIC_YANDEX_METRIKA_ID="metrika-id"
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID="analytics-id"
NEXT_PUBLIC_YANDEX_MAPS_API_KEY="maps-api-key"
```

Generate NEXTAUTH_SECRET:

```bash
openssl rand -base64 32
```

### 4. Create SSL Directory

```bash
mkdir -p /opt/fences-curtain/ssl
```

If using Let's Encrypt:

```bash
sudo certbot certonly --standalone -d yourdomain.com
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem /opt/fences-curtain/ssl/fullchain.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem /opt/fences-curtain/ssl/privkey.pem
sudo chown -R $USER:$USER /opt/fences-curtain/ssl
```

### 5. Start Services

```bash
docker-compose up -d
```

Check logs:

```bash
docker-compose logs -f app
```

### 6. Database Setup

```bash
docker-compose exec app npx prisma db push
docker-compose exec app npm run db:seed
```

### 7. Configure Nginx (Optional)

If using external Nginx:

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 8. Update Nginx Configuration for Docker

Edit `docker/nginx.conf`:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://app:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;

    location / {
        proxy_pass http://app:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Restart services:

```bash
docker-compose down
docker-compose up -d
```

### 9. Setup Firewall

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 10. Monitoring

Check application health:

```bash
curl http://localhost:3000/api/health
```

View logs:

```bash
docker-compose logs -f --tail=100
```

### 11. Backup Setup

Create backup script `/opt/backup.sh`:

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker exec fences-db pg_dump -U postgres fences > /backup/fences_$DATE.sql
```

Add to crontab:

```bash
crontab -e
# Daily backup at 2 AM
0 2 * * * /opt/backup.sh
```

## CI/CD with GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /opt/fences-curtain
            git pull origin main
            docker-compose down
            docker-compose pull
            docker-compose up -d
```

## Troubleshooting

### Database Connection Issues

Check database is running:

```bash
docker-compose ps db
```

Check logs:

```bash
docker-compose logs db
```

### Application Not Starting

Check app logs:

```bash
docker-compose logs app
```

### SSL Certificate Issues

Ensure certificate files exist:

```bash
ls -la /opt/fences-curtain/ssl/
```

Check certificate expiration:

```bash
openssl x509 -enddate -noout -in /opt/fences-curtain/ssl/fullchain.pem
```

### Performance Issues

Check resource usage:

```bash
docker stats
```

## Maintenance

### Updates

```bash
cd /opt/fences-curtain
git pull origin main
docker-compose down
docker-compose build
docker-compose up -d
```

### Database Migration

```bash
docker-compose exec app npx prisma migrate deploy
```

## Security

- Change default admin passwords immediately
- Use strong NEXTAUTH_SECRET
- Enable HTTPS only in production
- Regular security updates
- Firewall configuration
- Regular backups

## Support

For issues contact: info@fences.ru
