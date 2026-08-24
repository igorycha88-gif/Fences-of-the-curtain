-- Readonly monitoring user for postgres_exporter (ЧТЗ §4.4).
-- Run on the site VPS as postgres superuser:
--   psql -U postgres -f monitoring-user.sql
-- Replace REPLACE_WITH_STRONG_PASSWORD with the password stored in .env
-- (MONITORING_PG_DSN), e.g.: openssl rand -hex 24

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'site_monitor') THEN
    CREATE ROLE site_monitor LOGIN PASSWORD 'REPLACE_WITH_STRONG_PASSWORD';
  ELSE
    ALTER ROLE site_monitor LOGIN PASSWORD 'REPLACE_WITH_STRONG_PASSWORD';
  END IF;
END
$$;

GRANT CONNECT ON DATABASE fences TO site_monitor;
GRANT pg_monitor TO site_monitor;
