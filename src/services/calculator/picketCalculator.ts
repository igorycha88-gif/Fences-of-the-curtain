import { prisma } from '@/lib/prisma';
import { roundUp } from '@/lib/utils/roundUp';
import { cache } from '@/lib/cache';
import { CACHE_KEYS, CACHE_TTL } from '@/lib/cache-keys';

export type PicketMountingType = 'SINGLE_SIDED' | 'CHESS_PATTERN';

const MOUNTING_TYPE_LABELS = {
  'SINGLE_SIDED': 'Односторонний',
  'CHESS_PATTERN': 'В шахматном порядке'
} as const;

const SHAPE_LABELS: Record<string, string> = {
  'P_SHAPED': 'П-образный',
  'M_SHAPED': 'М-образный',
  'SEMICIRCULAR': 'Полукруглый'
};

const COATING_LABELS: Record<string, string> = {
  'PLASTISOL': 'Пластизол',
  'PURAL': 'Пурал',
  'PVDF': 'PVDF',
  'PRINTECH': 'Printech',
  'GLOSSY_POLYESTER': 'Глянцевый полиэстер',
  'MATTE_POLYESTER': 'Матовый полиэстер'
};

export interface PicketCalculationResult {
  category: 'picket';
  nomenclatureId: string;
  nomenclatureName: string;
  quantity: number;
  unit: 'шт';
  pricePerUnit: number;
  totalPrice: number;
  picketShape: string;
  picketCoating: string;
  picketStep: number;
  picketMountingType: string;
}

export interface PicketCalculationError {
  error: 'NO_PICKET_FOUND';
  message: string;
  details: {
    requiredHeight: number;
    picketShape: string;
    picketCoating: string;
    suggestion: string;
  };
}

async function getActivePickets() {
  return cache.getOrSet(
    CACHE_KEYS.PICKETS_ACTIVE,
    async () => {
      const now = new Date();
      return prisma.picketType.findMany({
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

export async function calculatePicket(
  fenceLengthM: number,
  fenceHeightM: number,
  picketShape: any,
  picketCoating: any,
  picketStepCm: number,
  picketMountingType: PicketMountingType
): Promise<PicketCalculationResult> {
  const fenceHeightMm = Math.round(fenceHeightM * 1000);
  const picketStepMm = picketStepCm * 10;
  
  const pickets = await getActivePickets();

  const matchingPickets = pickets.filter(
    (p: any) => 
      p.length >= fenceHeightMm &&
      p.picketShape === picketShape &&
      p.picketCoating === picketCoating
  );
  
  if (matchingPickets.length === 0) {
    const error: PicketCalculationError = {
      error: 'NO_PICKET_FOUND',
      message: 'Не найден евроштакетник с указанными параметрами',
      details: {
        requiredHeight: fenceHeightMm,
        picketShape: SHAPE_LABELS[picketShape] || picketShape,
        picketCoating: COATING_LABELS[picketCoating] || picketCoating,
        suggestion: 'Попробуйте выбрать другие параметры или свяжитесь с нами',
      },
    };
    throw error;
  }

  const selectedPicket = matchingPickets[0];
  const fenceLengthMm = fenceLengthM * 1000;
  const picketWidthMm = selectedPicket.width;
  
  let picketsCount: number;
  
  if (picketMountingType === 'CHESS_PATTERN') {
    const picketsPerRow = fenceLengthMm / (picketWidthMm + picketStepMm);
    picketsCount = roundUp(picketsPerRow) * 2;
  } else {
    const picketsPerRow = fenceLengthMm / (picketWidthMm + picketStepMm);
    picketsCount = roundUp(picketsPerRow);
  }
  
  const pricePerUnit = (selectedPicket.width * selectedPicket.length * selectedPicket.retailPricePerMeter) / 1000000;
  const totalPrice = picketsCount * pricePerUnit;

  return {
    category: 'picket',
    nomenclatureId: selectedPicket.id,
    nomenclatureName: selectedPicket.name,
    quantity: picketsCount,
    unit: 'шт',
    pricePerUnit,
    totalPrice,
    picketShape: picketShape,
    picketCoating: picketCoating,
    picketStep: picketStepCm,
    picketMountingType: picketMountingType,
  };
}

