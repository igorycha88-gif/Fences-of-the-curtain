#!/bin/bash

set -e

APP_DIR="/root/Fences-of-the-curtain"
CACHE_DIR="$APP_DIR/.cache"
CACHE_FILE="$CACHE_DIR/node_modules_cache.tar.gz"
CACHE_METADATA="$CACHE_DIR/cache_metadata.json"

mkdir -p "$CACHE_DIR"

log_cache() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] [CACHE] $1"
}

show_usage() {
  echo "Usage: $0 [command]"
  echo ""
  echo "Commands:"
  echo "  save    - Cache current node_modules"
  echo "  restore - Restore node_modules from cache"
  echo "  clear   - Clear cache"
  echo "  status  - Show cache status"
  echo "  help    - Show this help message"
  echo ""
  echo "Examples:"
  echo "  $0 save     # Save current node_modules to cache"
  echo "  $0 restore  # Restore node_modules from cache"
  echo "  $0 status   # Show cache information"
}

check_directory() {
  if [ ! -d "$APP_DIR" ]; then
    log_cache "ERROR: Application directory not found: $APP_DIR"
    exit 1
  fi
}

save_cache() {
  check_directory
  cd "$APP_DIR"
  
  if [ ! -d "node_modules" ]; then
    log_cache "ERROR: node_modules directory not found!"
    exit 1
  fi
  
  log_cache "Saving node_modules to cache..."
  START_TIME=$(date +%s)
  
  tar czf "$CACHE_FILE.tmp" node_modules/
  
  if [ $? -eq 0 ]; then
    mv "$CACHE_FILE.tmp" "$CACHE_FILE"
    CACHE_SIZE=$(du -h "$CACHE_FILE" | cut -f1)
    NODE_SIZE=$(du -sh node_modules | cut -f1)
    
    END_TIME=$(date +%s)
    SAVE_TIME=$((END_TIME - START_TIME))
    
    cat > "$CACHE_METADATA" << EOF
{
  "created_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "save_time_seconds": $SAVE_TIME,
  "cache_size": "$CACHE_SIZE",
  "node_modules_size": "$NODE_SIZE",
  "package_version": "$(cat package.json | grep '"version"' | head -1 | cut -d'"' -f4)"
}
EOF
    
    log_cache "✓ Cache saved successfully"
    log_cache "  Cache size: $CACHE_SIZE"
    log_cache "  Node modules size: $NODE_SIZE"
    log_cache "  Save time: ${SAVE_TIME}s"
    log_cache "  Metadata saved to: $CACHE_METADATA"
  else
    log_cache "ERROR: Failed to create cache!"
    rm -f "$CACHE_FILE.tmp"
    exit 1
  fi
}

restore_cache() {
  check_directory
  cd "$APP_DIR"
  
  if [ ! -f "$CACHE_FILE" ]; then
    log_cache "WARNING: Cache file not found: $CACHE_FILE"
    log_cache "Run '$0 save' first to create cache"
    exit 1
  fi
  
  log_cache "Restoring node_modules from cache..."
  START_TIME=$(date +%s)
  
  if [ -d "node_modules" ]; then
    log_cache "Moving existing node_modules to node_modules.old..."
    rm -rf node_modules.old
    mv node_modules node_modules.old
  fi
  
  tar xzf "$CACHE_FILE"
  
  if [ $? -eq 0 ]; then
    rm -rf node_modules.old
    END_TIME=$(date +%s)
    RESTORE_TIME=$((END_TIME - START_TIME))
    
    log_cache "✓ Cache restored successfully"
    log_cache "  Restore time: ${RESTORE_TIME}s"
  else
    log_cache "ERROR: Failed to restore cache!"
    if [ -d "node_modules.old" ]; then
      log_cache "Restoring original node_modules..."
      rm -rf node_modules
      mv node_modules.old node_modules
    fi
    exit 1
  fi
}

clear_cache() {
  check_directory
  
  log_cache "Clearing cache..."
  
  if [ -f "$CACHE_FILE" ]; then
    rm -f "$CACHE_FILE"
    log_cache "✓ Cache file removed"
  fi
  
  if [ -f "$CACHE_METADATA" ]; then
    rm -f "$CACHE_METADATA"
    log_cache "✓ Cache metadata removed"
  fi
  
  log_cache "✓ Cache cleared"
}

show_status() {
  check_directory
  
  log_cache "Cache Status:"
  echo ""
  
  if [ -f "$CACHE_FILE" ]; then
    CACHE_SIZE=$(du -h "$CACHE_FILE" | cut -f1)
    log_cache "✓ Cache file exists: $CACHE_FILE"
    log_cache "  Size: $CACHE_SIZE"
    
    if [ -f "$CACHE_METADATA" ]; then
      log_cache ""
      log_cache "Cache Metadata:"
      cat "$CACHE_METADATA" | while read line; do
        log_cache "  $line"
      done
    fi
    
    log_cache ""
    log_cache "Node modules status:"
    if [ -d "node_modules" ]; then
      NODE_SIZE=$(du -sh node_modules | cut -f1)
      NODE_COUNT=$(find node_modules -type d | wc -l | tr -d ' ')
      log_cache "  ✓ node_modules exists"
      log_cache "    Size: $NODE_SIZE"
      log_cache "    Directories: $NODE_COUNT"
    else
      log_cache "  ✗ node_modules not found"
    fi
  else
    log_cache "✗ Cache file not found"
    log_cache "  Run '$0 save' to create cache"
  fi
  
  echo ""
  log_cache "Disk space:"
  df -h "$CACHE_DIR" | tail -1 | awk '{print "  Available: " $4 " / " $2 " (" $5 " used)"}'
}

case "$1" in
  save)
    save_cache
    ;;
  restore)
    restore_cache
    ;;
  clear)
    clear_cache
    ;;
  status)
    show_status
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
