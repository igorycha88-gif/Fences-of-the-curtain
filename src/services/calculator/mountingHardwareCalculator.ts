import { prisma } from '@/lib/prisma';
import { roundUp } from '@/lib/utils/roundUp';
import { CalculationMethod } from '@/lib/validators/mountingHardware';
import { cache } from '@/lib/cache';
import { CACHE_KEYS, CACHE_TTL } from '@/lib/cache-keys';

interface HardwareForCalculation {
  id: string;
  name: string;
  retailPrice: number;
  calculationMethod: string | null;
  calculationValue: number | null;
  referenceType: string;
  referenceId: string;
}

export interface MountingHardwareCalculationResult {
  category: 'mounting_hardware';
  nomenclatureId: string;
  nomenclatureName: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  totalPrice: number;
  calculationMethod: CalculationMethod;
}

async function getHardwareForReferences(referenceIds: { postTypeId?: string; lagTypeId?: string; profnastilTypeId?: string }) {
  const { postTypeId, lagTypeId, profnastilTypeId } = referenceIds;
  
  if (!postTypeId && !lagTypeId && !profnastilTypeId) {
    return [];
  }

  const cacheKey = CACHE_KEYS.MOUNTING_HARDWARE(
    postTypeId || 'none',
    lagTypeId || 'none',
    profnastilTypeId || 'none'
  );

  return cache.getOrSet(
    cacheKey,
    async () => {
      const conditions: Array<{ referenceType: string; referenceId: string }> = [];
      
      if (postTypeId) {
        conditions.push({ referenceType: 'POST', referenceId: postTypeId });
      }
      if (lagTypeId) {
        conditions.push({ referenceType: 'LAG', referenceId: lagTypeId });
      }
      if (profnastilTypeId) {
        conditions.push({ referenceType: 'PROFNASTIL', referenceId: profnastilTypeId });
      }

      return prisma.mountingHardware.findMany({
        where: {
          active: true,
          useInCalculator: true,
          relations: {
            some: {
              OR: conditions,
            },
          },
        },
        select: {
          id: true,
          name: true,
          retailPrice: true,
          calculationMethod: true,
          calculationValue: true,
          relations: {
            where: {
              OR: conditions,
            },
            select: {
              referenceType: true,
              referenceId: true,
            },
          },
        },
      });
    },
    CACHE_TTL.REFERENCE_DATA
  );
}

export async function calculateMountingHardware(params: {
  fenceLengthM: number;
  fenceHeightM: number;
  postsCount: number;
  lagsCount: number;
  profnastilCount: number;
  postTypeId?: string;
  lagTypeId?: string;
  profnastilTypeId?: string;
}): Promise<MountingHardwareCalculationResult[]> {
  const {
    fenceLengthM,
    fenceHeightM,
    postsCount,
    lagsCount,
    profnastilCount,
    postTypeId,
    lagTypeId,
    profnastilTypeId,
  } = params;

  const fenceArea = fenceLengthM * fenceHeightM;

  const results: MountingHardwareCalculationResult[] = [];

  const allHardware = await getHardwareForReferences({
    postTypeId,
    lagTypeId,
    profnastilTypeId,
  });

  const hardwareByType = new Map<string, HardwareForCalculation[]>();
  
  for (const hw of allHardware) {
    for (const rel of hw.relations) {
      const key = `${rel.referenceType}:${rel.referenceId}`;
      if (!hardwareByType.has(key)) {
        hardwareByType.set(key, []);
      }
      hardwareByType.get(key)!.push({
        id: hw.id,
        name: hw.name,
        retailPrice: hw.retailPrice,
        calculationMethod: hw.calculationMethod,
        calculationValue: hw.calculationValue,
        referenceType: rel.referenceType,
        referenceId: rel.referenceId,
      });
    }
  }

  if (postTypeId) {
    const hardware = hardwareByType.get(`POST:${postTypeId}`) || [];
    for (const hw of hardware) {
      const result = calculateHardwareItem(hw, postsCount, fenceLengthM, fenceArea);
      if (result) {
        results.push(result);
      }
    }
  }

  if (lagTypeId) {
    const hardware = hardwareByType.get(`LAG:${lagTypeId}`) || [];
    for (const hw of hardware) {
      const result = calculateHardwareItem(hw, lagsCount, fenceLengthM, fenceArea);
      if (result) {
        results.push(result);
      }
    }
  }

  if (profnastilTypeId) {
    const hardware = hardwareByType.get(`PROFNASTIL:${profnastilTypeId}`) || [];
    for (const hw of hardware) {
      const result = calculateHardwareItem(hw, profnastilCount, fenceLengthM, fenceArea);
      if (result) {
        results.push(result);
      }
    }
  }

  return results;
}

function calculateHardwareItem(
  hw: HardwareForCalculation,
  itemCount: number,
  fenceLengthM: number,
  fenceArea: number
): MountingHardwareCalculationResult | null {
  if (!hw.calculationMethod) {
    return null;
  }

  let quantity = 0;
  const method = hw.calculationMethod as CalculationMethod;

  switch (method) {
    case 'BY_QUANTITY':
      quantity = itemCount;
      break;

    case 'BY_LENGTH':
      if (!hw.calculationValue || hw.calculationValue <= 0) {
        console.warn(`[MountingHardware] Invalid calculationValue for BY_LENGTH: ${hw.name}`);
        return null;
      }
      quantity = roundUp(fenceLengthM / hw.calculationValue);
      break;

    case 'BY_AREA':
      if (!hw.calculationValue || hw.calculationValue <= 0) {
        console.warn(`[MountingHardware] Invalid calculationValue for BY_AREA: ${hw.name}`);
        return null;
      }
      quantity = roundUp(fenceArea / hw.calculationValue);
      break;

    case 'BY_RATIO':
      if (!hw.calculationValue || hw.calculationValue <= 0) {
        console.warn(`[MountingHardware] Invalid calculationValue for BY_RATIO: ${hw.name}`);
        return null;
      }
      quantity = roundUp(itemCount * hw.calculationValue);
      break;

    case 'BY_INVERSE_RATIO':
      if (!hw.calculationValue || hw.calculationValue < 1) {
        console.warn(`[MountingHardware] Invalid calculationValue for BY_INVERSE_RATIO: ${hw.name}`);
        return null;
      }
      quantity = roundUp(itemCount / hw.calculationValue);
      break;

    default:
      console.warn(`[MountingHardware] Unknown calculation method: ${method}`);
      return null;
  }

  if (quantity <= 0) {
    return null;
  }

  return {
    category: 'mounting_hardware',
    nomenclatureId: hw.id,
    nomenclatureName: hw.name,
    quantity,
    unit: 'шт',
    pricePerUnit: hw.retailPrice,
    totalPrice: roundUp(quantity * hw.retailPrice * 100) / 100,
    calculationMethod: method,
  };
}
