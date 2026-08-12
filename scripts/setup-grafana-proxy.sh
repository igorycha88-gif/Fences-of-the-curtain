#!/bin/bash
set -euo pipefail

# ==============================================================================
# setup-grafana-proxy.sh
# ------------------------------------------------------------------------------
# Настраивает Grafana за reverse proxy: https://zabor-i-naves.ru/grafana
# И закрывает прямые порты monitoring-стека, привязывая их к 127.0.0.1
# (БЕЗ ufw/iptables — на уровне приложения, через listen-address).
#
# Запускается НА VPS (37.143.13.196) под root.
#
# Что делает:
#   1. Копирует docker/nginx/snippets/grafana.conf → /etc/nginx/snippets/grafana.conf
#   2. Копирует docker/.htpasswd → /etc/nginx/.htpasswd (basic auth)
#   3. Внедряет include snippets/grafana.conf в HTTPS-server nginx
#   4. nginx -t + бэкап + автооткат при ошибке
#   5. Пересоздаёт ВЕСЬ monitoring-стек с новыми env (listen 127.0.0.1)
#   6. Ждёт healthcheck Grafana + Prometheus
#   7. nginx -s reload
#   8. Smoke-тесты (включая проверку что порты закрыты)
#
# БЕЗ фаервола — безопасность достигается привязкой listen-address к 127.0.0.1
# в docker-compose.monitoring.yml. Это безопаснее ufw/iptables (см. ЧТЗ FR-004').
#
# Usage:
#   bash scripts/setup-grafana-proxy.sh             # применить
#   bash scripts/setup-grafana-proxy.sh --rollback  # откат nginx include
#
# ЧТЗ: требования/ЧТЗ_Grafana_Reverse_Proxy.md
# ==============================================================================

APP_DIR="/root/Fences-of-the-curtain"
LOG_DIR="/var/log/grafana-proxy"
SNIPPET_SRC="${APP_DIR}/docker/nginx/snippets/grafana.conf"
SNIPPET_DST="/etc/nginx/snippets/grafana.conf"
HTPASSWD_SRC="${APP_DIR}/docker/.htpasswd"
HTPASSWD_DST="/etc/nginx/.htpasswd"
NGINX_SNIPPETS_DIR="/etc/nginx/snippets"
GRAFANA_MARKER="# grafana-proxy-include"
HEALTH_TIMEOUT=60
HEALTH_INTERVAL=3

MODE="apply"
for arg in "$@"; do
    case "$arg" in
        --rollback) MODE="rollback" ;;
        --help|-h)
            sed -n '2,30p' "$0"
            exit 0
            ;;
    esac
done

mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/setup-$(date +%Y%m%d-%H%M%S).log"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"; }
err() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1" >&2 | tee -a "$LOG_FILE"; }
fatal() { err "$1"; exit 1; }

