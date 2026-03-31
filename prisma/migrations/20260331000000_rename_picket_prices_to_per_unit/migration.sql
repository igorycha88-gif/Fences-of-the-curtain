-- Rename picket price fields from per-meter to per-unit
-- Eurofence (Евроштакетник) is sold per piece, not per linear meter

-- Drop old per-meter columns
ALTER TABLE "PicketType" DROP COLUMN IF EXISTS "purchasePricePerMeter";
ALTER TABLE "PicketType" DROP COLUMN IF EXISTS "retailPricePerMeter";

-- Add new per-unit columns (nullable for purchase, required for retail with default)
ALTER TABLE "PicketType" ADD COLUMN "purchasePricePerUnit" DOUBLE PRECISION;
ALTER TABLE "PicketType" ADD COLUMN "retailPricePerUnit" DOUBLE PRECISION NOT NULL DEFAULT 0;
