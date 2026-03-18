import { prisma } from '@/lib/prisma';
import { roundUp } from '@/lib/utils/roundUp';
import { cache } from '@/lib/cache';
import { CACHE_KEYS, CACHE_TTL } from '@/lib/cache-keys';

export interface LagCalculationResult {
  category: 'lags';
  nomenclatureId: string;
  nomenclatureName: string;
  quantity: number;
  unit: 'шт';
  pricePerUnit: number;
  totalPrice: number;
}

export interface LagCalculationError {
  error: 'NO_LAGS_FOUND';
  message: string;
  details: {
    suggestion: string;
  };
}

async function getActiveLags() {
  return cache.getOrSet(
    CACHE_KEYS.LAGS_ACTIVE,
    async () => {
      const now = new Date();
      return prisma.lagType.findMany({
        where: {
          active: true,
          OR: [
            { validFrom: null },
            { validFrom: { lte: now } },
          ],
          AND: {
            OR: [
              { expirationDate: null },
              { expirationDate: { gt: now } },
            ],
          },
        },
        orderBy: { priority: 'asc' },
      });
    },
    CACHE_TTL.REFERENCE_DATA
  );
}

export async function calculateLags(
  fenceLengthM: number,
  lagRows: 2 | 3
): Promise<LagCalculationResult> {
  const lags = await getActiveLags();

  if (lags.length === 0) {
    const error: LagCalculationError = {
      error: 'NO_LAGS_FOUND',
      message: 'Не найдены подходящие лаги',
      details: {
        suggestion: 'Свяжитесь с нами для индивидуального расчета',
      },
    };
    throw error;
  }

  const selectedLag = lags[0];
  const fenceLengthMm = fenceLengthM * 1000;
  const lagLengthMm = selectedLag.length;
  
  const baseLagsPerRow = roundUp(fenceLengthMm / lagLengthMm);
  const totalLags = baseLagsPerRow * lagRows + 2;
  
  const pricePerUnit = selectedLag.retailPricePerUnit;
  const totalPrice = totalLags * pricePerUnit;

  return {
    category: 'lags',
    nomenclatureId: selectedLag.id,
    nomenclatureName: selectedLag.name,
    quantity: totalLags,
    unit: 'шт',
    pricePerUnit,
    totalPrice,
  };
}
