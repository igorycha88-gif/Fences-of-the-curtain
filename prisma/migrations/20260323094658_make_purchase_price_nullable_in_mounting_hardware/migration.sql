-- Сделать purchasePrice nullable в таблице MountingHardware
ALTER TABLE "MountingHardware" ALTER COLUMN "purchasePrice" DROP NOT NULL;
