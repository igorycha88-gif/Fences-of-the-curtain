-- Добавляем поле retailPricePerUnit в PostType
ALTER TABLE "PostType" ADD COLUMN "retailPricePerUnit" DOUBLE PRECISION;

-- Добавляем поле purchasePricePerUnit в PostType
ALTER TABLE "PostType" ADD COLUMN "purchasePricePerUnit" DOUBLE PRECISION;

-- Заполняем retailPricePerUnit значениями из pricePerMeter * length
UPDATE "PostType" SET "retailPricePerUnit" = "pricePerMeter" * "length";

-- Заполняем purchasePricePerUnit значениями из purchasePricePerMeter * length (если есть)
UPDATE "PostType" SET "purchasePricePerUnit" = "purchasePricePerMeter" * "length" WHERE "purchasePricePerMeter" IS NOT NULL;
