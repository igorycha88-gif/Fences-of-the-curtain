# OpenTelemetry Configuration for Next.js
# This enables distributed tracing and performance monitoring

# Environment variables to add to .env or docker-compose.yml
# OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317
# OTEL_SERVICE_NAME=fences-app
# OTEL_RESOURCE_ATTRIBUTES=service.name=fences-app,deployment.environment=production

# Installation
npm install @opentelemetry/api @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node
