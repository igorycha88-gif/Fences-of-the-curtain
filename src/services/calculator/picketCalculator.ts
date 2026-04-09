import { findPicketByParams, PicketLookupResult } from './picketLookup';
import { roundUp } from '@/lib/utils/roundUp';

export type MountingType = 'SINGLE' | 'CHESS';

export interface PicketCalculationResult {
  category: 'picket';
  nomenclatureId: string;
  nomenclatureName: string;
  quantity: number;
  unit: 'шт';
  pricePerUnit: number;
  totalPrice: number;
  specifications: {
    length: number;
    width: number;
    profileType: string;
    coating: string;
  };
}

export interface PicketCalculationParams {
  fenceLengthM: number;
  fenceHeightM: number;
  profileTypeName: string;
  stepCm: number;
  mountingType: MountingType;
}

export async function calculatePicket(
  params: PicketCalculationParams
): Promise<PicketCalculationResult> {
  const fenceHeightMm = Math.round(params.fenceHeightM * 1000);

  const selectedPicket = await findPicketByParams({
    lengthMm: fenceHeightMm,
    profileTypeName: params.profileTypeName,
  });

  const fenceLengthMm = params.fenceLengthM * 1000;
  const picketWidthMm = selectedPicket.width;
  const stepMm = params.stepCm * 10;

  let baseCount = Math.ceil(fenceLengthMm / (picketWidthMm + stepMm));

  if (params.mountingType === 'CHESS') {
    baseCount = baseCount * 2;
  }

  const reserveCoef = 1.03;
  const finalCount = Math.ceil(baseCount * reserveCoef);

  const pricePerUnit = selectedPicket.retailPricePerUnit;
  const totalPrice = finalCount * pricePerUnit;

  return {
    category: 'picket',
    nomenclatureId: selectedPicket.id,
    nomenclatureName: selectedPicket.name,
    quantity: finalCount,
    unit: 'шт',
    pricePerUnit,
    totalPrice,
    specifications: {
      length: selectedPicket.length,
      width: selectedPicket.width,
      profileType: selectedPicket.profileTypeName,
      coating: selectedPicket.coatingName,
    },
  };
}
