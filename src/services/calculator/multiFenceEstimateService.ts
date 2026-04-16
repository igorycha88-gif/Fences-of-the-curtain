import { prisma } from '@/lib/prisma';
import { MultiFenceEstimateInput } from '@/lib/validators/multiFenceEstimate';
import { calculateFenceEstimate, FenceEstimateResult } from './fenceEstimateService';
import { getCityByIP } from '@/services/admin/ipLookupService';
import { createAuditLogAsync, getSystemUserId } from '@/lib/audit';

type EstimateItem = NonNullable<FenceEstimateResult['items'][number]>;

export interface MultiFenceEstimateResult {
  multiEstimateId: string;
  estimates: Array<{
    index: number;
    result: FenceEstimateResult;
  }>;
  totals: {
    totalMaterials: number;
    totalInstallation: number;
    grandTotal: number;
  };
  calculatedAt: string;
}

export interface MultiEstimateCalculationError {
  error: string;
  message: string;
  details?: Record<string, unknown>;
  estimateIndex?: number;
}

export async function calculateMultiFenceEstimate(
  input: MultiFenceEstimateInput,
  metadata?: { userId?: string; sessionId?: string; userAgent?: string; ipAddress?: string }
): Promise<MultiFenceEstimateResult> {
  const { estimates: estimateInputs } = input;

  const results: Array<{ index: number; result: FenceEstimateResult }> = [];

  for (let i = 0; i < estimateInputs.length; i++) {
    try {
      const result = await calculateFenceEstimate(estimateInputs[i], metadata);
      results.push({ index: i, result });
    } catch (error) {
      throw {
        error: 'ESTIMATE_CALCULATION_FAILED',
        message: `Ошибка расчета забора #${i + 1}`,
        details: { estimateIndex: i, originalError: error },
      } as MultiEstimateCalculationError;
    }
  }

  const totalMaterials = results.reduce((sum, { result }) => sum + result.totals.materials, 0);
  const totalInstallation = results.reduce((sum, { result }) => sum + result.totals.installation, 0);
  const grandTotal = results.reduce((sum, { result }) => sum + result.totals.grandTotal, 0);

  const multiEstimate = await prisma.$transaction(async (tx) => {
    const multi = await tx.multiFenceEstimate.create({
      data: {
        id: `multi-${crypto.randomUUID()}`,
        totalMaterials,
        totalInstallation,
        grandTotal,
        estimatesCount: results.length,
        userId: metadata?.userId,
        sessionId: metadata?.sessionId,
        userAgent: metadata?.userAgent,
        ipAddress: metadata?.ipAddress,
        city: null,
      },
    });

    for (const { result } of results) {
      await tx.fenceEstimate.update({
        where: { id: result.estimateId },
        data: { multiEstimateId: multi.id },
      });
    }

    return multi;
  });

  if (metadata?.ipAddress) {
    getCityByIP(metadata.ipAddress)
      .then(city => {
        if (city) {
          return prisma.multiFenceEstimate.update({
            where: { id: multiEstimate.id },
            data: { city },
          });
        }
        return null;
      })
      .catch(err => console.error('[IP Lookup] Background multi-estimate city update failed:', err));
  }

  await createAuditLogAsync({
    userId: await getSystemUserId(),
    action: 'CREATE_MULTI_ESTIMATE',
    entityType: 'MultiFenceEstimate',
    entityId: multiEstimate.id,
    newValues: {
      estimatesCount: results.length,
      totalMaterials,
      totalInstallation,
      grandTotal,
      estimateIds: results.map(r => r.result.estimateId),
    },
  });

  return {
    multiEstimateId: multiEstimate.id,
    estimates: results,
    totals: {
      totalMaterials,
      totalInstallation,
      grandTotal,
    },
    calculatedAt: multiEstimate.createdAt.toISOString(),
  };
}

export async function getMultiFenceEstimateById(id: string): Promise<MultiFenceEstimateResult | null> {
  const multiEstimate = await prisma.multiFenceEstimate.findUnique({
    where: { id },
    include: {
      estimates: {
        include: { fenceType: true },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!multiEstimate) {
    return null;
  }

  const estimates: Array<{ index: number; result: FenceEstimateResult }> = multiEstimate.estimates.map((est: {
    id: string;
    items: unknown;
    materialsTotal: number;
    installationTotal: number;
    grandTotal: number;
    fenceTypeId: string;
    length: number;
    height: number;
    lagRows: number;
    coating: string;
    hasGate: boolean;
    gateType: string | null;
    gateLength: number | null;
    gateHeight?: number | null;
    gateNomenclatureId: string | null;
    gateNomenclatureName: string | null;
    hasWicket: boolean;
    wicketWidth: number | null;
    wicketHeight?: number | null;
    wicketNomenclatureId: string | null;
    wicketNomenclatureName: string | null;
    createdAt: Date;
    fenceType: { name: string };
  }, index: number): { index: number; result: FenceEstimateResult } => {
    const parameters: FenceEstimateResult['parameters'] = {
      fenceTypeId: est.fenceTypeId,
      fenceTypeName: est.fenceType.name,
      length: est.length,
      height: est.height,
      lagRows: est.lagRows as 2 | 3,
      coating: est.coating as 'GALVANIZED' | 'POLYMER_SINGLE' | 'POLYMER_DOUBLE',
    };

    if (est.hasGate && est.gateType && est.gateLength) {
      parameters.gate = {
        id: est.gateNomenclatureId || '',
        type: est.gateType,
        length: est.gateLength,
        height: est.gateHeight || 0,
        selectedName: est.gateNomenclatureName || 'Ворота',
      };
    }

    if (est.hasWicket && est.wicketWidth) {
      parameters.wicket = {
        id: est.wicketNomenclatureId || '',
        width: est.wicketWidth,
        height: est.wicketHeight || 0,
        selectedName: est.wicketNomenclatureName || 'Калитка',
      };
    }

    return {
      index,
      result: {
        estimateId: est.id,
        items: est.items as EstimateItem[],
        totals: {
          materials: est.materialsTotal,
          installation: est.installationTotal,
          grandTotal: est.grandTotal,
        },
        parameters,
        calculatedAt: est.createdAt.toISOString(),
      },
    };
  });

  return {
    multiEstimateId: multiEstimate.id,
    estimates,
    totals: {
      totalMaterials: multiEstimate.totalMaterials,
      totalInstallation: multiEstimate.totalInstallation,
      grandTotal: multiEstimate.grandTotal,
    },
    calculatedAt: multiEstimate.createdAt.toISOString(),
  };
}
