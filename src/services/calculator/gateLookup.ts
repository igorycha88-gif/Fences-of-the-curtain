import { prisma } from '@/lib/prisma';
import { cache } from '@/lib/cache';
import { CACHE_KEYS, CACHE_TTL } from '@/lib/cache-keys';

export interface GateLookupResult {
  id: string;
  name: string;
  type: string;
  gateHeight: number;
  gateLength: number;
  retailPrice: number;
}

export interface GateLookupError {
  error: string;
  message: string;
  details?: Record<string, unknown>;
}

export type GateTypeValue = 'SWING' | 'SLIDING';

async function getActiveGates() {
  return cache.getOrSet(
    CACHE_KEYS.GATES_ACTIVE,
    async () => {
      const now = new Date();
      return prisma.gateType.findMany({
        where: {
          active: true,
          OR: [{ validFrom: null }, { validFrom: { lte: now } }],
          AND: {
            OR: [{ expirationDate: null }, { expirationDate: { gt: now } }],
          },
        },
        orderBy: [{ gateLength: 'asc' }, { gateHeight: 'asc' }, { priority: 'asc' }],
      });
    },
    CACHE_TTL.REFERENCE_DATA
  );
}

export async function findGateByTypeAndLength(
  gateType: GateTypeValue,
  gateWidthMm: number,
  fenceHeightMm: number
): Promise<GateLookupResult> {
  const gateTypeValue = gateType === 'SWING' ? 'Распашные' : 'Откатные';

  console.log('[gateLookup] Searching for gate:', { gateType, gateTypeValue, gateWidthMm, fenceHeightMm });

  const gates = await getActiveGates();

  console.log('[gateLookup] Found gates from cache:', gates.map(g => ({ name: g.name, type: g.type, gateLength: g.gateLength, gateHeight: g.gateHeight, retailPrice: g.retailPrice })));

  const typeMatchingGates = gates.filter((g) => g.type === gateTypeValue);

  const widthMatchingGates = typeMatchingGates.filter((g) => g.gateLength >= gateWidthMm);

  console.log('[gateLookup] Width matching gates (gateLength >= gateWidthMm):', widthMatchingGates.map(g => ({ name: g.name, gateLength: g.gateLength, gateHeight: g.gateHeight })));

  if (widthMatchingGates.length === 0) {
    throw {
      error: 'NO_GATE_FOUND',
      message: 'Не найдены ворота с указанными параметрами',
      details: {
        requiredWidth: gateWidthMm,
        requiredHeight: fenceHeightMm,
        gateType: gateTypeValue,
        suggestion: 'Попробуйте выбрать другую ширину или тип ворот',
      },
    } as GateLookupError;
  }

  const exactWidthMatch = widthMatchingGates.filter((g) => g.gateLength === gateWidthMm);
  const candidatesByWidth = exactWidthMatch.length > 0 ? exactWidthMatch : widthMatchingGates;

  const heightMatchingGates = candidatesByWidth.filter((g) => g.gateHeight >= fenceHeightMm);

  console.log('[gateLookup] Height matching gates (gateHeight >= fenceHeightMm):', heightMatchingGates.map(g => ({ name: g.name, gateHeight: g.gateHeight })));

  let finalCandidates: typeof candidatesByWidth;

  if (heightMatchingGates.length > 0) {
    const exactHeightMatch = heightMatchingGates.filter((g) => g.gateHeight === fenceHeightMm);
    if (exactHeightMatch.length > 0) {
      finalCandidates = exactHeightMatch;
    } else {
      const minHeight = Math.min(...heightMatchingGates.map((g) => g.gateHeight));
      finalCandidates = heightMatchingGates.filter((g) => g.gateHeight === minHeight);
    }
  } else {
    const sortedByHeightDesc = [...candidatesByWidth].sort((a, b) => b.gateHeight - a.gateHeight);
    finalCandidates = [sortedByHeightDesc[0]];
    console.warn('[gateLookup] No gate meets height requirement. Falling back to tallest available:', {
      requiredHeight: fenceHeightMm,
      selectedHeight: finalCandidates[0].gateHeight,
      gateName: finalCandidates[0].name,
    });
  }

  finalCandidates.sort((a, b) => a.priority - b.priority);
  const selectedGate = finalCandidates[0];

  console.log('[gateLookup] Selected gate:', { name: selectedGate.name, gateHeight: selectedGate.gateHeight, gateLength: selectedGate.gateLength });

  return {
    id: selectedGate.id,
    name: selectedGate.name,
    type: selectedGate.type,
    gateHeight: selectedGate.gateHeight,
    gateLength: selectedGate.gateLength,
    retailPrice: selectedGate.retailPrice,
  };
}
