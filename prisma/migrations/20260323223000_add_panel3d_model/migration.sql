-- Create Panel3D table
CREATE TABLE "Panel3D" (
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

ALTER TABLE "Panel3D" ADD CONSTRAINT "Panel3D_pkey" PRIMARY KEY ("id");

-- Add panel3d fields to FenceEstimate
ALTER TABLE "FenceEstimate" ADD COLUMN "panel3dId" TEXT;
ALTER TABLE "FenceEstimate" ADD COLUMN "panel3dNomenclatureName" TEXT;
ALTER TABLE "FenceEstimate" ADD COLUMN "panel3dTotal" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "FenceEstimate" ADD COLUMN "panel3dInstallationTotal" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- Create foreign key constraint
ALTER TABLE "FenceEstimate" ADD CONSTRAINT "FenceEstimate_panel3dId_fkey" FOREIGN KEY ("panel3dId") REFERENCES "Panel3D"("id") ON DELETE SET NULL ON UPDATE CASCADE;