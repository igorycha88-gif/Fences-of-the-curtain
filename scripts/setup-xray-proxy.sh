#!/bin/bash
set -euo pipefail

VPS_HOST="${1:-37.143.13.196}"
VPS_USER="${2:-root}"
CONFIG_LOCAL="configs/xray-client.json"
CONFIG_REMOTE="/usr/local/etc/xray/config.json"

echo "=== Xray VLESS Client Setup for Production VPS ==="
echo "Target: ${VPS_USER}@${VPS_HOST}"
echo ""

ssh "${VPS_USER}@${VPS_HOST}" bash -s <<'REMOTE_SCRIPT'
set -euo pipefail

echo "[1/6] Installing Xray-core..."
if command -v xray &>/dev/null; then
  echo "  Xray already installed: $(xray version | head -1)"
else
  bash -c "$(curl -L https://github.com/XTLS/Xray-install/raw/main/install-release.sh)" @ install
  echo "  Xray installed successfully"
fi

echo "[2/6] Creating log directory..."
mkdir -p /var/log/xray
chown nobody:nogroup /var/log/xray 2>/dev/null || true

echo "[3/6] Backing up existing config..."
if [ -f /usr/local/etc/xray/config.json ]; then
  cp /usr/local/etc/xray/config.json /usr/local/etc/xray/config.json.bak.$(date +%Y%m%d%H%M%S)
  echo "  Backup created"
fi

echo "[4/6] Waiting for config upload..."
REMOTE_SCRIPT

echo "[upload] Copying xray-client.json to VPS..."
scp "$CONFIG_LOCAL" "${VPS_USER}@${VPS_HOST}:${CONFIG_REMOTE}"
echo "  Config uploaded"

ssh "${VPS_USER}@${VPS_HOST}" bash -s <<'REMOTE_SCRIPT2'
set -euo pipefail

echo "[5/6] Starting Xray service..."
systemctl daemon-reload
systemctl enable xray
systemctl restart xray

echo "  Waiting for Xray to start..."
sleep 2

if systemctl is-active --quiet xray; then
  echo "  Xray service: ACTIVE"
else
  echo "  Xray service: FAILED"
  journalctl -u xray --no-pager -n 20
  exit 1
fi

echo "[6/6] Testing proxy connection..."
for i in 1 2 3; do
  if curl -s --max-time 10 --proxy http://127.0.0.1:1080 https://api.telegram.org/ 2>/dev/null | grep -q '"ok"'; then
    echo "  Proxy test: SUCCESS (attempt $i)"
    break
  elif [ "$i" -eq 3 ]; then
    echo "  Proxy test: FAILED after 3 attempts"
    echo "  Checking Xray logs..."
    tail -20 /var/log/xray/error.log 2>/dev/null || journalctl -u xray --no-pager -n 20
    exit 1
  else
    echo "  Proxy test: attempt $i failed, retrying in 3s..."
    sleep 3
  fi
done

echo ""
echo "=== Setup Complete ==="
echo "Xray HTTP proxy: http://127.0.0.1:1080"
echo "Status: $(systemctl is-active xray)"
echo ""
echo "Add to your .env:"
echo "  TELEGRAM_PROXY_URL=http://127.0.0.1:1080"
REMOTE_SCRIPT2