# ------------------------------------------------------------------
# Поиск HTTPS site-конфига nginx (с listen 443 ssl)
# ------------------------------------------------------------------
find_https_site_conf() {
    local candidate=""
    # sites-enabled: имена обычно без расширения (например 'fences', 'default')
    # conf.d: обычно '*.conf'
    for d in /etc/nginx/sites-enabled /etc/nginx/conf.d; do
        [ -d "$d" ] || continue
        for f in "$d"/*; do
            [ -f "$f" ] || continue
            case "$f" in *fences-upstream.conf) continue ;; esac
            if grep -qE 'listen[[:space:]]+443' "$f"; then
                candidate="$f"
                break 2
            fi
        done
    done
    echo "$candidate"
}

# ------------------------------------------------------------------
# Внедрение include snippets/grafana.conf внутрь HTTPS-server
# ------------------------------------------------------------------
inject_include() {
    local site_conf="$1"

    if grep -qF "$GRAFANA_MARKER" "$site_conf"; then
        log "  include snippets/grafana.conf уже присутствует в $site_conf — skip"
        return 0
    fi

    # Бэкап кладём ВНЕ sites-enabled (nginx читает все файлы там как активные конфиги,
    # даже *.bak — это вызовет conflicting server_name).
    local bak_dir="/root/backups/grafana-proxy"
    mkdir -p "$bak_dir"
    local bak="${bak_dir}/$(basename "$site_conf").bak.$(date +%Y%m%d%H%M%S)"
    cp -a "$site_conf" "$bak"
    log "  Backup: $bak"

    if sed -n '/server[[:space:]]*{/,/^}/p' "$site_conf" | grep -qE 'listen[[:space:]]+443'; then
        local tmp="${site_conf}.tmp.$$"
        awk -v marker="$GRAFANA_MARKER" -v snippet='    include /etc/nginx/snippets/grafana.conf;' '
            $0 ~ /listen[[:space:]]+443/ && !done {
                print
                print "        " marker
                print snippet
                done=1
                next
            }
            { print }
        ' "$site_conf" > "$tmp"
        mv "$tmp" "$site_conf"
        log "  Include вставлен после 'listen 443' в $site_conf"
    else
        fatal "Не найден 'listen 443' в $site_conf — конфиг не тронут"
    fi
}

# ------------------------------------------------------------------
# Удаление include (rollback)
# ------------------------------------------------------------------
remove_include() {
    local site_conf="$1"
    if ! grep -qF "$GRAFANA_MARKER" "$site_conf"; then
        log "  Include отсутствует в $site_conf — ничего не делать"
        return 0
    fi
    cp -a "$site_conf" "${site_conf}.bak.$(date +%Y%m%d%H%M%S)"
    local tmp="${site_conf}.tmp.$$"
    grep -vF "$GRAFANA_MARKER" "$site_conf" | grep -vF 'include /etc/nginx/snippets/grafana.conf;' > "$tmp"
    mv "$tmp" "$site_conf"
    log "  Include удалён из $site_conf"
}

# ------------------------------------------------------------------
# nginx-конфиг: применить/откатить include с автооткатом при ошибке
# ------------------------------------------------------------------
nginx_apply_or_revert() {
    local action="$1"
    local site_conf
    site_conf="$(find_https_site_conf)"
    [ -n "$site_conf" ] || fatal "HTTPS site-конфиг не найден в /etc/nginx/{sites-enabled,conf.d}/"

    log "Site-конфиг: $site_conf"

    case "$action" in
        apply)  inject_include "$site_conf" ;;
        revert) remove_include "$site_conf" ;;
    esac

    if ! nginx -t 2>&1 | tee -a "$LOG_FILE"; then
        err "nginx -t FAILED — автооткат"
        local latest_bak
        latest_bak="$(ls -1t "${site_conf}.bak."* 2>/dev/null | head -1 || true)"
        if [ -n "$latest_bak" ]; then
            cp -a "$latest_bak" "$site_conf"
            log "Восстановлено из $latest_bak"
        fi
        nginx -t 2>&1 | tee -a "$LOG_FILE" || true
        fatal "Конфигурация отклонена, изменения откатаны"
    fi

    nginx -s reload 2>&1 | tee -a "$LOG_FILE" || systemctl reload nginx
    log "nginx reload OK"
}

# ------------------------------------------------------------------
# Healthcheck сервиса по URL
# ------------------------------------------------------------------
wait_health() {
    local url="$1"
    local name="$2"
    local elapsed=0
    while [ $elapsed -lt $HEALTH_TIMEOUT ]; do
        if curl -sf --max-time 3 "$url" >/dev/null 2>&1; then
            log "  $name health OK (${elapsed}s)"
            return 0
        fi
        sleep $HEALTH_INTERVAL
        elapsed=$((elapsed + HEALTH_INTERVAL))
    done
    return 1
}

# ------------------------------------------------------------------
# Пересоздание ВООГО monitoring-стека (применение новых listen-address)
# ------------------------------------------------------------------
recreate_monitoring() {
    cd "$APP_DIR"
    [ -f docker-compose.monitoring.yml ] || fatal "docker-compose.monitoring.yml не найден в $APP_DIR"
    log "  docker compose -f docker-compose.monitoring.yml up -d --force-recreate"
    docker compose -f docker-compose.monitoring.yml up -d --force-recreate 2>&1 | tee -a "$LOG_FILE"
}

# ==============================================================================
# MAIN
# ==============================================================================

log "============================================"
log "SETUP GRAFANA PROXY + LOOPBACK BINDING — mode: $MODE"
log "(без ufw/iptables — безопасность через listen-address=127.0.0.1)"
log "============================================"

cd "$APP_DIR" || fatal "APP_DIR не существует: $APP_DIR"

if [ "$MODE" = "rollback" ]; then
    log "[ROLLBACK] Шаг 1/2: nginx revert (include удаляется, сайт продолжает работать)"
    nginx_apply_or_revert revert
    log "[ROLLBACK] Шаг 2/2: проверка сайта"
    curl -sI http://127.0.0.1/ | head -1 | tee -a "$LOG_FILE"
    log "ROLLBACK ЧАСТИЧНЫЙ: nginx include удалён."
    log "Monitoring-порты остаются привязаны к 127.0.0.1. Для отката listening — "
    log "верните '0.0.0.0' в docker-compose.monitoring.yml и запустите recreate."
    exit 0
fi

# ----- APPLY -----
log "[1/6] Установка snippet + .htpasswd"
mkdir -p "$NGINX_SNIPPETS_DIR"
[ -f "$SNIPPET_SRC" ] || fatal "Snippet не найден: $SNIPPET_SRC"
install -m 0644 "$SNIPPET_SRC" "$SNIPPET_DST"
log "  $SNIPPET_DST обновлён"

[ -f "$HTPASSWD_SRC" ] || fatal ".htpasswd не найден: $HTPASSWD_SRC"
install -m 0644 "$HTPASSWD_SRC" "$HTPASSWD_DST"
log "  $HTPASSWD_DST обновлён"

log "[2/6] Внедрение include в HTTPS-server nginx + reload"
nginx_apply_or_revert apply

log "[3/6] Пересоздание monitoring-стека (применение listen-address=127.0.0.1)"
recreate_monitoring

log "[4/6] Healthcheck Grafana + Prometheus (до 60 сек каждый)"
if ! wait_health "http://127.0.0.1:3002/api/health" "Grafana"; then
    err "Grafana не прошла healthcheck"
    docker logs fences-grafana --tail=30 2>&1 | tee -a "$LOG_FILE"
    fatal "Grafana unhealthy"
fi
if ! wait_health "http://127.0.0.1:9090/-/healthy" "Prometheus"; then
    err "Prometheus не прошёл healthcheck"
    docker logs fences-prometheus --tail=30 2>&1 | tee -a "$LOG_FILE"
    fatal "Prometheus unhealthy"
fi

log "[5/6] Проверка listen-address (порты НЕ на 0.0.0.0)"
BAD=0
for port in 3002 9090 9100 9113 9121 9187; do
    if ss -tlnp 2>/dev/null | grep -qE "0\.0\.0\.0:${port}|\*:${port}"; then
        log "  ❌ порт $port всё ещё слушает на 0.0.0.0/* — проверьте compose"
        BAD=$((BAD+1))
    else
        log "  ✅ порт $port не доступен внешне (привязан к 127.0.0.1 или не слушает)"
    fi
done

log "[6/6] Smoke-тесты через https://zabor-i-naves.ru"
PASS=0; FAIL=0
check() {
    local desc="$1"; local cmd="$2"; local expect="$3"
    local code
    code="$(eval "$cmd" 2>/dev/null || echo "000")"
    if [ "$code" = "$expect" ]; then
        log "  ✅ $desc ($code)"; PASS=$((PASS+1))
    else
        log "  ❌ $desc (got $code, expected $expect)"; FAIL=$((FAIL+1))
    fi
}

check "Grafana через sub-path без auth → 401" \
    'curl -s -o /dev/null -w "%{http_code}" --max-time 5 https://zabor-i-naves.ru/grafana/' \
    "401"
check "Сайт главная (200)" \
    'curl -s -o /dev/null -w "%{http_code}" --max-time 5 https://zabor-i-naves.ru/' \
    "200"
if curl -sf --max-time 5 https://zabor-i-naves.ru/api/health | grep -q '"status":"ok"'; then
    log "  ✅ /api/health → {\"status\":\"ok\"}"; PASS=$((PASS+1))
else
    log "  ❌ /api/health не вернул status:ok"; FAIL=$((FAIL+1))
fi
log "  Smoke: PASS=$PASS FAIL=$FAIL"

log "============================================"
if [ "$FAIL" -eq 0 ] && [ "$BAD" -eq 0 ]; then
    log "✅ SETUP ЗАВЕРШЁН УСПЕШНО"
    log "Grafana: https://zabor-i-naves.ru/grafana"
    log "  Слой 1: nginx basic auth (пользователь admin, пароль из docker/.htpasswd)"
    log "  Слой 2: Grafana login (admin / \$GRAFANA_ADMIN_PASSWORD)"
    log "Monitoring-порты (3002/9090/9100/9113/9121/9187): доступны только локально"
    log "Доступ к Prometheus UI: ssh -L 9090:127.0.0.1:9090 root@37.143.13.196"
    log "Откат nginx-части: bash scripts/setup-grafana-proxy.sh --rollback"
else
    log "⚠️  SETUP завершён с предупреждениями (FAIL=$FAIL, listening-bad=$BAD)"
    log "Проверьте лог: $LOG_FILE"
fi
log "============================================"
exit 0
