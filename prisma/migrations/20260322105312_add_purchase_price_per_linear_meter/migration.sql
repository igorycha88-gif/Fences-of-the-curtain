-- Добавление нового поля purchasePricePerLinearMeter
ALTER TABLE "ProfnastilType"
ADD COLUMN "purchasePricePerLinearMeter" DOUBLE PRECISION;

-- Комментарий к полю
COMMENT ON COLUMN "ProfnastilType"."purchasePricePerLinearMeter"
IS 'Стоимость закупки за метр погонный (₽/м.п.)';

-- Индекс для фильтрации (опционально)
CREATE INDEX IF NOT EXISTS "ProfnastilType_purchasePricePerLinearMeter_idx"
ON "ProfnastilType"("purchasePricePerLinearMeter")
WHERE "purchasePricePerLinearMeter" IS NOT NULL;
