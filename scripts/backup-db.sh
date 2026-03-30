#!/bin/bash

# Automated Database Backup Script with S3 Upload and Notifications
# Usage: ./scripts/backup-db.sh [production|development]

set -e

# =============================================================================
# CONFIGURATION
# =============================================================================

# Directories
APP_DIR="/root/Fences-of-the-curtain"
BACKUP_DIR="/var/backups/fences"
LOG_DIR="/var/log/fences-backup"

# Retention
RETENTION_DAYS=30

# S3 Configuration
REMOTE_BACKUP_ENABLED=true
S3_BUCKET="fences-db-backups"
S3_REGION="eu-central-1"

# Notification Configuration
TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-}"
TELEGRAM_CHAT_ID="${TELEGRAM_CHAT_ID:-}"

SMTP_HOST="${SMTP_HOST:-}"
SMTP_PORT="${SMTP_PORT:-587}"
SMTP_USER="${SMTP_USER:-}"
SMTP_PASS="${SMTP_PASS:-}"

# Docker containers
DB_CONTAINER="fences-db"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# =============================================================================
# FUNCTIONS
# =============================================================================

log() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_DIR/backup.log"
}

log_error() {
    echo -e "${RED}[ERROR] $1${NC}"
    log "$1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}"
    log "$1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
    log "$1"
}

send_notification() {
    local message="$1"
    local priority="${2:-Normal}"
    
    # Check if Telegram is configured
    if [ -n "$TELEGRAM_BOT_TOKEN" ] && [ -n "$TELEGRAM_CHAT_ID" ]; then
        log "Sending Telegram notification..."
        # Escape message for JSON
        ESCAPED_MESSAGE=$(echo "$message" | sed 's/"/\\"/g')
        
        curl -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
            -H "Content-Type: application/json" \
            -d "{\"chat_id\": \"${TELEGRAM_CHAT_ID}\", \"text\": \"${ESCAPED_MESSAGE}\", \"parse_mode\": \"HTML\"}" \
            >/dev/null 2>&1
            
        if [ $? -eq 0 ]; then
            log_success "Telegram notification sent"
        else
            log_error "Failed to send Telegram notification"
        fi
        
    # Check if email is configured
    elif [ -n "$SMTP_HOST" ] && [ -n "$SMTP_USER" ] && [ -n "$SMTP_PASS" ]; then
        log "Sending email notification..."
        echo -e "Subject: [$priority] 🗄️ Database Backup - $(date '+%Y-%m-%d %H:%M')" \
            | mail -s "$SMTP_HOST" -t "$SMTP_USER" -f "$SMTP_PASS"
            
        if [ $? -eq 0 ]; then
            log_success "Email notification sent"
        else
            log_error "Failed to send email notification"
        fi
    else
        log_warning "No notification configured (skipping)"
    fi
}

