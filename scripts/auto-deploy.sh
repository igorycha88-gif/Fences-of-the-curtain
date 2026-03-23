#!/bin/bash

# =============================================================================
# 🚀 Automated Deployment Script: main → master → VPS
# =============================================================================
# This script automates the complete deployment process
# =============================================================================

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# =============================================================================
# CONFIGURATION
# =============================================================================

VPS_HOST="37.143.13.196"
VPS_USER="root"
VPS_DIR="/root/Fences-of-the-curtain"
APP_NAME="fences-app"
DOMAIN="ваш-домен.ru"  # TODO: Update with real domain

# =============================================================================
# FUNCTIONS
# =============================================================================

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_success() {
    if [ $? -eq 0 ]; then
        log_info "$1"
        return 0
    else
        log_error "$1 FAILED"
        return 1
    fi
}

# =============================================================================
# STEP 1: Check GitHub Secrets
# =============================================================================

echo ""
echo "=========================================================================="
echo "🔐 STEP 1: Checking GitHub Secrets"
echo "=========================================================================="

log_info "Checking required secrets..."

REQUIRED_SECRETS=("SSH_PASSWORD" "SSH_PORT")
MISSING_SECRETS=()

for secret in "${REQUIRED_SECRETS[@]}"; do
    if gh secret list | grep -q "^$secret"; then
        log_info "✓ Secret $secret is configured"
    else
        log_error "✗ Secret $secret is missing!"
        MISSING_SECRETS+=("$secret")
    fi
done

