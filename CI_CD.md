# CI/CD Documentation

## Overview

This document describes the improved CI/CD pipeline for the Fences of the Curtain project.

## Architecture

```
┌─────────────┐
│   Git Push  │
│  (PR/Dev)  │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│  CI Workflow      │  ✓ Lint
│  .github/workflows │  ✓ TypeCheck
│     /ci.yml       │  ✓ Tests
│                   │  ✓ Build Check
│                   │  ✓ Security Scan
└──────┬────────────┘
       │
       │ On Success
       │
       ├──────────────┬──────────────┐
       │              │              │
       ▼              ▼              ▼
   ┌─────────┐  ┌──────────┐  ┌─────────────────┐
   │  Dev    │  │  Staging │  │  Production    │
   │  Branch │  │ (Dev)    │  │  (Master)      │
   └─────────┘  └──────────┘  └────────┬────────┘
                                   │
                                   ▼
                         ┌──────────────────┐
                         │ Deploy to Prod  │
                         │ Smoke Tests     │
                         │ Auto Rollback   │
                         └──────────────────┘
```

## Workflows

### 1. CI Workflow (`ci.yml`)

**Trigger:** Pull requests and pushes to master/main/dev

**Jobs:**
- **Lint:** Runs ESLint to check code quality
- **TypeCheck:** Validates TypeScript types
- **Test:** Runs unit tests with coverage
- **Build Check:** Builds the application to ensure it compiles
- **Security Scan:** Checks for vulnerabilities and hardcoded secrets

**Blocking:** All jobs must pass before deployment

### 2. Build Docker Image (`build-docker.yml`)

**Trigger:** Pushes to master/main/dev and pull requests

**Purpose:** Build and push Docker image to GitHub Container Registry

**Features:**
- Multi-stage build for optimization
- Layer caching for faster builds
- Automated tagging (branch, SHA, semver)

### 3. Deploy to Staging (`deploy-staging.yml`)

**Trigger:** Pushes to dev branch and manual dispatch

**Process:**
1. Pull latest code
2. Install dependencies
3. Generate Prisma Client
4. Build application
5. Deploy to staging (port 3002)
6. Run smoke tests
7. Auto-rollback on failure

**Access:**
```
SSH tunnel: ssh -L 3002:localhost:3002 root@37.143.13.196
Then open: http://localhost:3002
```

### 4. Deploy to Production (`deploy-production.yml`)

**Trigger:** Pushes to master/main branch and manual dispatch

**Requirements:**
- CI workflow must pass (wait for CI checks)
- Valid NEXTAUTH_SECRET (no placeholders)
- Database backup before deploy

**Process:**
1. Create database backup
2. Pull latest code
3. Install dependencies
4. Generate Prisma Client
5. Build application
6. Push database schema changes
7. Zero-downtime PM2 reload
8. Comprehensive smoke tests
9. Auto-rollback on failure

**Zero-Downtime:** Uses PM2 reload instead of restart

## Scripts

### Smoke Tests (`scripts/smoke-test.sh`)

**Purpose:** Verify deployment success

**Tests:**
- Homepage accessibility (HTTP 200)
- Admin login page accessibility (HTTP 200)
- Calculator API endpoint (HTTP 405 for GET)
- Auth session API (HTTP 200)
- No test credentials in HTML

**Usage:**
```bash
./scripts/smoke-test.sh http://localhost:3001
```

### Telegram Notifications (`scripts/telegram-notify.sh`)

**Purpose:** Send deployment notifications to Telegram

**Setup:**
```bash
# Add to GitHub Secrets:
# TELEGRAM_BOT_TOKEN
# TELEGRAM_CHAT_ID
```

**Usage:**
```bash
./scripts/telegram-notify.sh "Deployment successful!"
```

### Rollback Script (`scripts/rollback.sh`)

**Purpose:** Manual rollback to previous commit

**Usage:**
```bash
# Show available backups
./scripts/rollback.sh

# Rollback to specific tag
./scripts/rollback.sh prod-backup-20240322120000

# Rollback to commit
./scripts/rollback.sh abc123def456
```

**Process:**
1. Reset git to target
2. Reinstall dependencies
3. Rebuild application
4. Restart PM2 process
5. Health check verification

## GitHub Secrets Configuration

### Required for CI/CD:

