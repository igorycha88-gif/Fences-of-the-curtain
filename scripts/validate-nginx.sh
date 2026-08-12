#!/bin/bash
set -euo pipefail

# ==============================================================================
# validate-nginx.sh — проверка синтаксиса nginx-конфигов репозитория
# ------------------------------------------------------------------------------
# Запускается в CI/локально. Не требует установленного nginx на хосте —
# использует docker run nginx:stable-alpine nginx -t.
#
# Проверяемые файлы:
#   docker/nginx.conf
#   docker/nginx.optimized.conf
#   docker/nginx/snippets/grafana.conf (как snippet через тестовый wrapper)
# ==============================================================================

IMAGE="nginx:stable-alpine"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DOCKER_DIR="${REPO_ROOT}/docker"

if ! command -v docker >/dev/null 2>&1; then
    echo "ERROR: docker не установлен. Установите Docker или запустите в CI." >&2
    exit 2
fi

# Убеждаемся что образ есть локально (быстро, если уже скачан)
if ! docker image inspect "$IMAGE" >/dev/null 2>&1; then
    echo "Pulling $IMAGE ..."
    docker pull -q "$IMAGE"
fi

FAIL=0

# Создаём временные stub-сертификаты, чтобы nginx -t не падал на отсутствии /etc/nginx/ssl/*
TMP_CERTS="$(mktemp -d)"
trap 'rm -rf "$TMP_CERTS"' EXIT
openssl req -x509 -newkey rsa:2048 -keyout "${TMP_CERTS}/privkey.pem" \
    -out "${TMP_CERTS}/fullchain.pem" -days 1 -nodes \
    -subj "/CN=localhost" >/dev/null 2>&1 || {
    echo "ERROR: не удалось сгенерировать stub-сертификаты (openssl отсутствует?)" >&2
    exit 2
}

# Полные конфиги репозитория могут ссылаться на /etc/nginx/ssl/fullchain.pem,
# модули brotli (которого нет в stock nginx:stable-alpine) и т.д.
# Подменяем пути к сертификатам на stub, комментируем brotli — это позволяет
# проверить СИНТАКСИС нашей правки (location /grafana/), не завися от среды продакшена.
check_full_conf() {
    local conf="$1"
    local rel="${conf#$REPO_ROOT/}"
    echo "--- Проверка: $rel ---"
    local tmp
    tmp="${TMP_CERTS}/prepared-$(basename "$conf")"
    local cert_in_container="/etc/nginx/ssl-stub/fullchain.pem"
    local key_in_container="/etc/nginx/ssl-stub/privkey.pem"
    {
        echo "# Auto-prepared by validate-nginx.sh"
            sed -e "s|/etc/nginx/ssl/fullchain.pem|${cert_in_container}|g" \
            -e "s|/etc/nginx/ssl/privkey.pem|${key_in_container}|g" \
            -e "s|/etc/nginx/ssl/cert.pem|${cert_in_container}|g" \
            -e "s|/etc/nginx/ssl/key.pem|${key_in_container}|g" \
            -e 's|^\([[:space:]]*brotli[^;]*;\)|# STRIPPED FOR VALIDATION (no brotli module): \1|' \
            -e 's|fences-app:|127.0.0.1:|g' \
            -e 's|fences-grafana:|127.0.0.1:|g' \
            "$conf"
    } > "$tmp"

    local out
    if out=$(docker run --rm \
        -v "${tmp}:/etc/nginx/nginx.conf:ro" \
        -v "${TMP_CERTS}:/etc/nginx/ssl-stub:ro" \
        "$IMAGE" nginx -t 2>&1); then
        echo "  ✅ $rel — OK (синтаксис валиден)"
        echo "$out" | grep -vE '^(/docker|10-listen|15-local|20-envsubst|30-tune)' | sed 's/^/    /'
    else
        echo "  ❌ $rel — FAIL"
        echo "$out" | grep -vE '^(/docker|10-listen|15-local|20-envsubst|30-tune)' | sed 's/^/    /'
        FAIL=$((FAIL+1))
    fi
}

check_snippet() {
    local snippet="$1"
    local rel="${snippet#$REPO_ROOT/}"
    echo "--- Проверка snippet: $rel ---"
    # Оборачиваем snippet в минимальный server-блок и валидируем
    local tmp
    tmp="$(mktemp -d)"
    cat > "${tmp}/nginx.conf" <<EOF
events { worker_connections 64; }
http {
    server {
        listen 80;
        location / { return 200; }
        $(cat "$snippet")
    }
}
EOF
    local out
    if out=$(docker run --rm -v "${tmp}/nginx.conf:/etc/nginx/nginx.conf:ro" "$IMAGE" nginx -t 2>&1); then
        echo "  ✅ $rel — OK (snippet валиден в http/server context)"
        echo "$out" | sed 's/^/    /'
    else
        echo "  ❌ $rel — FAIL"
        echo "$out" | sed 's/^/    /'
        FAIL=$((FAIL+1))
    fi
    rm -rf "$tmp"
}

# Полные конфиги
[ -f "${DOCKER_DIR}/nginx.conf" ]          && check_full_conf "${DOCKER_DIR}/nginx.conf"
[ -f "${DOCKER_DIR}/nginx.optimized.conf" ] && check_full_conf "${DOCKER_DIR}/nginx.optimized.conf"

# Snippets
if [ -d "${DOCKER_DIR}/nginx/snippets" ]; then
    for snip in "${DOCKER_DIR}/nginx/snippets"/*.conf; do
        [ -f "$snip" ] && check_snippet "$snip"
    done
fi

echo "============================================"
if [ "$FAIL" -eq 0 ]; then
    echo "✅ Все nginx-конфиги валидны"
    exit 0
else
    echo "❌ $FAIL конфиг(ов) с ошибками"
    exit 1
fi
