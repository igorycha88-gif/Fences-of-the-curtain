import { prisma } from '@/lib/prisma';
import { roundUp } from '@/lib/utils/roundUp';

export interface ProfnastilCalculationResult {
  category: 'profnastil';
  nomenclatureId: string;
  nomenclatureName: string;
  quantity: number;
  unit: 'шт';
  pricePerUnit: number;
  totalPrice: number;
}

export interface ProfnastilCalculationError {
  error: 'NO_PROFNASTIL_FOUND';
  message: string;
  details: {
    requiredHeight: number;
    suggestion: string;
  };
}

export async function calculateProfnastil(
  fenceLengthM: number,
  fenceHeightM: number
): Promise<ProfnastilCalculationResult> {
  const now = new Date();
  const fenceHeightMm = Math.round(fenceHeightM * 1000);
  
  const profnastils = await prisma.profnastilType.findMany({
    where: {
      active: true,
      OR: [
        { validUntil: null },
        { validUntil: { gt: now } },
      ],
    },
    orderBy: [
      { priority: 'asc' },
      { length: 'asc' },
    ],
  });

  const matchingProfnastils = profnastils.filter(p => p.length >= fenceHeightMm);
  
  if (matchingProfnastils.length === 0) {
    const error: ProfnastilCalculationError = {
      error: 'NO_PROFNASTIL_FOUND',
      message: 'Не найден профнастил подходящей высоты',
      details: {
        requiredHeight: fenceHeightMm,
        suggestion: 'Свяжитесь с нами для индивидуального расчета',
      },
    };
    throw error;
  }

  const selectedProfnastil = matchingProfnastils[0];
  const fenceLengthMm = fenceLengthM * 1000;
  const usefulWidth = selectedProfnastil.usefulWidth;
  
  const sheetsCount = roundUp(fenceLengthMm / usefulWidth) + 2;
  const pricePerUnit = selectedProfnastil.retailPricePerUnit;
  const totalPrice = sheetsCount * pricePerUnit;

  return {
    category: 'profnastil',
    nomenclatureId: selectedProfnastil.id,
    nomenclatureName: selectedProfnastil.name,
    quantity: sheetsCount,
    unit: 'шт',
    pricePerUnit,
    totalPrice,
  };
}
