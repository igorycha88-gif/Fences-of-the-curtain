-- Migration: lag_length_float_to_int_mm
-- Date: 2026-03-11
-- Description: Convert LagType.length from Float (meters) to Int (millimeters)

BEGIN;

-- Step 1: Create temporary column
ALTER TABLE "LagType" ADD COLUMN "length_new" INTEGER;

-- Step 2: Migrate data (m -> mm)
UPDATE "LagType"
SET "length_new" = CEIL("length" * 1000)::INTEGER;

-- Step 3: Drop old column
ALTER TABLE "LagType" DROP COLUMN "length";

-- Step 4: Rename new column
ALTER TABLE "LagType" RENAME COLUMN "length_new" TO "length";

-- Step 5: Set NOT NULL
ALTER TABLE "LagType" ALTER COLUMN "length" SET NOT NULL;

-- Step 6: Recreate index
DROP INDEX IF EXISTS "LagType_length_idx";
CREATE INDEX "LagType_length_idx" ON "LagType"("length");

COMMIT;
