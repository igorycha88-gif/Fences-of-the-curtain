-- Migration: add_picket_profile_and_coating
-- Date: 2026-03-31
-- Description: Add PicketProfileType and PicketCoating tables, migrate PicketType to use FK relations

BEGIN;

-- Step 1: Create PicketProfileType table
CREATE TABLE "PicketProfileType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PicketProfileType_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PicketProfileType_name_key" ON "PicketProfileType"("name");
CREATE INDEX "PicketProfileType_active_idx" ON "PicketProfileType"("active");
CREATE INDEX "PicketProfileType_sortOrder_idx" ON "PicketProfileType"("sortOrder");

-- Step 2: Create PicketCoating table
CREATE TABLE "PicketCoating" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PicketCoating_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PicketCoating_name_key" ON "PicketCoating"("name");
CREATE INDEX "PicketCoating_active_idx" ON "PicketCoating"("active");
CREATE INDEX "PicketCoating_sortOrder_idx" ON "PicketCoating"("sortOrder");

-- Step 3: Seed default PicketProfileType values
INSERT INTO "PicketProfileType" ("id", "name", "description", "sortOrder") VALUES
    (gen_random_uuid(), 'П-образный', 'Классический П-образный профиль', 1),
    (gen_random_uuid(), 'М-образный', 'М-образный профиль с дополнительным ребром жёсткости', 2),
    (gen_random_uuid(), 'Полукруглый', 'Полукруглый (волнистый) профиль', 3),
    (gen_random_uuid(), 'Фигурный', 'Фигурный профиль с декоративными элементами', 4);

-- Step 4: Seed default PicketCoating values from existing coating data
INSERT INTO "PicketCoating" ("id", "name", "description", "sortOrder")
SELECT 
    gen_random_uuid(),
    coating,
    NULL,
    ROW_NUMBER() OVER (ORDER BY coating)
FROM (SELECT DISTINCT coating FROM "PicketType" WHERE coating IS NOT NULL AND coating != '') AS sub;

-- If no existing coatings found, add defaults
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM "PicketCoating") THEN
        INSERT INTO "PicketCoating" ("id", "name", "description", "sortOrder") VALUES
            (gen_random_uuid(), 'Оцинковка', NULL, 1),
            (gen_random_uuid(), 'Полимерное (одностороннее)', NULL, 2),
            (gen_random_uuid(), 'Полимерное (двустороннее)', NULL, 3);
    END IF;
END $$;

-- Step 5: Add nullable FK columns to PicketType
ALTER TABLE "PicketType" ADD COLUMN "profileTypeId" TEXT;
ALTER TABLE "PicketType" ADD COLUMN "coatingId" TEXT;

-- Step 6: Map existing coating strings to new PicketCoating records
UPDATE "PicketType" pt
SET "coatingId" = pc.id
FROM "PicketCoating" pc
WHERE pc.name = pt.coating;

-- Step 7: Set default profileTypeId for all existing records
UPDATE "PicketType"
SET "profileTypeId" = (SELECT id FROM "PicketProfileType" ORDER BY "sortOrder" LIMIT 1)
WHERE "profileTypeId" IS NULL;

-- Step 8: Set default coatingId for any remaining NULL records
UPDATE "PicketType"
SET "coatingId" = (SELECT id FROM "PicketCoating" WHERE name = 'Оцинковка' LIMIT 1)
WHERE "coatingId" IS NULL;

-- Step 9: Make FK columns NOT NULL
ALTER TABLE "PicketType" ALTER COLUMN "profileTypeId" SET NOT NULL;
ALTER TABLE "PicketType" ALTER COLUMN "coatingId" SET NOT NULL;

-- Step 10: Add foreign key constraints
ALTER TABLE "PicketType" ADD CONSTRAINT "PicketType_profileTypeId_fkey" 
    FOREIGN KEY ("profileTypeId") REFERENCES "PicketProfileType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PicketType" ADD CONSTRAINT "PicketType_coatingId_fkey" 
    FOREIGN KEY ("coatingId") REFERENCES "PicketCoating"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Step 11: Create indexes
CREATE INDEX "PicketType_profileTypeId_idx" ON "PicketType"("profileTypeId");
CREATE INDEX "PicketType_coatingId_idx" ON "PicketType"("coatingId");
CREATE INDEX "PicketType_length_idx" ON "PicketType"("length");

COMMIT;