check_disk_space() {
    local required_space_gb=5
    local available_space_gb=$(df "$APP_DIR" | awk 'NR==1 {print $4/1024/1024}')
    
    if (( $(echo "$available_space_gb < $required_space_gb" | bc -l)); then
        log_error "Insufficient disk space (available: ${available_space_gb}GB, required: ${required_space_gb}GB)"
        return 1
    fi
    
    log_success "Disk space check passed (${available_space_gb}GB available)"
    return 0
}

# =============================================================================
# MAIN SCRIPT
# =============================================================================

main() {
    local ENV="${1:-production}"
    local DATE=$(date +%Y%m%d_%H%M%S)
    local BACKUP_FILE="${ENV}/fences_backup_${DATE}.sql.gz"
    local BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILE}"
    
    log "===================================="
    log "Database Backup Script"
    log "Environment: $ENV"
    log "Date: $DATE"
    log "Backup file: $BACKUP_PATH"
    log "===================================="
    
    # Create directories if not exist
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$LOG_DIR"
    
    # Check disk space
    if ! check_disk_space; then
        log_error "Script aborted due to insufficient disk space"
        send_notification "❌ Database backup ABORTED - Insufficient disk space" "Critical"
        exit 1
    fi
    
    # Stop database temporarily to ensure consistent backup
    log "Stopping database container for consistent backup..."
    docker stop "$DB_CONTAINER"
    sleep 3
    
    # Create backup
    log "Starting database backup..."
    if sudo -u postgres pg_dump -U postgres fences | gzip > "$BACKUP_PATH"; then
        BACKUP_SIZE=$(du -h "$BACKUP_PATH" | cut -f1)
        log_success "Backup created: $BACKUP_PATH"
        log "Backup size: $BACKUP_SIZE"
        
        # Calculate checksum
        local CHECKSUM=$(md5sum "$BACKUP_PATH" | cut -d1 -f1)
        echo "$CHECKSUM  $BACKUP_PATH" > "${BACKUP_PATH}.md5"
        log "Checksum: $CHECKSUM"
        
        # Start database
        log "Starting database container..."
        docker start "$DB_CONTAINER"
        sleep 5
        
        # Wait for database to be ready
        log "Waiting for database to be ready..."
        local max_attempts=30
        local attempt=0
        
        while [ $attempt -lt $max_attempts ]; do
            if docker exec "$DB_CONTAINER" pg_isready -U postgres fences >/dev/null 2>&1; then
                log_success "Database is ready"
                break
            fi
            attempt=$((attempt + 1))
            sleep 2
        done
        
        if [ $attempt -eq $max_attempts ]; then
            log_error "Database did not start properly"
            send_notification "❌ Database backup FAILED - Database did not start" "Critical"
            exit 1
        fi
        
        # Upload to S3 if enabled
        if [ "$REMOTE_BACKUP_ENABLED" = true ]; then
            log "Uploading backup to S3..."
            
            # Check if AWS CLI is configured
            if command -v aws >/dev/null 2>&1; then
                if aws s3 cp "$BACKUP_PATH" "s3://${S3_BUCKET}/${ENV}/$(basename $BACKUP_PATH)" \
                        --region "$S3_REGION"; then
                    log_success "Uploaded to S3: s3://${S3_BUCKET}/${ENV}/$(basename $BACKUP_PATH)"
                    
                    # Delete from S3 backups older than retention
                    log "Cleaning old S3 backups..."
                    aws s3 ls "s3://${S3_BUCKET}/${ENV}/" --region "$S3_REGION" | \
                        awk "/${DATE}-/ {print $4}" | \
                        xargs -I {} aws s3 rm "s3://${S3_BUCKET}/${ENV}/{}" --region "$S3_REGION" 2>/dev/null
                    
                    log_success "Old S3 backups cleaned"
                else
                    log_warning "AWS CLI not found (skipping S3 upload)"
            fi
        fi
        
        # Send notification
        local MESSAGE="✅ Database backup completed successfully\n\n📁 File: $(basename $BACKUP_PATH)\n📊 Size: $BACKUP_SIZE\n🗄️ Environment: $ENV\n💾 Checksum: $CHECKSUM"
        
        if [ "$REMOTE_BACKUP_ENABLED" = true ]; then
            MESSAGE="${MESSAGE}\n\n☁️ Uploaded to S3: s3://${S3_BUCKET}/${ENV}/$(basename $BACKUP_PATH)"
        fi
        
        send_notification "$MESSAGE" "Normal"
        
    else
        log_error "Backup FAILED"
        send_notification "❌ Database backup FAILED" "Critical"
        exit 1
    fi
    
    # Clean old backups
    log "Cleaning backups older than $RETENTION_DAYS days..."
    local DELETED=0
    
    # Clean local backups
    DELETED_LOCAL=$(find "$BACKUP_DIR" -name "fences_backup_*.sql.gz" -mtime +$RETENTION_DAYS -print | wc -l)
    find "$BACKUP_DIR" -name "fences_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete
    DELETED=$((DELETED + DELETED_LOCAL))
    
    # Clean S3 backups if enabled
    if [ "$REMOTE_BACKUP_ENABLED" = true ]; then
        if command -v aws >/dev/null 2>&1; then
            DELETED_S3=$(aws s3 ls "s3://${S3_BUCKET}/${ENV}/" --region "$S3_REGION" 2>/dev/null | \
                        awk "/${DATE}-/ {print $4}" | \
                        xargs -I {} aws s3 rm "s3://${S3_BUCKET}/${ENV}/{}" --region "$S3_REGION" 2>/dev/null | \
                        wc -l)
            DELETED=$((DELETED + DELETED_S3))
        fi
    fi
    
    log_success "Deleted $DELETED old backup(s)"
    
    # List recent backups
    log "Recent backups:"
    ls -lh "$BACKUP_DIR"/*.sql.gz 2>/dev/null | tail -5
    
    if [ "$REMOTE_BACKUP_ENABLED" = true ]; then
        log "S3 backups:"
        if command -v aws >/dev/null 2>&1; then
            aws s3 ls "s3://${S3_BUCKET}/${ENV}/" --region "$S3_REGION" --human-readable 2>/dev/null | tail -5
        fi
    fi
    
    log "===================================="
    log "Backup process completed successfully"
    
    # Send completion notification
    send_notification "✅ Backup process completed\n\n📊 Total deleted: $DELETED\n📁 Latest backup: $(basename $BACKUP_PATH)" "Normal"
}

# Trap errors
trap 'log_error "Script interrupted"; exit 1' INT TERM

# Run main function
main "$@"
