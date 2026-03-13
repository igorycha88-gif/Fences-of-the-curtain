import { prisma } from '@/lib/prisma';
import { roundUp } from '@/lib/utils/roundUp';
import { CalculationMethod } from '@/lib/validators/mountingHardware';

interface HardwareForCalculation {
  id: string;
  name: string;
  retailPrice: number;
  calculationMethod: string | null;
  calculationValue: number | null;
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

  if (postTypeId) {
    const hardware = await prisma.mountingHardware.findMany({
      where: {
        active: true,
        useInCalculator: true,
        relations: {
          some: {
            referenceType: 'POST',
            referenceId: postTypeId,
          },
        },
      },
      select: {
        id: true,
        name: true,
        retailPrice: true,
        calculationMethod: true,
        calculationValue: true,
      },
    });

    for (const hw of hardware) {
      const result = calculateHardwareItem(hw, postsCount, fenceLengthM, fenceArea);
      if (result) {
        results.push(result);
      }
    }
  }

  if (lagTypeId) {
    const hardware = await prisma.mountingHardware.findMany({
      where: {
        active: true,
        useInCalculator: true,
        relations: {
          some: {
            referenceType: 'LAG',
            referenceId: lagTypeId,
          },
        },
      },
      select: {
        id: true,
        name: true,
        retailPrice: true,
        calculationMethod: true,
        calculationValue: true,
      },
    });

    for (const hw of hardware) {
      const result = calculateHardwareItem(hw, lagsCount, fenceLengthM, fenceArea);
      if (result) {
        results.push(result);
      }
    }
  }

  if (profnastilTypeId) {
    const hardware = await prisma.mountingHardware.findMany({
      where: {
        active: true,
        useInCalculator: true,
        relations: {
          some: {
            referenceType: 'PROFNASTIL',
            referenceId: profnastilTypeId,
          },
        },
      },
      select: {
        id: true,
        name: true,
        retailPrice: true,
        calculationMethod: true,
        calculationValue: true,
      },
    });

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
