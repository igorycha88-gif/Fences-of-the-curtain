-- Миграция: Конвертация postSpacing из метров (Float) в миллиметры (Int)
-- 1. Конвертировать существующие данные
UPDATE "FenceType" SET "postSpacing" = ROUND("postSpacing" * 1000);

-- 2. Изменить тип колонки с Double Precision на Integer
ALTER TABLE "FenceType" ALTER COLUMN "postSpacing" TYPE INTEGER;
