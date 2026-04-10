.PHONY: help install dev build start test lint clean \
  dev-up dev-down dev-logs dev-restart dev-clean dev-build dev-full \
  docker-build docker-up docker-down docker-logs docker-restart docker-clean \
  db-migrate db-seed db-reset db-connect db-connect-dev redis-connect \
  monitoring-up monitoring-down monitoring-logs monitoring-status monitoring-reload \
  prod-deploy prod-up prod-down prod-logs prod-rebuild \
  health-check health-check-dev backup-db restore-db logs-app logs-db logs-redis logs-nginx \
  stats clean-all

help:
	@echo "Available targets:"
	@echo ""
	@echo "Development (Docker):"
	@echo "  make dev-up        - Start dev stack (app + db + redis)"
	@echo "  make dev-full      - Start dev stack + monitoring (all-in-one)"
	@echo "  make dev-build     - Build dev images"
	@echo "  make dev-down      - Stop dev stack"
	@echo "  make dev-logs      - Show dev logs"
	@echo "  make dev-restart   - Restart dev stack"
	@echo "  make dev-clean     - Remove dev containers and volumes"
	@echo ""
	@echo "Development (local Node):"
	@echo "  make install       - Install dependencies"
	@echo "  make dev           - Start development server (local)"
	@echo "  make build         - Build for production (local)"
	@echo "  make start         - Start production server (local)"
	@echo "  make test          - Run tests"
	@echo "  make lint          - Run linter"
	@echo "  make clean         - Clean build artifacts"
	@echo ""
	@echo "Docker (legacy aliases):"
	@echo "  make docker-build  - Build Docker images"
	@echo "  make docker-up     - Start Docker containers"
	@echo "  make docker-down   - Stop Docker containers"
	@echo "  make docker-logs   - Show Docker logs"
	@echo "  make docker-restart - Restart Docker containers"
	@echo "  make docker-clean   - Remove containers and volumes"
	@echo ""
	@echo "Production (on VPS, host networking):"
	@echo "  make prod-deploy   - Full deploy: build + restart + healthcheck"
	@echo "  make prod-up       - Start all production services"
	@echo "  make prod-down     - Stop all production services"
	@echo "  make prod-logs     - Show production logs"
	@echo "  make prod-rebuild  - Rebuild and restart all services"
	@echo ""
	@echo "Monitoring:"
	@echo "  make monitoring-up      - Start monitoring stack (standalone for dev)"
	@echo "  make monitoring-down    - Stop monitoring stack"
	@echo "  make monitoring-logs    - Show monitoring logs"
	@echo "  make monitoring-status  - Check monitoring status"
	@echo "  make monitoring-reload  - Reload Prometheus config"
	@echo ""
	@echo "Database:"
	@echo "  make db-migrate    - Run database migrations"
	@echo "  make db-connect    - Connect to production PostgreSQL (port 5432)"
	@echo "  make db-connect-dev - Connect to dev PostgreSQL (port 5433)"
	@echo "  make backup-db     - Backup database"
	@echo "  make restore-db    - Restore database (BACKUP_FILE=)"
	@echo ""
	@echo "Utilities:"
	@echo "  make health-check     - Check production app health (port 3001)"
	@echo "  make health-check-dev - Check dev app health (port 3000)"
	@echo "  make stats            - Show Docker resource usage"
	@echo "  make clean-all        - Full cleanup"

COMPOSE_DEV = -f docker-compose.dev.yml
COMPOSE_PROD = -f docker-compose.yml -f docker-compose.monitoring.yml
COMPOSE_MONITORING = -f docker-compose.monitoring.standalone.yml
APP_PORT_DEV = 3000
APP_PORT_PROD = 3001

install:
	npm install

dev:
	npm run dev

build:
	npm run build

start:
	npm run start

test:
	npm test

lint:
	npm run lint

clean:
	rm -rf .next
	rm -rf node_modules/.cache
	rm -rf tsconfig.tsbuildinfo
	rm -rf tsconfig.test.tsbuildinfo
	find . -name "*.log" -type f -not -path "./node_modules/*" -delete

# ── Dev stack (app + db + redis) ──

dev-build:
	docker compose $(COMPOSE_DEV) build

