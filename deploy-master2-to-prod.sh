#!/bin/bash

# =============================================================================
# 🚀 DEPLOY MASTER2 TO PRODUCTION - Safe Merge Script
# =============================================================================
# This script safely deploys master2 branch to production VPS
# =============================================================================

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# =============================================================================
# CONFIGURATION
# =============================================================================

VPS_HOST="37.143.13.196"
VPS_USER="root"
VPS_DIR="/root/Fences-of-the-curtain"
APP_NAME="fences-app"
LOCAL_BRANCH="master2"
PROD_BRANCH="master"
BACKUP_DIR="${VPS_DIR}/backups/deployments"

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

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

check_success() {
    if [ $? -eq 0 ]; then
        log_info "$1 ✓"
        return 0
    else
        log_error "$1 FAILED ✗"
        return 1
    fi
}

confirm_action() {
    local message="$1"
    local default="${2:-n}"
    
    if [ "$default" = "y" ]; then
        read -p "$message [Y/n]: " response
        response=${response:-y}
    else
        read -p "$message [y/N]: " response
        response=${response:-n}
    fi
    
    case "$response" in
        [yY][eE][sS]|[yY])
            return 0
            ;;
        *)
            return 1
            ;;
    esac
}

# =============================================================================
# PRE-DEPLOYMENT CHECKS
# =============================================================================

pre_deployment_checks() {
    log_step "Running pre-deployment checks..."
    
    # Check if we're on master2
    local current_branch
    current_branch=$(git branch --show-current)
    if [ "$current_branch" != "$LOCAL_BRANCH" ]; then
        log_error "Not on $LOCAL_BRANCH branch (current: $current_branch)"
        return 1
    fi
    check_success "Branch check: $LOCAL_BRANCH"
    
    # Check for uncommitted changes
    if [ -n "$(git status --porcelain)" ]; then
        log_warn "Uncommitted changes found:"
        git status --short
        if ! confirm_action "Continue with uncommitted changes?"; then
            return 1
        fi
    else
        check_success "No uncommitted changes"
    fi
    
    # Check if master2 is ahead of master
    local commits_ahead
    commits_ahead=$(git rev-list --count $PROD_BRANCH..$LOCAL_BRANCH 2>/dev/null || echo "0")
    log_info "Commits in $LOCAL_BRANCH not in $PROD_BRANCH: $commits_ahead"
    
    # Check SSH connection to VPS
    log_info "Testing SSH connection to VPS..."
    if ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_HOST} "echo 'SSH connection successful'" > /dev/null 2>&1; then
        check_success "SSH connection test"
    else
        log_error "Cannot connect to VPS via SSH"
        return 1
    fi
    
    # Check PM2 status on VPS
    log_info "Checking PM2 status on VPS..."
    local pm2_status
    pm2_status=$(ssh ${VPS_USER}@${VPS_HOST} "pm2 list | grep $APP_NAME | awk '{print \$10}'" 2>/dev/null || echo "")
    if [ "$pm2_status" = "online" ]; then
        check_success "PM2 status: $pm2_status"
    else
        log_warn "PM2 status: $pm2_status (expected: online)"
    fi
    
    return 0
}

# =============================================================================
# BACKUP PROCEDURES
# =============================================================================

