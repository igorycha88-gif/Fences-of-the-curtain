-- Rollback: lag_length_float_to_int_mm
-- Date: 2026-03-11
-- Description: Revert LagType.length from Int (millimeters) back to Float (meters)

BEGIN;

-- Step 1: Create temporary column
ALTER TABLE "LagType" ADD COLUMN "length_new" DOUBLE PRECISION;

-- Step 2: Migrate data back (mm -> m)
UPDATE "LagType"
SET "length_new" = "length" / 1000.0;

-- Step 3: Drop current column
ALTER TABLE "LagType" DROP COLUMN "length";

-- Step 4: Rename new column
ALTER TABLE "LagType" RENAME COLUMN "length_new" TO "length";

-- Step 5: Set NOT NULL
ALTER TABLE "LagType" ALTER COLUMN "length" SET NOT NULL;

-- Step 6: Recreate index
DROP INDEX IF EXISTS "LagType_length_idx";
CREATE INDEX "LagType_length_idx" ON "LagType"("length");

COMMIT;
