import { prisma } from '@/lib/prisma';
import { cache } from '@/lib/cache';
import { CACHE_KEYS, CACHE_TTL } from '@/lib/cache-keys';

export interface PicketLookupParams {
  lengthMm: number;
  profileTypeName: string;
  coatingName: string;
}

export interface PicketLookupResult {
  id: string;
  name: string;
  length: number;
  width: number;
  metalThickness: number;
  retailPricePerUnit: number;
  profileTypeName: string;
  coatingName: string;
  color: string | null;
}

export interface PicketLookupError {
  error: 'NO_PICKET_FOUND';
  message: string;
  details: {
    requiredLength: number;
    profileType: string;
    coating: string;
    suggestion: string;
  };
}

async function getActivePickets() {
  return cache.getOrSet(
    CACHE_KEYS.PICKET_ACTIVE,
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
        include: {
          picketProfile: true,
          picketCoatingType: true,
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

export async function findPicketByParams(
  params: PicketLookupParams
): Promise<PicketLookupResult> {
  const pickets = await getActivePickets();

  const matchingPickets = pickets.filter(
    p =>
      p.length === params.lengthMm &&
      p.picketProfile.name === params.profileTypeName &&
      p.picketCoatingType.name === params.coatingName
  );

  if (matchingPickets.length === 0) {
    const error: PicketLookupError = {
      error: 'NO_PICKET_FOUND',
      message: 'Не найден евроштакетник с указанными параметрами',
      details: {
        requiredLength: params.lengthMm,
        profileType: params.profileTypeName,
        coating: params.coatingName,
        suggestion: 'Попробуйте выбрать другие параметры или свяжитесь с нами',
      },
    };
    throw error;
  }

  const selectedPicket = matchingPickets[0];

  return {
    id: selectedPicket.id,
    name: selectedPicket.name,
    length: selectedPicket.length,
    width: selectedPicket.width,
    metalThickness: selectedPicket.metalThickness,
    retailPricePerUnit: selectedPicket.retailPricePerUnit,
    profileTypeName: selectedPicket.picketProfile.name,
    coatingName: selectedPicket.picketCoatingType.name,
    color: selectedPicket.color,
  };
}