create_backups() {
    log_step "Creating backups..."
    
    # Create backup directory
    ssh ${VPS_USER}@${VPS_HOST} "mkdir -p $BACKUP_DIR" 2>/dev/null
    
    # Database backup
    log_info "Creating database backup..."
    local db_backup
    db_backup="${BACKUP_DIR}/db_backup_$(date +%Y%m%d_%H%M%S).sql"
    ssh ${VPS_USER}@${VPS_HOST} "
        cd $VPS_DIR && \
        pg_dump -U postgres fences > $db_backup 2>/dev/null && \
        gzip $db_backup && \
        echo 'Database backup created: ${db_backup}.gz'
    " 2>&1
    check_success "Database backup"
    
    # Application backup (git)
    log_info "Creating application state backup..."
    local app_backup
    app_backup="${BACKUP_DIR}/app_state_$(date +%Y%m%d_%H%M%S).txt"
    ssh ${VPS_USER}@${VPS_HOST} "
        cd $VPS_DIR && \
        git log --oneline -5 > $app_backup && \
        git rev-parse HEAD >> $app_backup && \
        pm2 list >> $app_backup && \
        echo 'Application state backup created: $app_backup'
    " 2>&1
    check_success "Application state backup"
    
    # Uploads backup
    log_info "Creating uploads backup..."
    local uploads_backup
    uploads_backup="${BACKUP_DIR}/uploads_$(date +%Y%m%d_%H%M%S).tar.gz"
    ssh ${VPS_USER}@${VPS_HOST} "
        cd $VPS_DIR && \
        if [ -d 'public/uploads' ]; then \
            tar czf $uploads_backup public/uploads/ && \
            echo 'Uploads backup created: $uploads_backup'; \
        else \
            echo 'No uploads directory to backup'; \
        fi
    " 2>&1
    check_success "Uploads backup"
    
    return 0
}

# =============================================================================
# DEPLOYMENT PROCEDURES
# =============================================================================

deploy_to_vps() {
    log_step "Deploying $LOCAL_BRANCH to VPS..."
    
    # Push master2 to remote
    log_info "Pushing $LOCAL_BRANCH to remote..."
    git push origin $LOCAL_BRANCH 2>&1
    check_success "Push to remote"
    
    # Fetch and checkout master2 on VPS
    log_info "Switching VPS to $LOCAL_BRANCH..."
    ssh ${VPS_USER}@${VPS_HOST} "
        cd $VPS_DIR && \
        git fetch origin && \
        git checkout $LOCAL_BRANCH && \
        git pull origin $LOCAL_BRANCH && \
        echo 'Switched to $LOCAL_BRANCH'
    " 2>&1
    check_success "Switch to $LOCAL_BRANCH"
    
    # Install dependencies
    log_info "Installing dependencies..."
    ssh ${VPS_USER}@${VPS_HOST} "
        cd $VPS_DIR && \
        npm ci 2>&1
    " 2>&1
    check_success "Dependencies installation"
    
    # Run migrations
    log_info "Running database migrations..."
    ssh ${VPS_USER}@${VPS_HOST} "
        cd $VPS_DIR && \
        npx prisma migrate deploy 2>&1
    " 2>&1
    check_success "Database migrations"
    
    # Generate Prisma client
    log_info "Generating Prisma client..."
    ssh ${VPS_USER}@${VPS_HOST} "
        cd $VPS_DIR && \
        npx prisma generate 2>&1
    " 2>&1
    check_success "Prisma client generation"
    
    # Build application
    log_info "Building Next.js application..."
    ssh ${VPS_USER}@${VPS_HOST} "
        cd $VPS_DIR && \
        rm -rf .next && \
        npm run build 2>&1
    " 2>&1
    check_success "Next.js build"
    
    # Restart PM2
    log_info "Restarting PM2 application..."
    ssh ${VPS_USER}@${VPS_HOST} "
        cd $VPS_DIR && \
        pm2 restart $APP_NAME 2>&1
    " 2>&1
    check_success "PM2 restart"
    
    # Wait for application to start
    log_info "Waiting for application to start..."
    sleep 10
    
    return 0
}

# =============================================================================
# POST-DEPLOYMENT VERIFICATION
# =============================================================================

