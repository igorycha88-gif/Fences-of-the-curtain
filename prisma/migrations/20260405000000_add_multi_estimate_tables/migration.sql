-- CreateTable
CREATE TABLE "MultiFenceEstimate" (
    "id" TEXT NOT NULL,
    "totalMaterials" DOUBLE PRECISION NOT NULL,
    "totalInstallation" DOUBLE PRECISION NOT NULL,
    "grandTotal" DOUBLE PRECISION NOT NULL,
    "estimatesCount" INTEGER NOT NULL DEFAULT 1,
    "userId" TEXT,
    "sessionId" TEXT,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "city" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MultiFenceEstimate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MultiFenceEstimate_userId_idx" ON "MultiFenceEstimate"("userId");

-- CreateIndex
CREATE INDEX "MultiFenceEstimate_sessionId_idx" ON "MultiFenceEstimate"("sessionId");

-- CreateIndex
CREATE INDEX "MultiFenceEstimate_createdAt_idx" ON "MultiFenceEstimate"("createdAt");

-- CreateIndex
CREATE INDEX "MultiFenceEstimate_city_idx" ON "MultiFenceEstimate"("city");

-- AddColumn to FenceEstimate
ALTER TABLE "FenceEstimate" ADD COLUMN "multiEstimateId" TEXT;

-- CreateIndex
CREATE INDEX "FenceEstimate_multiEstimateId_idx" ON "FenceEstimate"("multiEstimateId");

-- AddForeignKey
ALTER TABLE "FenceEstimate" ADD CONSTRAINT "FenceEstimate_multiEstimateId_fkey" FOREIGN KEY ("multiEstimateId") REFERENCES "MultiFenceEstimate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MultiFenceEstimate" ADD CONSTRAINT "MultiFenceEstimate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
