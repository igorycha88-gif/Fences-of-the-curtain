#!/bin/sh
set -e

echo "[dev-entrypoint] Installing dependencies..."
npm install --legacy-peer-deps 2>&1 | tail -5

echo "[dev-entrypoint] Generating Prisma client..."
npx prisma generate 2>&1 | tail -3

echo "[dev-entrypoint] Applying database schema..."
npx prisma db push --accept-data-loss 2>&1 | tail -3

echo "[dev-entrypoint] Seeding database..."
npm run db:seed 2>&1 | tail -5

echo "[dev-entrypoint] Ensuring upload directory..."
mkdir -p /app/public/uploads/portfolio

echo "[dev-entrypoint] Starting dev server..."
exec npm run dev
