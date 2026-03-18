import { prisma } from '@/lib/prisma';
import { cache } from '@/lib/cache';
import { CACHE_KEYS, CACHE_TTL } from '@/lib/cache-keys';

export interface GateLookupResult {
  id: string;
  name: string;
  type: string;
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
        orderBy: [{ gateLength: 'asc' }, { priority: 'asc' }],
      });
    },
    CACHE_TTL.REFERENCE_DATA
  );
}

export async function findGateByTypeAndLength(
  gateType: GateTypeValue,
  gateWidthMm: number
): Promise<GateLookupResult> {
  const gateTypeValue = gateType === 'SWING' ? 'Распашные' : 'Откатные';

  console.log('[gateLookup] Searching for gate:', { gateType, gateTypeValue, gateWidthMm });

  const gates = await getActiveGates();

  console.log('[gateLookup] Found gates from cache:', gates.map(g => ({ name: g.name, type: g.type, gateLength: g.gateLength, retailPrice: g.retailPrice })));

  const matchingGates = gates.filter((g) => g.type === gateTypeValue && g.gateLength >= gateWidthMm);

  console.log('[gateLookup] Matching gates (gateLength >= gateWidthMm):', matchingGates.map(g => ({ name: g.name, gateLength: g.gateLength })));

  if (matchingGates.length === 0) {
    throw {
      error: 'NO_GATE_FOUND',
      message: 'Не найдены ворота с указанными параметрами',
      details: {
        requiredWidth: gateWidthMm,
        gateType: gateTypeValue,
        suggestion: 'Попробуйте выбрать другую ширину или тип ворот',
      },
    } as GateLookupError;
  }

  const selectedGate = matchingGates[0];

  return {
    id: selectedGate.id,
    name: selectedGate.name,
    type: selectedGate.type,
    gateLength: selectedGate.gateLength,
    retailPrice: selectedGate.retailPrice,
  };
}
