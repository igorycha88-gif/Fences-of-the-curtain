import { prisma } from '@/lib/prisma';
import { FenceEstimateInput } from '@/lib/validators/fenceEstimate';
import { calculatePosts, PostCalculationResult } from './postCalculator';
import { calculateLags, LagCalculationResult } from './lagCalculator';
import { calculateProfnastil, ProfnastilCalculationResult } from './profnastilCalculator';
import { calculateInstallation, InstallationCalculationResult } from './installationCalculator';
import { calculateMountingHardware, MountingHardwareCalculationResult } from './mountingHardwareCalculator';

type EstimateItem = PostCalculationResult | LagCalculationResult | ProfnastilCalculationResult | InstallationCalculationResult | MountingHardwareCalculationResult;

export interface FenceEstimateResult {
  estimateId: string;
  items: EstimateItem[];
  totals: {
    materials: number;
    installation: number;
    grandTotal: number;
  };
  parameters: {
    fenceTypeId: string;
    fenceTypeName: string;
    length: number;
    height: number;
    lagRows: 2 | 3;
  };
  calculatedAt: string;
}

export interface CalculationError {
  error: string;
  message: string;
  details?: Record<string, unknown>;
}

export async function calculateFenceEstimate(
  input: FenceEstimateInput,
  metadata?: { userId?: string; sessionId?: string; userAgent?: string; ipAddress?: string }
): Promise<FenceEstimateResult> {
  const { fenceTypeId, length, height, lagRows } = input;

  const fenceType = await prisma.fenceType.findUnique({
    where: { id: fenceTypeId },
  });

  if (!fenceType) {
    throw {
      error: 'NO_FENCE_TYPE',
      message: 'Тип забора не найден',
    } as CalculationError;
  }

  const postSpacingMm = fenceType.postSpacing;
  const postSpacingM = postSpacingMm / 1000;

  const [postsResult, lagsResult, profnastilResult, installationResult] = await Promise.all([
    calculatePosts(length, height, postSpacingM),
    calculateLags(length, lagRows),
    calculateProfnastil(length, height),
    Promise.resolve(calculateInstallation(length)),
  ]);

  const mountingHardwareResult = await calculateMountingHardware({
    fenceLengthM: length,
    fenceHeightM: height,
    postsCount: postsResult.quantity,
    lagsCount: lagsResult.quantity,
    profnastilCount: profnastilResult.quantity,
    postTypeId: postsResult.nomenclatureId,
    lagTypeId: lagsResult.nomenclatureId,
    profnastilTypeId: profnastilResult.nomenclatureId,
  });

  const items: EstimateItem[] = [
    postsResult,
    lagsResult,
    profnastilResult,
    installationResult,
    ...mountingHardwareResult,
  ];

  const mountingHardwareTotal = mountingHardwareResult.reduce((sum, item) => sum + item.totalPrice, 0);
  const materials = postsResult.totalPrice + lagsResult.totalPrice + profnastilResult.totalPrice + mountingHardwareTotal;
  const installation = installationResult.totalPrice;
  const grandTotal = materials + installation;

  const estimate = await prisma.fenceEstimate.create({
    data: {
      fenceTypeId,
      length,
      height,
      lagRows,
      postsTotal: postsResult.totalPrice,
      lagsTotal: lagsResult.totalPrice,
      profnastilTotal: profnastilResult.totalPrice,
      mountingHardwareTotal,
      installationTotal: installation,
      materialsTotal: materials,
      grandTotal,
      items: JSON.parse(JSON.stringify(items)),
      userId: metadata?.userId,
      sessionId: metadata?.sessionId,
      userAgent: metadata?.userAgent,
      ipAddress: metadata?.ipAddress,
    },
  });

  return {
    estimateId: estimate.id,
    items,
    totals: {
      materials,
      installation,
      grandTotal,
    },
    parameters: {
      fenceTypeId,
      fenceTypeName: fenceType.name,
      length,
      height,
      lagRows,
    },
    calculatedAt: estimate.createdAt.toISOString(),
  };
}

export async function getFenceEstimateById(id: string): Promise<FenceEstimateResult | null> {
  const estimate = await prisma.fenceEstimate.findUnique({
    where: { id },
    include: { fenceType: true },
  });

  if (!estimate) {
    return null;
  }

  return {
    estimateId: estimate.id,
    items: estimate.items as unknown as EstimateItem[],
    totals: {
      materials: estimate.materialsTotal,
      installation: estimate.installationTotal,
      grandTotal: estimate.grandTotal,
    },
    parameters: {
      fenceTypeId: estimate.fenceTypeId,
      fenceTypeName: estimate.fenceType.name,
      length: estimate.length,
      height: estimate.height,
      lagRows: estimate.lagRows as 2 | 3,
    },
    calculatedAt: estimate.createdAt.toISOString(),
  };
}
