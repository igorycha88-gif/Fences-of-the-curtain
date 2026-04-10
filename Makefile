.PHONY: help install dev build start test lint clean \
  docker-build docker-up docker-down docker-logs docker-restart docker-clean \
  db-migrate db-seed db-reset db-connect redis-connect \
  monitoring-up monitoring-down monitoring-logs monitoring-status monitoring-reload \
  prod-deploy prod-up prod-down prod-logs prod-rebuild \
  health-check backup-db restore-db logs-app logs-db logs-redis logs-nginx \
  stats clean-all

help:
	@echo "Available targets:"
	@echo ""
	@echo "Development:"
	@echo "  make install      - Install dependencies"
	@echo "  make dev          - Start development server"
	@echo "  make build        - Build for production (local)"
	@echo "  make start        - Start production server (local)"
	@echo "  make test         - Run tests"
	@echo "  make lint         - Run linter"
	@echo "  make clean        - Clean build artifacts"
	@echo ""
	@echo "Docker (local):"
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
	@echo "  make monitoring-up      - Start monitoring stack"
	@echo "  make monitoring-down    - Stop monitoring stack"
	@echo "  make monitoring-logs    - Show monitoring logs"
	@echo "  make monitoring-status  - Check monitoring status"
	@echo "  make monitoring-reload  - Reload Prometheus config"
	@echo ""
	@echo "Database:"
	@echo "  make db-migrate   - Run database migrations"
	@echo "  make db-connect    - Connect to PostgreSQL"
	@echo "  make backup-db     - Backup database"
	@echo "  make restore-db    - Restore database (BACKUP_FILE=)"
	@echo ""
	@echo "Utilities:"
	@echo "  make health-check  - Check application health"
	@echo "  make stats         - Show Docker resource usage"
	@echo "  make clean-all     - Full cleanup"

COMPOSE_FILES = -f docker-compose.yml -f docker-compose.monitoring.yml
APP_PORT = 3001

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

docker-build:
	docker compose build

docker-up:
	docker compose -f docker-compose.dev.yml up -d
	@echo "Waiting for services..."
	sleep 10
	docker compose -f docker-compose.dev.yml ps

docker-down:
	docker compose -f docker-compose.dev.yml down

docker-restart:
	docker compose -f docker-compose.dev.yml restart

docker-logs:
	docker compose -f docker-compose.dev.yml logs -f

docker-clean:
	docker compose -f docker-compose.dev.yml down -v
	docker system prune -f
	docker volume prune -f

prod-deploy:
	@echo "Running production deploy..."
	bash scripts/deploy-production.sh

prod-up:
	docker compose $(COMPOSE_FILES) up -d
	@echo "Waiting for services..."
	sleep 15
	docker compose $(COMPOSE_FILES) ps
	@echo ""
	@echo "App:      http://localhost:$(APP_PORT)"
	@echo "Grafana:  http://localhost:3002"
	@echo "Prometheus: http://localhost:9090"

prod-down:
	docker compose $(COMPOSE_FILES) down
	@echo "All services stopped"

prod-logs:
	docker compose $(COMPOSE_FILES) logs -f

prod-rebuild:
	docker compose $(COMPOSE_FILES) build --no-cache
	docker compose $(COMPOSE_FILES) up -d --force-recreate
	@echo "Waiting for health checks..."
	sleep 15
	docker compose $(COMPOSE_FILES) ps

monitoring-up: prod-up

monitoring-down:
	docker compose -f docker-compose.monitoring.yml down
	@echo "Monitoring stack stopped"

monitoring-logs:
	docker compose -f docker-compose.monitoring.yml logs -f

monitoring-status:
	docker compose $(COMPOSE_FILES) ps
	@echo ""
	@echo "Endpoints:"
	@echo "  App:          http://localhost:$(APP_PORT)"
	@echo "  Grafana:      http://localhost:3002"
	@echo "  Prometheus:   http://localhost:9090"
	@echo "  Health:       http://localhost:$(APP_PORT)/api/health"

monitoring-reload:
	docker compose -f docker-compose.monitoring.yml exec prometheus kill -HUP 1
	@echo "Prometheus config reloaded"

db-migrate:
	npx prisma migrate deploy
	npx prisma generate

db-connect:
	psql -U postgres -d fences -h 127.0.0.1 -p 5432

redis-connect:
	redis-cli -h 127.0.0.1 -p 6379

health-check:
	@echo "Checking health..."
	@curl -sf http://127.0.0.1:$(APP_PORT)/api/health | python3 -m json.tool 2>/dev/null || echo "App unreachable"
	@echo ""
	@docker compose $(COMPOSE_FILES) ps --format "table {{.Name}}\t{{.Status}}" 2>/dev/null || true

backup-db:
	@mkdir -p backups
	pg_dump -U postgres -h 127.0.0.1 -d fences > "backups/db_$$(date +%Y%m%d_%H%M%S).sql"
	@echo "Backup created in backups/"

restore-db:
	@if [ -z "$(BACKUP_FILE)" ]; then echo "Usage: make restore-db BACKUP_FILE=backups/db.sql"; exit 1; fi
	psql -U postgres -h 127.0.0.1 -d fences < $(BACKUP_FILE)
	@echo "Restored from $(BACKUP_FILE)"

logs-app:
	docker compose $(COMPOSE_FILES) logs -f app

logs-db:
	@echo "Host PostgreSQL - use: journalctl -u postgresql"

logs-redis:
	@echo "Host Redis - use: journalctl -u redis-server"

logs-nginx:
	@echo "Host Nginx - use: journalctl -u nginx"

stats:
	docker stats

clean-all: clean docker-clean
	@echo "Full cleanup complete"