verify_deployment() {
    log_step "Verifying deployment..."
    
    # Check PM2 status
    log_info "Checking PM2 status..."
    local pm2_status
    pm2_status=$(ssh ${VPS_USER}@${VPS_HOST} "pm2 list | grep $APP_NAME | awk '{print \$10}'" 2>/dev/null || echo "")
    if [ "$pm2_status" = "online" ]; then
        check_success "PM2 status: $pm2_status"
    else
        log_error "PM2 status: $pm2_status (expected: online)"
        return 1
    fi
    
    # Check application logs
    log_info "Checking application logs for errors..."
    local error_count
    error_count=$(ssh ${VPS_USER}@${VPS_HOST} "pm2 logs $APP_NAME --lines 50 --nostream | grep -i error | wc -l" 2>/dev/null || echo "0")
    if [ "$error_count" -eq 0 ]; then
        check_success "No errors in logs"
    else
        log_warn "Found $error_count errors in recent logs"
    fi
    
    # Run smoke tests
    log_info "Running smoke tests..."
    ssh ${VPS_USER}@${VPS_HOST} "
        cd $VPS_DIR && \
        ./scripts/smoke-test.sh http://localhost:3001 2>&1
    " 2>&1
    check_success "Smoke tests"
    
    # Check API endpoints
    log_info "Testing critical API endpoints..."
    
    # Homepage
    if curl -s -o /dev/null -w "%{http_code}" --max-time 10 http://${VPS_HOST}:3001/ | grep -q "200"; then
        check_success "Homepage (HTTP 200)"
    else
        log_error "Homepage check failed"
        return 1
    fi
    
    # Admin login page
    if curl -s -o /dev/null -w "%{http_code}" --max-time 10 http://${VPS_HOST}:3001/admin/login | grep -q "200"; then
        check_success "Admin login page (HTTP 200)"
    else
        log_error "Admin login page check failed"
        return 1
    fi
    
    return 0
}

# =============================================================================
# ROLLBACK PROCEDURES
# =============================================================================

rollback_deployment() {
    log_step "ROLLBACK INITIATED..."
    
    log_warn "Switching back to $PROD_BRANCH..."
    ssh ${VPS_USER}@${VPS_HOST} "
        cd $VPS_DIR && \
        git checkout $PROD_BRANCH && \
        git pull origin $PROD_BRANCH && \
        npm ci && \
        npx prisma generate && \
        npm run build && \
        pm2 restart $APP_NAME
    " 2>&1
    
    log_info "Waiting for rollback to complete..."
    sleep 10
    
    log_warn "ROLLBACK COMPLETED"
    log_info "Please verify application functionality"
    
    exit 1
}

# =============================================================================
# MAIN EXECUTION
# =============================================================================

main() {
    echo ""
    echo "=============================================================================="
    echo "🚀 DEPLOY MASTER2 TO PRODUCTION"
    echo "=============================================================================="
    echo ""
    log_info "VPS: ${VPS_USER}@${VPS_HOST}"
    log_info "Source branch: $LOCAL_BRANCH"
    log_info "Production branch: $PROD_BRANCH"
    log_info "Deployment started: $(date)"
    echo ""
    
    # Pre-deployment checks
    if ! pre_deployment_checks; then
        log_error "Pre-deployment checks failed"
        exit 1
    fi
    
    # Confirm deployment
    if ! confirm_action "Ready to deploy $LOCAL_BRANCH to production?"; then
        log_info "Deployment cancelled by user"
        exit 0
    fi
    
    # Create backups
    if ! create_backups; then
        log_error "Backup creation failed"
        exit 1
    fi
    
    # Deploy
    if ! deploy_to_vps; then
        log_error "Deployment failed, initiating rollback..."
        rollback_deployment
    fi
    
    # Verify
    if ! verify_deployment; then
        log_error "Verification failed, initiating rollback..."
        if confirm_action "Do you want to rollback?"; then
            rollback_deployment
        else
            log_warn "Skipping rollback - manual intervention required"
            exit 1
        fi
    fi
    
    echo ""
    echo "=============================================================================="
    log_info "✓ DEPLOYMENT SUCCESSFUL"
    echo "=============================================================================="
    log_info "Deployment completed: $(date)"
    log_info "Application is running on branch: $LOCAL_BRANCH"
    log_info "Backups available in: $BACKUP_DIR"
    echo ""
    
    exit 0
}

# Run main function
main "$@"