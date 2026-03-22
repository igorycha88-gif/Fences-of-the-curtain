import { prisma } from '@/lib/prisma';
import { roundUp } from '@/lib/utils/roundUp';
import { cache } from '@/lib/cache';
import { CACHE_KEYS, CACHE_TTL } from '@/lib/cache-keys';

export type CoatingType = 'GALVANIZED' | 'POLYMER_SINGLE' | 'POLYMER_DOUBLE';

const COATING_MAPPING = {
  'GALVANIZED': 'Оцинковка',
  'POLYMER_SINGLE': 'Полимерное (одностороннее)',
  'POLYMER_DOUBLE': 'Полимерное (двустороннее)',
} as const;

export interface ProfnastilCalculationResult {
  category: 'profnastil';
  nomenclatureId: string;
  nomenclatureName: string;
  quantity: number;
  unit: 'шт';
  pricePerUnit: number;
  totalPrice: number;
  coating: string;
}

export interface ProfnastilCalculationError {
  error: 'NO_PROFNASTIL_FOUND';
  message: string;
  details: {
    requiredHeight: number;
    coating: string;
    suggestion: string;
  };
}

async function getActiveProfnastil() {
  return cache.getOrSet(
    CACHE_KEYS.PROFNASTIL_ACTIVE,
    async () => {
      const now = new Date();
      return prisma.profnastilType.findMany({
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
    },
    CACHE_TTL.REFERENCE_DATA
  );
}

export async function calculateProfnastil(
  fenceLengthM: number,
  fenceHeightM: number,
  coating: CoatingType
): Promise<ProfnastilCalculationResult> {
  const fenceHeightMm = Math.round(fenceHeightM * 1000);
  const coatingValue = COATING_MAPPING[coating];
  
  const profnastils = await getActiveProfnastil();

  const matchingProfnastils = profnastils.filter(
    p => p.coating === coatingValue && p.length >= fenceHeightMm
  );
  
  if (matchingProfnastils.length === 0) {
    const error: ProfnastilCalculationError = {
      error: 'NO_PROFNASTIL_FOUND',
      message: 'Не найден профнастил с указанным покрытием и высотой',
      details: {
        requiredHeight: fenceHeightMm,
        coating: coatingValue,
        suggestion: 'Попробуйте выбрать другое покрытие или свяжитесь с нами',
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
    coating: selectedProfnastil.coating,
  };
}
