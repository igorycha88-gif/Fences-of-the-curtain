#!/bin/bash

set -e

APP_DIR="/root/Fences-of-the-curtain"
LOG_DIR="/var/log/fences-deploy"
DEPLOY_LOG="$LOG_DIR/deploy.log"
MIGRATION_LOG="$LOG_DIR/migration-rollback-$(date +%Y%m%d_%H%M%S).log"

mkdir -p "$LOG_DIR"

log_rollback() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] [MIGRATION ROLLBACK] $1" | tee -a "$DEPLOY_LOG" | tee -a "$MIGRATION_LOG"
}

show_usage() {
  echo "Usage: $0 [command] [target]"
  echo ""
  echo "Commands:"
  echo "  status           - Show current migration status"
  echo "  rollback [name]  - Rollback specific migration by name"
  echo "  rollback-last    - Rollback the last applied migration"
  echo "  resolve [name]   - Mark migration as resolved (for manual rollback)"
  echo "  list             - List all migrations with status"
  echo "  help             - Show this help message"
  echo ""
  echo "Examples:"
  echo "  $0 status                      # Show migration status"
  echo "  $0 rollback 20240101_init      # Rollback specific migration"
  echo "  $0 rollback-last               # Rollback last migration"
  echo "  $0 resolve 20240101_init       # Mark migration as resolved"
}

check_directory() {
  if [ ! -d "$APP_DIR" ]; then
    log_rollback "ERROR: Application directory not found: $APP_DIR"
    exit 1
  fi
}

show_status() {
  check_directory
  cd "$APP_DIR"
  
  log_rollback "=== MIGRATION STATUS ==="
  npx prisma migrate status || {
    log_rollback "ERROR: Failed to get migration status"
    exit 1
  }
}

list_migrations() {
  check_directory
  cd "$APP_DIR"
  
  log_rollback "=== ALL MIGRATIONS ==="
  
  if [ ! -d "prisma/migrations" ]; then
    log_rollback "ERROR: No migrations directory found"
    exit 1
  fi
  
  echo ""
  echo "Applied migrations:"
  npx prisma migrate status | grep "Applied" || echo "  No applied migrations"
  
  echo ""
  echo "Pending migrations:"
  npx prisma migrate status | grep "Pending" || echo "  No pending migrations"
  
  echo ""
  echo "All migration folders:"
  ls -1t prisma/migrations/ | grep -v "^_" | while read dir; do
    echo "  - $dir"
  done
}

rollback_last() {
  check_directory
  cd "$APP_DIR"
  
  log_rollback "=== ROLLING BACK LAST MIGRATION ==="
  
  local status
  status=$(npx prisma migrate status 2>&1 || true)
  
  log_rollback "Current status:"
  echo "$status" | tee -a "$DEPLOY_LOG" | tee -a "$MIGRATION_LOG"
  
  local last_migration
  last_migration=$(echo "$status" | grep "Applied" | tail -1 | awk '{print $1}' || echo "")
  
  if [ -z "$last_migration" ]; then
    log_rollback "ERROR: No applied migrations found to rollback"
    exit 1
  fi
  
  log_rollback "Last applied migration: $last_migration"
  log_rollback "Rolling back $last_migration..."
  
  local response
  read -p "Are you sure you want to rollback migration '$last_migration'? This cannot be undone! (yes/no): " response
  
  if [ "$response" != "yes" ]; then
    log_rollback "Rollback cancelled"
    exit 0
  fi
  
  log_rollback "Creating backup before rollback..."
  local backup_file="$APP_DIR/backup_before_rollback_$(date +%Y%m%d_%H%M%S).sql"
  sudo -u postgres pg_dump -U postgres fences > "$backup_file" || {
    log_rollback "WARNING: Backup failed, continuing with rollback..."
  }
  
  if [ -f "$backup_file" ]; then
    log_rollback "✓ Backup created: $backup_file"
  fi
  
  log_rollback "Executing rollback..."
  npx prisma migrate resolve --rolled-back "$last_migration" || {
    log_rollback "ERROR: Failed to mark migration as rolled back"
    log_rollback "You may need to manually revert the changes or restore from backup: $backup_file"
    exit 1
  }
  
  log_rollback "✓ Migration '$last_migration' marked as rolled back"
  log_rollback "✓ ROLLBACK SUCCESSFUL"
  log_rollback "Backup available at: $backup_file"
}

rollback_specific() {
  local target_migration="$1"
  
  check_directory
  cd "$APP_DIR"
  
  if [ -z "$target_migration" ]; then
    log_rollback "ERROR: Migration name required"
    echo ""
    show_usage
    exit 1
  fi
  
  log_rollback "=== ROLLING BACK MIGRATION: $target_migration ==="
  
  local status
  status=$(npx prisma migrate status 2>&1 || true)
  
  if ! echo "$status" | grep -q "$target_migration"; then
    log_rollback "ERROR: Migration '$target_migration' not found in status"
    exit 1
  fi
  
  log_rollback "Creating backup before rollback..."
  local backup_file="$APP_DIR/backup_before_rollback_${target_migration}_$(date +%Y%m%d_%H%M%S).sql"
  sudo -u postgres pg_dump -U postgres fences > "$backup_file" || {
    log_rollback "WARNING: Backup failed, continuing with rollback..."
  }
  
  if [ -f "$backup_file" ]; then
    log_rollback "✓ Backup created: $backup_file"
  fi
  
  log_rollback "Marking migration '$target_migration' as rolled back..."
  npx prisma migrate resolve --rolled-back "$target_migration" || {
    log_rollback "ERROR: Failed to mark migration as rolled back"
    log_rollback "You may need to manually revert the changes or restore from backup: $backup_file"
    exit 1
  }
  
  log_rollback "✓ Migration '$target_migration' marked as rolled back"
  log_rollback "✓ ROLLBACK SUCCESSFUL"
  log_rollback "Backup available at: $backup_file"
}

resolve_migration() {
  local target_migration="$1"
  
  check_directory
  cd "$APP_DIR"
  
  if [ -z "$target_migration" ]; then
    log_rollback "ERROR: Migration name required"
    echo ""
    show_usage
    exit 1
  fi
  
  log_rollback "=== RESOLVING MIGRATION: $target_migration ==="
  log_rollback "Marking migration as resolved (after manual rollback)..."
  
  npx prisma migrate resolve --applied "$target_migration" || {
    log_rollback "ERROR: Failed to resolve migration"
    exit 1
  }
  
  log_rollback "✓ Migration '$target_migration' marked as resolved"
}

case "$1" in
  status)
    show_status
    ;;
  list)
    list_migrations
    ;;
  rollback)
    rollback_specific "$2"
    ;;
  rollback-last)
    rollback_last
    ;;
  resolve)
    resolve_migration "$2"
    ;;
  help|--help|-h)
    show_usage
    exit 0
    ;;
  *)
    echo "ERROR: Unknown command '$1'"
    echo ""
    show_usage
    exit 1
    ;;
esac
