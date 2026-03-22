-- ОЧИСТКА ПРОД БАЗЫ ДАННЫХ
-- ⚠️ БЕЗ ВОЗМОЖНОСТИ ОТМЕНЫ ⚠️

BEGIN;

-- Отключаем проверку внешних ключей для массового удаления
SET session_replication_role = 'replica';

-- 1. Очистка связанных данных
DELETE FROM "audit_logs";
DELETE FROM "PriceHistory";
DELETE FROM "ReferenceChangeLog";

-- 2. Очистка заявок (Order)
DELETE FROM "Order";

-- 3. Очистка расчетов (FenceEstimate)
DELETE FROM "FenceEstimate";

-- Включаем обратно проверку внешних ключей
SET session_replication_role = 'origin';

COMMIT;

-- Проверка количества удаленных записей
SELECT 'Orders remaining' as table_name, COUNT(*) as count FROM "Order"
UNION ALL
SELECT 'FenceEstimates remaining', COUNT(*) FROM "FenceEstimate"
UNION ALL
SELECT 'AuditLogs remaining', COUNT(*) FROM "audit_logs"
UNION ALL
SELECT 'PriceHistory remaining', COUNT(*) FROM "PriceHistory"
UNION ALL
SELECT 'ReferenceChangeLog remaining', COUNT(*) FROM "ReferenceChangeLog";
