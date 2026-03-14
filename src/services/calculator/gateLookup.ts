import { prisma } from '@/lib/prisma';

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

export async function findGateByTypeAndLength(
  gateType: GateTypeValue,
  gateWidthMm: number
): Promise<GateLookupResult> {
  const gateTypeValue = gateType === 'SWING' ? 'Распашные' : 'Откатные';
  const now = new Date();

  console.log('[gateLookup] Searching for gate:', { gateType, gateTypeValue, gateWidthMm });

  const gates = await prisma.gateType.findMany({
    where: {
      active: true,
      type: gateTypeValue,
      OR: [{ validFrom: null }, { validFrom: { lte: now } }],
      AND: {
        OR: [{ expirationDate: null }, { expirationDate: { gt: now } }],
      },
    },
    orderBy: [{ gateLength: 'asc' }, { priority: 'asc' }],
  });

  console.log('[gateLookup] Found gates in DB:', gates.map(g => ({ name: g.name, type: g.type, gateLength: g.gateLength, retailPrice: g.retailPrice })));

  const matchingGates = gates.filter((g) => g.gateLength >= gateWidthMm);

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
