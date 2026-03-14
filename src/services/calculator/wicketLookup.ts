import { prisma } from '@/lib/prisma';

export interface WicketLookupResult {
  id: string;
  name: string;
  wicketHeight: number;
  wicketLength: number;
  retailPrice: number;
}

export interface WicketLookupError {
  error: string;
  message: string;
  details?: Record<string, unknown>;
}

export async function findWicketByHeightAndWidth(
  requiredHeightMm: number,
  requiredWidthMm: number
): Promise<WicketLookupResult> {
  const now = new Date();

  console.log('[wicketLookup] Searching for wicket:', { requiredHeightMm, requiredWidthMm });

  const wickets = await prisma.wicketType.findMany({
    where: {
      active: true,
      OR: [{ validFrom: null }, { validFrom: { lte: now } }],
      AND: {
        OR: [{ expirationDate: null }, { expirationDate: { gt: now } }],
      },
    },
    orderBy: [{ wicketLength: 'asc' }, { wicketHeight: 'asc' }, { priority: 'asc' }],
  });

  console.log('[wicketLookup] Found wickets in DB:', wickets.map(w => ({ name: w.name, wicketHeight: w.wicketHeight, wicketLength: w.wicketLength, retailPrice: w.retailPrice })));

  const widthMatchingWickets = wickets.filter((w) => w.wicketLength >= requiredWidthMm);

  console.log('[wicketLookup] Width matching wickets (wicketLength >= requiredWidthMm):', widthMatchingWickets.map(w => ({ name: w.name, wicketLength: w.wicketLength })));

  if (widthMatchingWickets.length === 0) {
    throw {
      error: 'NO_WICKET_FOUND',
      message: 'Не найдена калитка с указанными параметрами',
      details: {
        requiredWidth: requiredWidthMm,
        requiredHeight: requiredHeightMm,
        suggestion: 'Попробуйте выбрать другую ширину калитки',
      },
    } as WicketLookupError;
  }

  const exactWidthMatch = widthMatchingWickets.filter((w) => w.wicketLength === requiredWidthMm);
  const candidatesByWidth = exactWidthMatch.length > 0 ? exactWidthMatch : widthMatchingWickets;

  const heightMatchingWickets = candidatesByWidth.filter((w) => w.wicketHeight >= requiredHeightMm);

  console.log('[wicketLookup] Height matching wickets (wicketHeight >= requiredHeightMm):', heightMatchingWickets.map(w => ({ name: w.name, wicketHeight: w.wicketHeight })));

  if (heightMatchingWickets.length === 0) {
    throw {
      error: 'NO_WICKET_FOUND',
      message: 'Не найдена калитка с указанными параметрами',
      details: {
        requiredWidth: requiredWidthMm,
        requiredHeight: requiredHeightMm,
        suggestion: 'Попробуйте выбрать другую высоту или ширину калитки',
      },
    } as WicketLookupError;
  }

  const exactHeightMatch = heightMatchingWickets.filter((w) => w.wicketHeight === requiredHeightMm);
  const finalCandidates = exactHeightMatch.length > 0 ? exactHeightMatch : heightMatchingWickets;

  finalCandidates.sort((a, b) => a.priority - b.priority);
  const selectedWicket = finalCandidates[0];

  console.log('[wicketLookup] Selected wicket:', { name: selectedWicket.name, wicketHeight: selectedWicket.wicketHeight, wicketLength: selectedWicket.wicketLength });

  return {
    id: selectedWicket.id,
    name: selectedWicket.name,
    wicketHeight: selectedWicket.wicketHeight,
    wicketLength: selectedWicket.wicketLength,
    retailPrice: selectedWicket.retailPrice,
  };
}
