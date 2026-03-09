-- Migration: refactor_lag_type_structure
-- Date: 2026-03-08
-- Description: Упрощение структуры LagType - переход к одной фиксированной длине

BEGIN;

-- Шаг 1: Добавить новые поля
ALTER TABLE "LagType" ADD COLUMN "length" Float;
ALTER TABLE "LagType" ADD COLUMN "purchasePricePerMeter" Float;

-- Шаг 2: Мигрировать данные
UPDATE "LagType"
SET 
  "length" = COALESCE(
    ("availableLengths"::jsonb -> 0 ->> 'length')::float,
    1.0
  ),
  "purchasePricePerMeter" = (
    ("purchasePrices"::jsonb -> 0 ->> 'purchasePrice')::float
  )
WHERE "availableLengths" IS NOT NULL OR "purchasePrices" IS NOT NULL;

-- Шаг 3: Установить длину по умолчанию для записей без availableLengths
UPDATE "LagType"
SET "length" = 1.0
WHERE "length" IS NULL;

-- Шаг 4: Сделать поле length обязательным
ALTER TABLE "LagType" ALTER COLUMN "length" SET NOT NULL;

-- Шаг 5: Удалить старые поля
ALTER TABLE "LagType" DROP COLUMN "availableLengths";
ALTER TABLE "LagType" DROP COLUMN "purchasePrices";

-- Шаг 6: Создать индекс для нового поля
CREATE INDEX "LagType_length_idx" ON "LagType"("length");

COMMIT;
