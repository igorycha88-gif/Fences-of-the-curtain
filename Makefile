.PHONY: help install dev build start test lint clean docker-build docker-up docker-down docker-logs docker-restart docker-clean db-migrate db-seed db-reset db-connect redis-connect monitoring-up monitoring-down monitoring-logs

help:
	@echo "Available targets:"
	@echo "  make install      - Install dependencies"
	@echo "  make dev          - Start development server"
	@echo "  make build        - Build for production"
	@echo "  make start        - Start production server"
	@echo "  make test         - Run tests"
	@echo "  make lint         - Run linter"
	@echo "  make clean        - Clean build artifacts"
	@echo "  make docker-build  - Build Docker images"
	@echo "  make docker-up    - Start Docker containers"
	@echo "  make docker-down  - Stop Docker containers"
	@echo "  make docker-logs   - Show Docker logs"
	@echo "  make db-migrate   - Run database migrations"
	@echo "  make db-seed      - Seed database with initial data"
	@echo "  make db-reset     - Reset and seed database"
	@echo "  make db-connect    - Connect to PostgreSQL database"
	@echo "  make redis-connect - Connect to Redis"
	@echo "  make install-deps  - Install Docker dependencies"
	@echo ""
	@echo "Monitoring targets:"
	@echo "  make monitoring-up      - Start monitoring stack (Prometheus + Grafana)"
	@echo "  make monitoring-down    - Stop monitoring stack"
	@echo "  make monitoring-logs    - Show monitoring logs"
	@echo "  make monitoring-status  - Check monitoring status"
	@echo "  make monitoring-grafana - Reset Grafana admin password"
	@echo "  make monitoring-reload  - Reload Prometheus config"
	@echo "  make monitoring-backup  - Backup Prometheus data"
	@echo ""
	@echo "Combined targets:"
	@echo "  make all-up          - Start all services (app + monitoring)"
	@echo "  make all-down        - Stop all services"
	@echo "  make full-up         - Alias for all-up"
	@echo "  make full-down       - Alias for all-down"

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
	find . -name "*.log" -type f -delete

docker-build:
	docker-compose build
	docker-compose -f docker-compose.dev.yml build

docker-up:
	docker-compose up -d
	@echo "Waiting for services to be healthy..."
	sleep 10
	docker-compose ps

docker-down:
	docker-compose down
	docker-compose -f docker-compose.dev.yml down

docker-restart:
	docker-compose restart
	docker-compose -f docker-compose.dev.yml restart

docker-logs:
	docker-compose logs -f
	docker-compose -f docker-compose.dev.yml logs -f

docker-clean:
	docker-compose down -v
	docker-compose -f docker-compose.dev.yml down -v
	docker system prune -f
	docker volume prune -f
	@echo "Docker containers, volumes and unused resources cleaned"

db-migrate:
	docker-compose exec app npm run db:migrate
	docker-compose -f docker-compose.dev.yml exec app npm run db:migrate

db-seed:
	docker-compose exec app npm run db:seed
	docker-compose -f docker-compose.dev.yml exec app npm run db:seed

db-reset: docker-clean docker-up db-migrate db-seed

db-connect:
	docker-compose exec db psql -U postgres -d fences
	docker-compose -f docker-compose.dev.yml exec db psql -U postgres -d fences

redis-connect:
	docker-compose exec redis redis-cli -a $$(cat ./secrets/redis_password 2>/dev/null || echo "dev_redis_password_change_in_production")
	docker-compose -f docker-compose.dev.yml exec redis redis-cli -a $$(cat ./.env.dev 2>/dev/null | grep REDIS_PASSWORD | cut -d'=' -f2 || echo "dev_redis_password_change_in_production")

install-deps:
	@echo "Installing Docker dependencies..."
	@command -v docker >/dev/null 2>&1 || { echo "Docker not found. Please install Docker first."; exit 1; }
	@command -v docker-compose >/dev/null 2>&1 || { echo "Docker Compose not found. Please install Docker Compose first."; exit 1; }
	@echo "Creating monitoring directories..."
	@mkdir -p grafana/provisioning/datasources
	@mkdir -p grafana/provisioning/dashboards
	@echo "✓ Monitoring directories created"
	@echo "All dependencies installed!"