dev-up:
	docker compose $(COMPOSE_DEV) up -d
	@echo "Waiting for services to become healthy..."
	@sleep 5
	@for i in 1 2 3 4 5 6; do \
		HEALTH=$$(curl -sf --max-time 3 http://localhost:$(APP_PORT_DEV)/api/health 2>/dev/null || echo ""); \
		if echo "$$HEALTH" | grep -q '"ok"'; then echo "✓ App is healthy"; break; fi; \
		echo "  Waiting... ($$i/6)"; sleep 5; \
	done
	@echo ""
	@echo "Dev environment:"
	@echo "  App:      http://localhost:$(APP_PORT_DEV)"
	@echo "  DB:       localhost:5433"
	@echo "  Health:   http://localhost:$(APP_PORT_DEV)/api/health"
	@docker compose $(COMPOSE_DEV) ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"

dev-full: dev-up
	@echo "Starting monitoring stack..."
	docker compose $(COMPOSE_MONITORING) up -d
	@sleep 5
	@echo ""
	@echo "Full dev environment:"
	@echo "  App:        http://localhost:$(APP_PORT_DEV)"
	@echo "  DB:         localhost:5433"
	@echo "  Grafana:    http://localhost:3002"
	@echo "  Prometheus: http://localhost:9090"
	@docker compose $(COMPOSE_MONITORING) ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"

dev-down:
	docker compose $(COMPOSE_MONITORING) down 2>/dev/null || true
	docker compose $(COMPOSE_DEV) down

dev-logs:
	docker compose $(COMPOSE_DEV) logs -f

dev-restart:
	docker compose $(COMPOSE_DEV) restart

dev-clean:
	docker compose $(COMPOSE_MONITORING) down -v 2>/dev/null || true
	docker compose $(COMPOSE_DEV) down -v
	docker system prune -f

# ── Legacy Docker aliases (backward compat) ──

docker-build: dev-build

docker-up: dev-up

docker-down: dev-down

docker-restart: dev-restart

docker-logs: dev-logs

docker-clean: dev-clean

# ── Production ──

prod-deploy:
	@echo "Running production deploy..."
	bash scripts/deploy-production.sh

prod-up:
	docker compose $(COMPOSE_PROD) up -d
	@echo "Waiting for services..."
	@sleep 15
	docker compose $(COMPOSE_PROD) ps
	@echo ""
	@echo "App:      http://localhost:$(APP_PORT_PROD)"
	@echo "Grafana:  http://localhost:3002"
	@echo "Prometheus: http://localhost:9090"

prod-down:
	docker compose $(COMPOSE_PROD) down
	@echo "All services stopped"

prod-logs:
	docker compose $(COMPOSE_PROD) logs -f

prod-rebuild:
	docker compose $(COMPOSE_PROD) build --no-cache
	docker compose $(COMPOSE_PROD) up -d --force-recreate
	@echo "Waiting for health checks..."
	@sleep 15
	docker compose $(COMPOSE_PROD) ps

# ── Monitoring (standalone for dev) ──

monitoring-up:
	docker compose $(COMPOSE_MONITORING) up -d
	@sleep 5
	@echo "Monitoring started:"
	@echo "  Grafana:    http://localhost:3002"
	@echo "  Prometheus: http://localhost:9090"
	@docker compose $(COMPOSE_MONITORING) ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"

monitoring-down:
	docker compose $(COMPOSE_MONITORING) down
	@echo "Monitoring stack stopped"

monitoring-logs:
	docker compose $(COMPOSE_MONITORING) logs -f

monitoring-status:
	@docker compose $(COMPOSE_MONITORING) ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || true
	@docker compose $(COMPOSE_DEV) ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || true
	@echo ""
	@echo "Endpoints:"
	@echo "  App:          http://localhost:$(APP_PORT_DEV)"
	@echo "  Grafana:      http://localhost:3002"
	@echo "  Prometheus:   http://localhost:9090"
	@echo "  Health:       http://localhost:$(APP_PORT_DEV)/api/health"

monitoring-reload:
	docker compose $(COMPOSE_MONITORING) exec prometheus kill -HUP 1
	@echo "Prometheus config reloaded"

# ── Database ──

db-migrate:
	npx prisma migrate deploy
	npx prisma generate

db-connect:
	psql -U postgres -d fences -h 127.0.0.1 -p 5432

db-connect-dev:
	docker compose $(COMPOSE_DEV) exec db psql -U postgres -d fences

redis-connect:
	docker compose $(COMPOSE_DEV) exec redis redis-cli -a "$$REDIS_PASSWORD"

health-check:
	@echo "Checking production health..."
	@curl -sf http://127.0.0.1:$(APP_PORT_PROD)/api/health | python3 -m json.tool 2>/dev/null || echo "App unreachable"
	@echo ""
	@docker compose $(COMPOSE_PROD) ps --format "table {{.Name}}\t{{.Status}}" 2>/dev/null || true

health-check-dev:
	@echo "Checking dev health..."
	@curl -sf http://localhost:$(APP_PORT_DEV)/api/health | python3 -m json.tool 2>/dev/null || echo "App unreachable"
	@echo ""
	@docker compose $(COMPOSE_DEV) ps --format "table {{.Name}}\t{{.Status}}" 2>/dev/null || true

backup-db:
	@mkdir -p backups
	pg_dump -U postgres -h 127.0.0.1 -d fences > "backups/db_$$(date +%Y%m%d_%H%M%S).sql"
	@echo "Backup created in backups/"

backup-db-dev:
	@mkdir -p backups
	docker compose $(COMPOSE_DEV) exec -T db pg_dump -U postgres fences > "backups/db_dev_$$(date +%Y%m%d_%H%M%S).sql"
	@echo "Backup created in backups/"

restore-db:
	@if [ -z "$(BACKUP_FILE)" ]; then echo "Usage: make restore-db BACKUP_FILE=backups/db.sql"; exit 1; fi
	psql -U postgres -h 127.0.0.1 -d fences < $(BACKUP_FILE)
	@echo "Restored from $(BACKUP_FILE)"

logs-app:
	docker compose $(COMPOSE_DEV) logs -f app

logs-db:
	docker compose $(COMPOSE_DEV) logs -f db

logs-redis:
	docker compose $(COMPOSE_DEV) logs -f redis

logs-nginx:
	@echo "Host Nginx - use: journalctl -u nginx"

stats:
	docker stats

clean-all: clean dev-clean
	@echo "Full cleanup complete"
