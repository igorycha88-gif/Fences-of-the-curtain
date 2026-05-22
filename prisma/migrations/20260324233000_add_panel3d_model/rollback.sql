-- Rollback Panel3D migration

-- Drop foreign key constraint if exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'FenceEstimate_panel3dId_fkey'
    ) THEN
        ALTER TABLE "FenceEstimate" DROP CONSTRAINT "FenceEstimate_panel3dId_fkey";
    END IF;
END $$;

-- Drop panel3d fields from FenceEstimate
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'FenceEstimate' AND column_name = 'panel3dInstallationTotal') THEN
        ALTER TABLE "FenceEstimate" DROP COLUMN "panel3dInstallationTotal";
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'FenceEstimate' AND column_name = 'panel3dTotal') THEN
        ALTER TABLE "FenceEstimate" DROP COLUMN "panel3dTotal";
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'FenceEstimate' AND column_name = 'panel3dNomenclatureName') THEN
        ALTER TABLE "FenceEstimate" DROP COLUMN "panel3dNomenclatureName";
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'FenceEstimate' AND column_name = 'panel3dId') THEN
        ALTER TABLE "FenceEstimate" DROP COLUMN "panel3dId";
    END IF;
END $$;

-- Drop Panel3D table
DROP TABLE IF EXISTS "Panel3D";