check-env:
	@test -f .env || (echo "Error: .env file not found. Copy .env.example to .env and configure it."; exit 1)
	@test -f secrets/redis_password || (echo "Warning: secrets/redis_password not found. Generate it with: openssl rand -base64 32 > secrets/redis_password"; exit 1)

health-check:
	@echo "Checking application health..."
	@curl -f http://localhost:3000/ && echo "✓ Application is healthy" || echo "✗ Application is unhealthy"
	@docker-compose ps | grep -q "healthy" && echo "✓ Docker containers are healthy" || echo "✗ Some Docker containers are unhealthy"

backup-db:
	@echo "Creating database backup..."
	@docker-compose exec db pg_dump -U postgres -d fences > backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "Backup created: backup_$$(date +%Y%m%d_%H%M%S).sql"

restore-db:
	@echo "Restoring database from backup..."
	@if [ -z "$(BACKUP_FILE)" ]; then \
		echo "Error: Please provide BACKUP_FILE parameter: make restore-db BACKUP_FILE=backup.sql"; \
		exit 1; \
	fi
	@docker-compose exec -T db psql -U postgres -d fences < $(BACKUP_FILE)
	@echo "Database restored from $(BACKUP_FILE)"

logs-app:
	docker-compose logs -f app

logs-db:
	docker-compose logs -f db

logs-redis:
	docker-compose logs -f redis

logs-nginx:
	docker-compose logs -f nginx

stats:
	docker stats

rebuild:
	docker-compose build --no-cache
	docker-compose -f docker-compose.dev.yml build --no-cache

prod-up:
	docker-compose up -d
	@echo "Waiting for services to be healthy..."
	sleep 15
	docker-compose ps
	@echo "Application is running at http://localhost:3000"

prod-down:
	docker-compose down

monitoring-up:
	@echo "Starting monitoring stack..."
	docker-compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d
	@echo "Waiting for services to be healthy..."
	sleep 15
	@echo "✓ Monitoring stack started"
	@echo ""
	@echo "Access points:"
	@echo "  Grafana:    http://localhost:3001 (admin/admin)"
	@echo "  Prometheus: http://localhost:9090"
	@echo "  Node Exporter: http://localhost:9100/metrics"
	@echo "  PostgreSQL Exporter: http://localhost:9187/metrics"
	@echo "  Redis Exporter: http://localhost:9121/metrics"
	@echo "  Nginx Exporter: http://localhost:9113/metrics"

monitoring-down:
	docker-compose -f docker-compose.monitoring.yml down
	@echo "Monitoring stack stopped"

monitoring-logs:
	docker-compose -f docker-compose.monitoring.yml logs -f

monitoring-status:
	docker-compose -f docker-compose.monitoring.yml ps
	@echo ""
	@echo "Access:"
	@echo "  Grafana:    http://localhost:3001"
	@echo "  Prometheus: http://localhost:9090"

monitoring-grafana:
	docker-compose -f docker-compose.monitoring.yml exec grafana grafana-cli admin reset-admin-password ${GRAFANA_PASSWORD:-admin}

monitoring-reload:
	docker-compose -f docker-compose.monitoring.yml exec prometheus kill -HUP 1
	@echo "Prometheus configuration reloaded"

monitoring-backup:
	@echo "Backing up Prometheus data..."
	@docker-compose -f docker-compose.monitoring.yml exec prometheus promtool tsdb dump /prometheus | gzip > prometheus_backup_$$(date +%Y%m%d_%H%M%S).json.gz
	@echo "Backup created: prometheus_backup_$$(date +%Y%m%d_%H%M%S).json.gz"

all-up:
	@echo "Starting all services (application + monitoring)..."
	docker-compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d
	@echo "Waiting for services to be healthy..."
	sleep 15
	docker-compose ps
	@echo "✓ All services started"
	@echo ""
	@echo "Application: http://localhost:3000"
	@echo "Grafana:    http://localhost:3001 (admin/admin)"
	@echo "Prometheus: http://localhost:9090"

all-down:
	docker-compose -f docker-compose.yml down
	docker-compose -f docker-compose.monitoring.yml down
	@echo "All services stopped"

full-up: all-up

full-down: all-down
