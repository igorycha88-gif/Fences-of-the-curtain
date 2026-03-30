#!/bin/bash

set -e

REQUIRED_VARS=(
    "DATABASE_URL"
    "NEXTAUTH_SECRET"
    "NEXTAUTH_URL"
    "REDIS_PASSWORD"
    "POSTGRES_PASSWORD"
)

WARNING_VARS=(
    "SMTP_HOST"
    "SMTP_USER"
    "SMTP_PASS"
)

echo "🔍 Validating environment configuration..."

if [ ! -f .env ]; then
    echo "❌ Error: .env file not found"
    echo "   Please copy .env.example to .env and configure it"
    exit 1
fi

MISSING_VARS=()
for var in "${REQUIRED_VARS[@]}"; do
    if ! grep -q "^${var}=" .env || grep -q "^${var}=$" .env; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    echo "❌ Error: Missing required environment variables:"
    for var in "${MISSING_VARS[@]}"; do
        echo "   - $var"
    done
    echo ""
    echo "   Please add them to your .env file"
    exit 1
fi

if [ ! -f secrets/redis_password ]; then
    echo "⚠️  Warning: secrets/redis_password not found"
    echo "   Creating it from REDIS_PASSWORD in .env..."
    grep "^REDIS_PASSWORD=" .env | cut -d'=' -f2 > secrets/redis_password
    chmod 600 secrets/redis_password
    echo "✓ Created secrets/redis_password"
fi

echo ""
for var in "${WARNING_VARS[@]}"; do
    if ! grep -q "^${var}=" .env || grep -q "^${var}=$" .env; then
        echo "⚠️  Warning: $var is not set - email features may not work"
    fi
done

if grep -q "NEXTAUTH_URL=http://localhost" .env; then
    echo "⚠️  Warning: NEXTAUTH_URL is set to localhost"
    echo "   For production, set it to your actual domain"
fi

echo ""
echo "✅ Environment validation passed"