```yaml
SSH_PASSWORD: "your-ssh-password"
SSH_PORT: "22" (or custom port)
SSH_HOST: "37.143.13.196" (or your server)
```

### Optional for Notifications:

```yaml
TELEGRAM_BOT_TOKEN: "bot-token-from-@BotFather"
TELEGRAM_CHAT_ID: "your-chat-id"
```

### Required for Tests:

```yaml
NEXTAUTH_SECRET: "generated-secret-min-32-chars"
```

## Deployment Flow

### Automated Deployment (Recommended)

**To Master/Production:**
```bash
# Push to master branch
git checkout master
git merge dev
git push origin master

# CI runs automatically
# Production deploys automatically after CI passes
```

**To Staging:**
```bash
# Push to dev branch
git push origin dev

# Staging deploys automatically
```

### Manual Deployment

**Via GitHub Actions:**
1. Go to Actions tab
2. Select workflow (Deploy to Production / Deploy to Staging)
3. Click "Run workflow"
4. Provide reason (optional)
5. Monitor logs

**Via Command Line:**
```bash
# Trigger deploy using GitHub CLI
gh workflow run deploy-production.yml

# Trigger with parameters
gh workflow run deploy-production.yml -f deploy_reason="Hotfix"
```

### Manual Rollback

**On Server:**
```bash
cd /root/Fences-of-the-curtain

# List available backups
./scripts/rollback.sh

# Rollback
./scripts/rollback.sh prod-backup-20240322120000
```

**Via Git:**
```bash
# Reset to previous commit manually
git reset --hard HEAD~1

# Rebuild
npm install --legacy-peer-deps
npx prisma generate
npm run build

# Restart
pm2 reload ecosystem.config.js --env production
```

## Monitoring

### Check Deployment Status

**GitHub Actions:**
```
https://github.com/your-repo/actions
```

**Server Logs:**
```bash
# Deployment logs
tail -f /var/log/fences-deploy/deploy-production.log
tail -f /var/log/fences-deploy/deploy-staging.log

# Application logs
pm2 logs fences-app --lines 100

# PM2 status
pm2 list
pm2 monit
```

### Health Checks

**Local:**
```bash
curl http://localhost:3001/
curl http://localhost:3002/
```

**Public:**
```bash
curl https://your-domain.com/
```

## Troubleshooting

### Common Issues

**1. CI Failed - Type Errors**
```
Fix TypeScript errors before deploying
Run: npm run lint
Run: npx tsc --noEmit
```

**2. CI Failed - Build Errors**
```
Check Next.js build output
Run: npm run build
Fix build errors locally
```

**3. Deploy Failed - NEXTAUTH_SECRET Invalid**
```bash
# SSH to server
ssh root@37.143.13.196

# Check .env file
cd /root/Fences-of-the-curtain
grep NEXTAUTH_SECRET .env

# Generate new secret if needed
openssl rand -base64 32

# Update .env
nano .env

# Restart application
pm2 reload ecosystem.config.js --env production
```

**4. Deploy Failed - Database Connection**
```bash
# Check PostgreSQL status
systemctl status postgresql

# Check database connectivity
sudo -u postgres psql -d fences -c "SELECT 1;"

# Restart PostgreSQL if needed
systemctl restart postgresql
```

**5. Smoke Tests Failed**
```bash
# Run smoke tests manually
./scripts/smoke-test.sh http://localhost:3001

# Check application logs
pm2 logs fences-app --lines 50

# Check port availability
netstat -tlnp | grep 3001
```

**6. Automatic Rollback Triggered**
```bash
# Check deployment logs for failure reason
tail -100 /var/log/fences-deploy/deploy-production.log

# Check rollback status
pm2 list

# If rollback also failed:
# 1. Manual intervention required
# 2. Check logs: pm2 logs fences-app --lines 200
# 3. Fix issue locally
# 4. Redeploy
```

### Emergency Procedures

**Application Down:**
```bash
# Quick health check
curl -I http://localhost:3001/

# Check PM2
pm2 list

# Restart if crashed
pm2 restart fences-app

# If restart fails:
pm2 delete fences-app
pm2 start ecosystem.config.js --env production
pm2 save
```

**Database Corrupted:**
```bash
# Restore from latest backup
cd /root/Fences-of-the-curtain

# Find latest backup
ls -lht backup_*.sql | head -5

# Restore
sudo -u postgres psql -d fences < backup_prod_YYYYMMDD_HHMMSS.sql

# Restart application
pm2 restart fences-app
```

