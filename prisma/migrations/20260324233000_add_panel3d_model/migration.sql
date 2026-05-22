-- Create Panel3D table
CREATE TABLE IF NOT EXISTS "Panel3D" (
    id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    panelHeight DOUBLE PRECISION NOT NULL,
    panelWidth DOUBLE PRECISION NOT NULL,
    panelArea DOUBLE PRECISION,
    rodDiameter DOUBLE PRECISION NOT NULL,
    cellWidth DOUBLE PRECISION NOT NULL,
    cellHeight DOUBLE PRECISION NOT NULL,
    purchasePricePerUnit DOUBLE PRECISION,
    retailPricePerUnit DOUBLE PRECISION NOT NULL,
    image TEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    validFrom TIMESTAMP(3),
    validUntil TIMESTAMP(3),
    priority INTEGER NOT NULL DEFAULT 0,
    createdAt TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add primary key if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Panel3D_pkey') THEN
        ALTER TABLE "Panel3D" ADD CONSTRAINT "Panel3D_pkey" PRIMARY KEY ("id");
    END IF;
END $$;

-- Add panel3d fields to FenceEstimate if not exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'FenceEstimate' AND column_name = 'panel3dId') THEN
        ALTER TABLE "FenceEstimate" ADD COLUMN "panel3dId" TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'FenceEstimate' AND column_name = 'panel3dNomenclatureName') THEN
        ALTER TABLE "FenceEstimate" ADD COLUMN "panel3dNomenclatureName" TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'FenceEstimate' AND column_name = 'panel3dTotal') THEN
        ALTER TABLE "FenceEstimate" ADD COLUMN "panel3dTotal" DOUBLE PRECISION NOT NULL DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'FenceEstimate' AND column_name = 'panel3dInstallationTotal') THEN
        ALTER TABLE "FenceEstimate" ADD COLUMN "panel3dInstallationTotal" DOUBLE PRECISION NOT NULL DEFAULT 0;
    END IF;
END $$;

-- Create foreign key constraint if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'FenceEstimate_panel3dId_fkey'
    ) THEN
        ALTER TABLE "FenceEstimate"
        ADD CONSTRAINT "FenceEstimate_panel3dId_fkey"
        FOREIGN KEY ("panel3dId") REFERENCES "Panel3D"("id")
        ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;