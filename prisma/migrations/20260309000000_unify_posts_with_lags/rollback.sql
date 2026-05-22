-- Rollback: unify_posts_with_lags_structure
-- Date: 2026-03-09
-- Description: Rollback PostType structure changes - restore availableLengths and purchasePrices

BEGIN;

-- Step 1: Restore old columns
ALTER TABLE "PostType" ADD COLUMN "availableLengths" JsonB;
ALTER TABLE "PostType" ADD COLUMN "purchasePrices" JsonB;

-- Step 2: Migrate data back (create arrays from single values)
UPDATE "PostType"
SET 
  "availableLengths" = jsonb_build_array(
    jsonb_build_object('length', "length", 'pricePerMeter', "pricePerMeter")
  ),
  "purchasePrices" = CASE 
    WHEN "purchasePricePerMeter" IS NOT NULL 
    THEN jsonb_build_array(
      jsonb_build_object('length', "length", 'purchasePrice', "purchasePricePerMeter")
    )
    ELSE NULL
  END;

-- Step 3: Drop new columns
ALTER TABLE "PostType" DROP COLUMN "length";
ALTER TABLE "PostType" DROP COLUMN "purchasePricePerMeter";

-- Step 4: Drop index
DROP INDEX IF EXISTS "PostType_length_idx";

COMMIT;