**Rollback to Stable Version:**
```bash
# Identify last known good commit
git log --oneline -20

# Rollback
./scripts/rollback.sh <commit-hash>

# Verify
curl http://localhost:3001/
```

## Best Practices

### Before Deployment

1. **Always test on Staging first:**
   ```bash
   git push origin dev
   # Wait for staging deploy
   # Test on staging
   ```

2. **Review CI logs:**
   - Check for lint errors
   - Check test failures
   - Check build issues

3. **Prepare rollback plan:**
   - Identify last stable commit
   - Have database backup ready

### During Deployment

1. **Monitor deployment logs:**
   ```bash
   tail -f /var/log/fences-deploy/deploy-production.log
   ```

2. **Watch for errors:**
   - Build failures
   - Database migration errors
   - PM2 restart failures

3. **Verify smoke tests:**
   - All endpoints should pass
   - No test credentials visible

### After Deployment

1. **Verify application:**
   ```bash
   # Health check
   curl http://localhost:3001/
   
   # Check key features
   - Homepage loads
   - Calculator works
   - Admin login works
   - No test credentials visible
   ```

2. **Check logs:**
   ```bash
   pm2 logs fences-app --lines 100
   ```

3. **Monitor for issues:**
   - User reports
   - Error spikes in logs
   - Performance degradation

## Security Checklist

- [ ] `.env` file is never committed to git
- [ ] `NEXTAUTH_SECRET` is at least 32 characters
- [ ] `NEXTAUTH_SECRET` does not contain placeholder values
- [ ] Database backups are encrypted
- [ ] SSH keys are rotated regularly
- [ ] SSH port is non-default (not 22)
- [ ] Firewall allows only necessary ports
- [ ] SSL/TLS certificates are valid
- [ ] Dependencies are updated regularly
- [ ] Security scans are run before deployment

## Performance Optimization

### CI Speed

- **Caching:** npm dependencies are cached between runs
- **Parallel Jobs:** Lint, TypeCheck, Test run in parallel
- **Docker Cache:** Build layers are cached

### Deploy Speed

- **Zero-Downtime:** PM2 reload instead of restart
- **Incremental Builds:** Only rebuild changed parts
- **Optimized Dependencies:** `--legacy-peer-deps` for faster install

### Monitoring

- **Real-time:** PM2 monitoring
- **Log Aggregation:** Centralized logs in `/var/log/fences-deploy`
- **Health Checks:** Automated smoke tests

## Maintenance

### Regular Tasks

**Daily:**
- Check application logs for errors
- Verify health checks pass
- Review backup completion

**Weekly:**
- Review failed deployments
- Update dependencies (`npm update`)
- Check security vulnerabilities (`npm audit`)

**Monthly:**
- Rotate secrets (NEXTAUTH_SECRET, database passwords)
- Clean old backups
- Review and optimize CI/CD pipeline

### Log Cleanup

Logs are automatically cleaned:
- Deployment logs: 30 days retention
- Database backups: 7 days retention

Manual cleanup:
```bash
# Clean old deployment logs
find /var/log/fences-deploy -name "*.log" -mtime +30 -delete

# Clean old backups
cd /root/Fences-of-the-curtain
find . -name "backup_*.sql" -mtime +7 -delete
```

## Support

For issues or questions:
- GitHub Issues: https://github.com/your-repo/issues
- Deployment Logs: `/var/log/fences-deploy/`
- Application Logs: `pm2 logs fences-app`

## Changelog

### Version 2.0 (Current)

**New Features:**
- ✅ Automated CI pipeline with lint, typecheck, tests
- ✅ Staging environment deployment
- ✅ Automated smoke tests after deployment
- ✅ Zero-downtime deployments with PM2 reload
- ✅ Automatic rollback on deployment failure
- ✅ Docker image building and caching
- ✅ Security scanning for hardcoded secrets
- ✅ Comprehensive logging and monitoring
- ✅ Telegram notification support
- ✅ Manual rollback script

**Improvements:**
- Faster deployments with caching
- Better error handling and recovery
- More robust health checks
- Improved documentation

### Version 1.0 (Previous)

**Features:**
- Manual deployment workflow
- Basic health checks
- Simple rollback mechanism

---

**Last Updated:** March 22, 2026
**Maintainer:** DevOps Team
