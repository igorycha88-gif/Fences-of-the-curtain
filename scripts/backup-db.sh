#!/bin/bash

# Database Backup Script for Production
# Run manually or via cron: 0 2 * * * /root/Fences-of-the-curtain/scripts/backup-db.sh

set -e

APP_DIR="/root/Fences-of-the-curtain"
BACKUP_DIR="/var/backups/fences"
RETENTION_DAYS=30
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="fences_backup_${DATE}.sql.gz"
LOG_FILE="/var/log/fences-backup.log"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Create backup directory if not exists
mkdir -p "$BACKUP_DIR"

log "Starting database backup..."

# Create backup
if sudo -u postgres pg_dump -U postgres fences | gzip > "${BACKUP_DIR}/${BACKUP_FILE}"; then
    log "${GREEN}✓ Backup created: ${BACKUP_DIR}/${BACKUP_FILE}${NC}"
    
    # Show backup size
    SIZE=$(du -h "${BACKUP_DIR}/${BACKUP_FILE}" | cut -f1)
    log "Backup size: $SIZE"
else
    log "${RED}✗ Backup failed!${NC}"
    exit 1
fi

# Clean old backups
log "Cleaning backups older than $RETENTION_DAYS days..."
DELETED=$(find "$BACKUP_DIR" -name "fences_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete -print | wc -l)
log "Deleted $DELETED old backup(s)"

# List recent backups
log "Recent backups:"
ls -lh "$BACKUP_DIR"/*.sql.gz 2>/dev/null | tail -5

log "Backup completed successfully"