if [ ${#MISSING_SECRETS[@]} -gt 0 ]; then
    log_error "Missing secrets: ${MISSING_SECRETS[*]}"
    log_error "Please configure them at: https://github.com/igorycha88-gif/Fences-of-the-curtain/settings/secrets/actions"
    exit 1
fi

log_info "All required GitHub secrets are configured ✓"

# =============================================================================
# STEP 2: Check PR #17 Status
# =============================================================================

echo ""
echo "=========================================================================="
echo "🔗 STEP 2: Checking PR #17 Status"
echo "=========================================================================="

log_info "Checking PR #17..."

PR_STATUS=$(gh pr view 17 --json state | jq -r '.state')
PR_MERGEABLE=$(gh pr view 17 --json mergeable | jq -r '.mergeable')

if [ "$PR_STATUS" = "OPEN" ]; then
    log_info "✓ PR #17 is OPEN and ready to merge"
    
    if [ "$PR_MERGEABLE" = "true" ]; then
        log_info "✓ PR is mergeable"
    else
        log_warn "⚠ PR has conflicts - needs manual resolution"
    fi
elif [ "$PR_STATUS" = "MERGED" ]; then
    log_info "✓ PR #17 is already merged!"
else
    log_error "✗ PR #17 status: $PR_STATUS"
    log_error "Please check PR at: https://github.com/igorycha88-gif/Fences-of-the-curtain/pull/17"
    exit 1
fi

# =============================================================================
# STEP 3: Verify Local Configuration
# =============================================================================

echo ""
echo "=========================================================================="
echo "🔧 STEP 3: Verifying Local Configuration"
echo "=========================================================================="

# Check docker-compose.yml
log_info "Checking docker-compose.yml..."
if grep -q "DATABASE_URL=postgresql://postgres:password@" docker-compose.yml; then
    log_error "✗ docker-compose.yml has hardcoded password!"
    log_error "This is the unsafe version from master."
    log_error "The safe version from main should be used."
else
    log_info "✓ docker-compose.yml uses environment variables"
fi

# Check schema
log_info "Checking Prisma schema..."
if grep -q "model RateLimitConfig" prisma/schema.prisma; then
    log_info "✓ RateLimitConfig model present"
else
    log_error "✗ RateLimitConfig model missing"
fi

if grep -q "model AuditLog" prisma/schema.prisma; then
    log_info "✓ AuditLog model present"
else
    log_error "✗ AuditLog model missing"
fi

if grep -q "model AdminActionLog" prisma/schema.prisma; then
    log_warn "⚠ Old AdminActionLog model still exists (should be removed after merge)"
else
    log_info "✓ No deprecated AdminActionLog model"
fi

# =============================================================================
# STEP 4: Generate Secure Secrets Guide
# =============================================================================

echo ""
echo "=========================================================================="
echo "🔑 STEP 4: Generating Secure Secrets"
echo "=========================================================================="

log_info "Generating NEXTAUTH_SECRET..."
NEXTAUTH_SECRET=$(openssl rand -base64 32)
echo "$NEXTAUTH_SECRET" > /tmp/NEXTAUTH_SECRET.txt
log_info "✓ NEXTAUTH_SECRET generated (saved to /tmp/NEXTAUTH_SECRET.txt)"

log_info "Generating CRON_SECRET..."
CRON_SECRET=$(openssl rand -base64 32)
echo "$CRON_SECRET" > /tmp/CRON_SECRET.txt
log_info "✓ CRON_SECRET generated (saved to /tmp/CRON_SECRET.txt)"

log_info "Generating POSTGRES_PASSWORD..."
POSTGRES_PASSWORD=$(openssl rand -base64 24 | tr -d '/+=' | cut -c1-20)
echo "$POSTGRES_PASSWORD" > /tmp/POSTGRES_PASSWORD.txt
log_info "✓ POSTGRES_PASSWORD generated (saved to /tmp/POSTGRES_PASSWORD.txt)"

log_warn "⚠️ IMPORTANT: Copy these secrets to your VPS .env file!"
log_info "Files location:"
echo "  - /tmp/NEXTAUTH_SECRET.txt"
echo "  - /tmp/CRON_SECRET.txt"
echo "  - /tmp/POSTGRES_PASSWORD.txt"

# =============================================================================
# STEP 5: Create VPS Deployment Script
# =============================================================================

echo ""
echo "=========================================================================="
echo "📜 STEP 5: Creating VPS Deployment Script"
echo "=========================================================================="

cat > /tmp/vps-deploy.sh << 'EOF'
#!/bin/bash

# =============================================================================
# VPS Deployment Script
# =============================================================================

set -e

APP_DIR="/root/Fences-of-the-curtain"
APP_NAME="fences-app"
LOG_DIR="/var/log/fences-deploy"
DEPLOY_LOG="$LOG_DIR/deploy_$(date +%Y%m%d_%H%M%S).log"

mkdir -p "$LOG_DIR"
mkdir -p /var/log/fences-app

# Redirect all output to log
exec > >(tee -a "$DEPLOY_LOG") 2>&1

log_deploy() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

cd $APP_DIR

log_deploy "=========================================="
log_deploy "DEPLOYMENT STARTED"
log_deploy "=========================================="

# =============================================================================
# STEP 1: Environment Check
# =============================================================================

log_deploy "STEP 1: Checking environment..."

if [ ! -f .env ]; then
    log_deploy "ERROR: .env file not found!"
    log_deploy "Creating .env from template..."
    cp .env.example .env
    log_deploy "⚠️ PLEASE EDIT .env WITH REAL SECRETS!"
    exit 1
fi

log_deploy "✓ .env file exists"

# Verify critical variables
if grep -q "REPLACE_WITH_REAL_SECRET" .env; then
    log_deploy "ERROR: .env contains placeholder secrets!"
    log_deploy "Please update NEXTAUTH_SECRET and CRON_SECRET"
    exit 1
fi

log_deploy "✓ Environment variables are configured"

# =============================================================================
# STEP 2: Database Backup
# =============================================================================

log_deploy "STEP 2: Creating database backup..."

BACKUP_FILE="backup_before_deploy_$(date +%Y%m%d_%H%M%S).sql"

if sudo -u postgres pg_dump -U postgres fences > "$BACKUP_FILE" 2>/dev/null; then
    log_deploy "✓ Database backup created: $BACKUP_FILE"
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    log_deploy "Backup size: $BACKUP_SIZE"
else
    log_deploy "ERROR: Database backup failed!"
    exit 1
fi

# =============================================================================
# STEP 3: Pull Latest Changes
# =============================================================================

log_deploy "STEP 3: Pulling latest changes..."

CURRENT_COMMIT=$(git rev-parse HEAD 2>/dev/null || echo "none")
TARGET_COMMIT=$(git rev-parse origin/master 2>/dev/null || echo "none")

log_deploy "Current commit: $CURRENT_COMMIT"
log_deploy "Target commit: $TARGET_COMMIT"

if git fetch origin && git reset --hard origin/master; then
    log_deploy "✓ Repository updated to master"
else
    log_deploy "ERROR: Failed to pull latest changes"
    exit 1
fi

# =============================================================================
# STEP 4: Install Dependencies
# =============================================================================

log_deploy "STEP 4: Installing dependencies..."

if npm install --legacy-peer-deps; then
    log_deploy "✓ Dependencies installed"
else
    log_deploy "ERROR: Failed to install dependencies"
    exit 1
fi

# =============================================================================
# STEP 5: Generate Prisma Client
# =============================================================================

log_deploy "STEP 5: Generating Prisma Client..."

if npx prisma generate; then
    log_deploy "✓ Prisma client generated"
else
    log_deploy "ERROR: Failed to generate Prisma client"
    exit 1
fi

# =============================================================================
# STEP 6: Build Application
# =============================================================================

log_deploy "STEP 6: Building application..."

if npm run build; then
    log_deploy "✓ Application built successfully"
else
    log_deploy "ERROR: Build failed"
    log_deploy "Checking npm logs..."
    cat npm-debug.log 2>/dev/null || true
    exit 1
fi

# =============================================================================
# STEP 7: Apply Database Migrations
# =============================================================================

log_deploy "STEP 7: Applying database schema changes..."

if npx prisma db push --accept-data-loss; then
    log_deploy "✓ Database schema updated"
else
    log_deploy "ERROR: Database migration failed"
    exit 1
fi

# =============================================================================
# STEP 8: Restart Application with PM2
# =============================================================================

log_deploy "STEP 8: Restarting application with PM2..."

if pm2 list | grep -q "$APP_NAME"; then
    log_deploy "Reloading existing process..."
    pm2 reload ecosystem.config.js --env production || pm2 restart ecosystem.config.js --env production
    log_deploy "✓ Application reloaded"
else
    log_deploy "Starting new process..."
    pm2 start ecosystem.config.js --env production
    log_deploy "✓ Application started"
fi

pm2 save

# =============================================================================
# STEP 9: Health Check
# =============================================================================

log_deploy "STEP 9: Health check (10 attempts, 5s each)..."

SUCCESS=0
for i in $(seq 1 10); do
    sleep 5
    
    if curl -sf --max-time 5 http://localhost:3001/ > /dev/null 2>&1; then
        log_deploy "✓ Health check passed on attempt $i!"
        SUCCESS=1
        break
    fi
    
    log_deploy "Attempt $i/10 failed..."
    
    if [ $i -eq 3 ] || [ $i -eq 6 ]; then
        log_deploy "=== PM2 logs at attempt $i ==="
        pm2 logs $APP_NAME --lines 20 --nostream || true
    fi
done

if [ $SUCCESS -eq 0 ]; then
    log_deploy "=========================================="
    log_deploy "DEPLOYMENT FAILED"
    log_deploy "=========================================="
    
    # Rollback
    log_deploy "INITIATING ROLLBACK..."
    
    log_deploy "Rolling back to previous commit: $CURRENT_COMMIT"
    git reset --hard "$CURRENT_COMMIT"
    
    npm install --legacy-peer-deps
    npx prisma generate
    npm run build
    pm2 reload ecosystem.config.js --env production || pm2 restart ecosystem.config.js --env production
    
    log_deploy "✓ Rollback completed"
    log_deploy "DEPLOY RESULT: rolled_back"
    
    pm2 logs $APP_NAME --lines 100 --nostream || true
    pm2 list
    
    exit 1
fi

# =============================================================================
# STEP 10: Security Verification
# =============================================================================

log_deploy "STEP 10: Verifying test credentials removed..."

if curl -sf http://localhost:3001/admin/login | grep -q "admin@fences.ru\|manager@fences.ru"; then
    log_deploy "ERROR: Test credentials still visible on login page!"
    log_deploy "DEPLOY RESULT: security_check_failed"
    exit 1
else
    log_deploy "✓ Test credentials successfully removed"
fi

# =============================================================================
# STEP 11: Cleanup
# =============================================================================

log_deploy "STEP 11: Cleanup old backups..."

find "$APP_DIR" -name "backup_*.sql" -mtime +7 -delete 2>/dev/null || true
find "$LOG_DIR" -name "deploy_*.log" -mtime +30 -delete 2>/dev/null || true

log_deploy "✓ Old backups and logs cleaned"

# =============================================================================
# SUCCESS
# =============================================================================

log_deploy "=========================================="
log_deploy "DEPLOYMENT SUCCESSFUL!"
log_deploy "=========================================="
log_deploy "From: $CURRENT_COMMIT"
log_deploy "To: $TARGET_COMMIT"
log_deploy ""

pm2 list
pm2 logs $APP_NAME --lines 50 --nostream || true

log_deploy "Deployment completed successfully!"
log_deploy "Log file: $DEPLOY_LOG"
EOF

chmod +x /tmp/vps-deploy.sh
log_info "✓ VPS deployment script created: /tmp/vps-deploy.sh"

# =============================================================================
# STEP 6: Create Environment Template
# =============================================================================

echo ""
echo "=========================================================================="
echo "📝 STEP 6: Creating Environment Template"
echo "=========================================================================="

cat > /tmp/vps.env << 'EOF'
# =============================================================================
# VPS Environment Variables
# =============================================================================
# IMPORTANT: Copy this to /root/Fences-of-the-curtain/.env
# =============================================================================

# Database
DATABASE_URL="postgresql://postgres:GENERATED_PASSWORD_HERE@localhost:5432/fences"
POSTGRES_PASSWORD="GENERATED_PASSWORD_HERE"

# Redis
REDIS_URL="redis://:REDIS_PASSWORD_HERE@localhost:6379"

# Authentication (CRITICAL!)
NEXTAUTH_SECRET="GENERATED_SECRET_HERE"
NEXTAUTH_URL="https://$DOMAIN"
CRON_SECRET="GENERATED_SECRET_HERE"

# Environment
NODE_ENV=production

# Email (SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# Notifications (Telegram)
TELEGRAM_BOT_TOKEN="your-bot-token"
TELEGRAM_CHAT_ID="your-chat-id"

# Integrations
NEXT_PUBLIC_RECAPTCHA_SITE_KEY="your-site-key"
RECAPTCHA_SECRET_KEY="your-secret-key"

# Analytics (optional)
NEXT_PUBLIC_YANDEX_METRIKA_ID="your-id"
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID="your-id"

# Yandex Maps (optional)
NEXT_PUBLIC_YANDEX_MAPS_API_KEY="your-api-key"
EOF

log_info "✓ Environment template created: /tmp/vps.env"

# =============================================================================
# SUMMARY
# =============================================================================

echo ""
echo "=========================================================================="
echo "✅ AUTOMATION COMPLETE - Next Steps"
echo "=========================================================================="
echo ""
log_info "Generated files:"
echo "  1. /tmp/NEXTAUTH_SECRET.txt - NEXTAUTH_SECRET"
echo "  2. /tmp/CRON_SECRET.txt - CRON_SECRET"
echo "  3. /tmp/POSTGRES_PASSWORD.txt - POSTGRES_PASSWORD"
echo "  4. /tmp/vps-deploy.sh - VPS deployment script"
echo "  5. /tmp/vps.env - Environment template"
echo ""
echo "=========================================================================="
echo "🚀 DEPLOYMENT INSTRUCTIONS"
echo "=========================================================================="
echo ""
log_warn "STEP 1: Upload files to VPS"
echo "  scp /tmp/vps-deploy.sh $VPS_USER@$VPS_HOST:/tmp/"
echo "  scp /tmp/vps.env $VPS_USER@$VPS_HOST:$VPS_DIR/"
echo ""
log_warn "STEP 2: Connect to VPS and setup environment"
echo "  ssh $VPS_USER@$VPS_HOST"
echo "  cd $VPS_DIR"
echo "  nano .env  # Paste the secrets from generated files"
echo ""
log_warn "STEP 3: Merge PR #17"
echo "  Visit: https://github.com/igorycha88-gif/Fences-of-the-curtain/pull/17"
echo "  Click: Merge pull request"
echo "  Select: Squash and merge"
echo ""
log_warn "STEP 4: Deploy to VPS"
echo "  ssh $VPS_USER@$VPS_HOST"
echo "  bash /tmp/vps-deploy.sh"
echo ""
log_warn "STEP 5: Verify deployment"
echo "  curl -I https://$DOMAIN"
echo "  curl -s https://$DOMAIN/admin/login | grep 'admin@fences.ru'  # Should be empty"
echo "  ssh $VPS_USER@$VPS_HOST 'pm2 logs $APP_NAME --lines 50'"
echo ""
echo "=========================================================================="
echo "📊 DEPLOYMENT CHECKLIST"
echo "=========================================================================="
echo ""
echo "Before deployment:"
echo "  [ ] GitHub Secrets configured (SSH_PASSWORD, SSH_PORT)"
echo "  [ ] PR #17 merged to master"
echo "  [ ] .env file created on VPS with real secrets"
echo "  [ ] Database backup created"
echo ""
echo "After deployment:"
echo "  [ ] PM2 shows 'online' status"
echo "  [ ] curl https://$DOMAIN returns 200 OK"
echo "  [ ] Test credentials NOT visible on /admin/login"
echo "  [ ] PM2 logs show no errors"
echo "  [ ] Admin login works"
echo "  [ ] Calculator works"
echo "  [ ] Portfolio works"
echo ""
echo "=========================================================================="
