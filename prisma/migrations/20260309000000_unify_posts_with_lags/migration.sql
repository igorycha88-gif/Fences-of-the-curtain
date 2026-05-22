-- Migration: unify_posts_with_lags_structure
-- Date: 2026-03-09
-- Description: Unify PostType structure with LagType - replace availableLengths/purchasePrices with single length and purchasePricePerMeter

BEGIN;

-- Step 1: Add new columns
ALTER TABLE "PostType" ADD COLUMN "length" Float;
ALTER TABLE "PostType" ADD COLUMN "purchasePricePerMeter" Float;

-- Step 2: Migrate data from availableLengths and purchasePrices
-- Extract first length from availableLengths array
UPDATE "PostType"
SET 
  "length" = COALESCE(
    ("availableLengths"::jsonb -> 0 ->> 'length')::float,
    1.0
  ),
  "purchasePricePerMeter" = (
    ("purchasePrices"::jsonb -> 0 ->> 'purchasePrice')::float
  )
WHERE "availableLengths" IS NOT NULL OR "purchasePrices" IS NOT NULL;

-- Step 3: Set default length for records without availableLengths
UPDATE "PostType"
SET "length" = 1.0
WHERE "length" IS NULL;

-- Step 4: Make length column NOT NULL
ALTER TABLE "PostType" ALTER COLUMN "length" SET NOT NULL;

-- Step 5: Drop old columns
ALTER TABLE "PostType" DROP COLUMN "availableLengths";
ALTER TABLE "PostType" DROP COLUMN "purchasePrices";

-- Step 6: Create index for new length field
CREATE INDEX "PostType_length_idx" ON "PostType"("length");

COMMIT;
