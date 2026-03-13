-- Rename price fields in LagType table
ALTER TABLE "LagType" RENAME COLUMN "retailPricePerMeter" TO "retailPricePerUnit";
ALTER TABLE "LagType" RENAME COLUMN "purchasePricePerMeter" TO "purchasePricePerUnit";

-- Rename price fields in ProfnastilType table
ALTER TABLE "ProfnastilType" RENAME COLUMN "retailPricePerMeter" TO "retailPricePerUnit";
ALTER TABLE "ProfnastilType" RENAME COLUMN "purchasePricePerMeter" TO "purchasePricePerUnit";
