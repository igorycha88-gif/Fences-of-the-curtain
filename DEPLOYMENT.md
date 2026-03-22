# Deployment Guide

## Prerequisites

- VPS/VDS with minimum 4GB RAM and 50GB SSD
- Node.js 18+ and npm (for non-Docker deployment)
- PostgreSQL 16+ and Redis (can be Docker or system services)
- Domain name configured
- SSL certificate (Let's Encrypt recommended)

## Server Types

### Standard VPS (KVM/Xen)
Docker deployment recommended. See "Docker Deployment" section.

### OpenVZ VPS
Docker bridge networking may not work due to missing kernel modules (iptables NAT). 
Use systemd services instead. See "Systemd Deployment" section.

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

⚠️ **IMPORTANT: NEXTAUTH_SECRET Security Requirements**

Generate NEXTAUTH_SECRET:

```bash
openssl rand -base64 32
```

**The application will NOT start if NEXTAUTH_SECRET:**
- Is not defined
- Is less than 32 characters
- Contains placeholder values like:
  - `your-super-secret-key-change-in-production`
  - `change-in-production`
  - `your-super-secret`
  - `secret`, `test`, `dev`
  - `REPLACE_WITH_REAL_SECRET`

**For Production Deployment:**
- ✅ Use environment variables on your server (NOT .env file)
- ✅ Vercel: Environment Variables in project settings
- ✅ Docker: Use secrets or `-e` flag
- ✅ Kubernetes: Use Secrets
- ❌ NEVER commit .env file to git
- ❌ NEVER use placeholder values in production

**Example for Docker:**
```bash
docker run -e NEXTAUTH_SECRET="$(openssl rand -base64 32)" ...
```

**Example for systemd:**
```bash
# Add to /etc/systemd/system/fences.service
Environment="NEXTAUTH_SECRET=your-generated-secret-here"
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

## Systemd Deployment (OpenVZ / Non-Docker)

### Overview

For OpenVZ containers or servers where Docker bridge networking is unavailable:

1. Application runs as systemd service
2. PostgreSQL and Redis run as system services (not Docker)
3. Nginx runs as system service for reverse proxy

### Prerequisites

```bash
# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Redis
sudo apt install -y redis-server

# Install Nginx
sudo apt install -y nginx

# Install build tools
sudo apt install -y build-essential
```

### PostgreSQL Setup

```bash
sudo -u postgres psql
CREATE DATABASE fences;
CREATE USER fences WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE fences TO fences;
\q
```

### Redis Setup

```bash
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

### Application Setup

```bash
# Clone repository
git clone <repository-url> /root/Fences-of-the-curtain
cd /root/Fences-of-the-curtain

# Install dependencies
npm ci

# Setup environment
cp .env.example .env
nano .env
```

### Environment Variables

```env
DATABASE_URL="postgresql://fences:your_password@localhost:5432/fences"
REDIS_URL="redis://localhost:6379"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="https://yourdomain.com"
# ... other variables
```

### Database Initialization

```bash
npx prisma generate
npx prisma migrate deploy
npm run db:seed  # if applicable
```

### Build Application

```bash
npm run build
```

### Create Systemd Service

Create `/etc/systemd/system/fences.service`:

```ini
[Unit]
Description=Fences of the Curtain - Next.js Application
After=network.target postgresql.service redis.service

[Service]
Type=simple
User=root
WorkingDirectory=/root/Fences-of-the-curtain
Environment=NODE_ENV=production
ExecStartPre=-/bin/fuser -k 3000/tcp
ExecStart=/usr/bin/node /root/Fences-of-the-curtain/node_modules/.bin/next start
Restart=on-failure
RestartSec=15
StandardOutput=append:/var/log/fences/app.log
StandardError=append:/var/log/fences/error.log

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo mkdir -p /var/log/fences
sudo systemctl daemon-reload
sudo systemctl enable fences
sudo systemctl start fences
```

### Deploy Script

Create `/root/Fences-of-the-curtain/deploy.sh`:

```bash
#!/bin/bash
set -e

APP_DIR="/root/Fences-of-the-curtain"
LOG_FILE="/var/log/fences/deploy.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

cd "$APP_DIR"

log "========== STARTING DEPLOY =========="

log "Pulling latest code..."
git fetch origin
git reset --hard origin/master

log "Installing dependencies..."
npm ci

log "Generating Prisma Client..."
npx prisma generate

log "Running database migrations..."
npx prisma migrate deploy

log "Building application..."
npm run build

log "Restarting fences service..."
systemctl restart fences

sleep 5

if systemctl is-active --quiet fences; then
    log "✅ DEPLOY SUCCESS - Service is running"
    systemctl status fences --no-pager | head -10 | tee -a "$LOG_FILE"
else
    log "❌ DEPLOY FAILED - Service is not running"
    journalctl -u fences --no-pager -n 50 | tee -a "$LOG_FILE"
    exit 1
fi

log "========== DEPLOY COMPLETE =========="
```

Make executable:

```bash
chmod +x /root/Fences-of-the-curtain/deploy.sh
```

### Quick Deploy Command

```bash
cd /root/Fences-of-the-curtain && ./deploy.sh
```

### Nginx Configuration

Create `/etc/nginx/sites-available/fences`:

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
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/fences /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Service Management

```bash
# Check status
systemctl status fences

# View logs
tail -f /var/log/fences/app.log
tail -f /var/log/fences/error.log

# Restart service
systemctl restart fences

# Stop service
systemctl stop fences

# Start service
systemctl start fences
```

### Database Migrations

When schema changes:

```bash
# Local development
npx prisma migrate dev --name <migration_name>

# Production (after git pull)
npx prisma migrate deploy
```

**IMPORTANT**: 
- Always use `prisma migrate dev` locally to create migrations
- Never use `prisma db push` on production - it breaks migration history
- Always use `prisma migrate deploy` on production

### Database Backup

```bash
# Create backup
sudo -u postgres pg_dump -d fences > /backup/fences_$(date +%Y%m%d).sql

# Restore backup
sudo -u postgres psql -d fences < /backup/fences_20240101.sql
```

## CI/CD with GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [master]

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
            cd /root/Fences-of-the-curtain
            ./deploy.sh
```

## Quick Deploy Commands

### Using deploy script (recommended)

```bash
# On server
cd /root/Fences-of-the-curtain
./deploy.sh
```

The deploy script will:
1. Pull latest code from git
2. Install dependencies (`npm ci`)
3. Generate Prisma Client
4. Run database migrations (`prisma migrate deploy`)
5. Build the application
6. Restart the service

### Manual deploy

```bash
cd /root/Fences-of-the-curtain
git pull origin master
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build
systemctl restart fences
```

## Troubleshooting

### Docker on OpenVZ

If Docker fails with iptables/NAT errors on OpenVZ:

```
Error: iptables failed: can't initialize iptables table 'nat': Table does not exist
```

Solution: Use systemd deployment instead (see above). OpenVZ containers cannot load kernel modules.

### Service Won't Start (Port in Use)

```bash
# Check what's using port 3000
lsof -i :3000
# or
fuser 3000/tcp

# Kill the process
fuser -k 3000/tcp

# Restart service
systemctl restart fences
```

### Database Connection Issues

Check database is running:

```bash
# PostgreSQL
systemctl status postgresql
sudo -u postgres psql -c "SELECT 1"

# Redis
systemctl status redis-server
redis-cli ping
```

### Schema Mismatch Errors

If you get errors like "column does not exist":

```bash
# Check current schema
npx prisma db pull

# Compare with your schema file
git diff prisma/schema.prisma

# Create migration for changes
npx prisma migrate dev --name fix_schema

# On production
npx prisma migrate deploy
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

Docker deployment:
```bash
cd /opt/fences-curtain
git pull origin master
docker-compose down
docker-compose build
docker-compose up -d
```

Systemd deployment:
```bash
cd /root/Fences-of-the-curtain
./deploy.sh
```

### Database Migration

```bash
# Docker
docker-compose exec app npx prisma migrate deploy

# Systemd
npx prisma migrate deploy
```

### Logs

```bash
# Systemd service logs
tail -f /var/log/fences/app.log
tail -f /var/log/fences/error.log

# Service status
journalctl -u fences -f

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### Monitoring

```bash
# Check service status
systemctl status fences

# Check application health
curl http://localhost:3000/api/auth/session

# Check database
sudo -u postgres psql -d fences -c "SELECT COUNT(*) FROM \"FenceType\""

# Check Redis
redis-cli ping

# Resource usage
htop
df -h
```

## Security

- Change default admin passwords immediately
- Use strong NEXTAUTH_SECRET
- Enable HTTPS only in production
- Regular security updates
- Firewall configuration
- Regular backups

### Managing Secrets

All secrets must be configured before deployment. See [SECURITY_SECRETS.md](./SECURITY_SECRETS.md) for detailed documentation.

**Required secrets:**
- `NEXTAUTH_SECRET` - JWT token signing (generate with `openssl rand -base64 32`)
- `CRON_SECRET` - Cron endpoint authorization (generate with `openssl rand -base64 32`)
- `POSTGRES_PASSWORD` - Database password

**To rotate secrets:**
```bash
# Preview changes
./scripts/rotate-secrets.sh --dry-run

# Rotate secrets
./scripts/rotate-secrets.sh

# Apply to production
# See SECURITY_SECRETS.md for detailed instructions
```

**Important:**
- Never commit `.env` files to git
- Use different secrets for each environment
- Rotate secrets immediately if compromised

## Support

For issues contact: info@fences.ru
