-- Migration: update_profnastil_coating_values
-- Date: 2026-03-10
-- Description: Update coating values in ProfnastilType table

BEGIN;

-- Step 1: Update records with "двустороннее" in name
UPDATE "ProfnastilType"
SET "coating" = 'Полимерное (двустороннее)',
    "updatedAt" = CURRENT_TIMESTAMP
WHERE LOWER("name") LIKE '%двустороннее%';

-- Step 2: Update records with "одностороннее" in name
UPDATE "ProfnastilType"
SET "coating" = 'Полимерное (одностороннее)',
    "updatedAt" = CURRENT_TIMESTAMP
WHERE LOWER("name") LIKE '%одностороннее%'
  AND "coating" != 'Полимерное (двустороннее)';

-- Step 3: Remaining records -> galvanized
UPDATE "ProfnastilType"
SET "coating" = 'Оцинковка',
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "coating" NOT IN ('Полимерное (одностороннее)', 'Полимерное (двустороннее)');

-- Logging
DO $$
DECLARE
    cnt_bilateral INTEGER;
    cnt_unilateral INTEGER;
    cnt_galvanized INTEGER;
BEGIN
    SELECT COUNT(*) INTO cnt_bilateral FROM "ProfnastilType" WHERE "coating" = 'Полимерное (двустороннее)';
    SELECT COUNT(*) INTO cnt_unilateral FROM "ProfnastilType" WHERE "coating" = 'Полимерное (одностороннее)';
    SELECT COUNT(*) INTO cnt_galvanized FROM "ProfnastilType" WHERE "coating" = 'Оцинковка';
    
    RAISE NOTICE 'Migration complete: % bilateral, % unilateral, % galvanized', 
                 cnt_bilateral, cnt_unilateral, cnt_galvanized;
END $$;

COMMIT;
