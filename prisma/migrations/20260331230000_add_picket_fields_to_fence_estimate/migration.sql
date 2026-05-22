-- Migration: add_picket_fields_to_fence_estimate
-- Date: 2026-03-31
-- Description: Add picket-related fields to FenceEstimate table for Eurofence calculator

BEGIN;

-- Add picket fields to FenceEstimate if not exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'FenceEstimate' AND column_name = 'picketNomenclatureId') THEN
        ALTER TABLE "FenceEstimate" ADD COLUMN "picketNomenclatureId" TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'FenceEstimate' AND column_name = 'picketNomenclatureName') THEN
        ALTER TABLE "FenceEstimate" ADD COLUMN "picketNomenclatureName" TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'FenceEstimate' AND column_name = 'picketTotal') THEN
        ALTER TABLE "FenceEstimate" ADD COLUMN "picketTotal" DOUBLE PRECISION NOT NULL DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'FenceEstimate' AND column_name = 'picketStep') THEN
        ALTER TABLE "FenceEstimate" ADD COLUMN "picketStep" INTEGER;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'FenceEstimate' AND column_name = 'picketMountingType') THEN
        ALTER TABLE "FenceEstimate" ADD COLUMN "picketMountingType" TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'FenceEstimate' AND column_name = 'picketProfileType') THEN
        ALTER TABLE "FenceEstimate" ADD COLUMN "picketProfileType" TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'FenceEstimate' AND column_name = 'picketCoatingName') THEN
        ALTER TABLE "FenceEstimate" ADD COLUMN "picketCoatingName" TEXT;
    END IF;
END $$;

COMMIT;
