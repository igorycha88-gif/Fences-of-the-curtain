import { prisma } from '@/lib/prisma';
import { roundUp } from '@/lib/utils/roundUp';
import { CalculationMethod } from '@/lib/validators/mountingHardware';
import { cache } from '@/lib/cache';
import { CACHE_KEYS, CACHE_TTL } from '@/lib/cache-keys';

interface HardwareForCalculation {
  id: string;
  name: string;
  retailPrice: number;
  calculationMethod: string | null;
  calculationValue: number | null;
  referenceType: string;
  referenceId: string;
}

export interface MountingHardwareCalculationResult {
  category: 'mounting_hardware';
  nomenclatureId: string;
  nomenclatureName: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  totalPrice: number;
  calculationMethod: CalculationMethod;
}

async function getHardwareForReferences(referenceIds: { postTypeId?: string; lagTypeId?: string; profnastilTypeId?: string; panel3dId?: string; gateId?: string; wicketId?: string; picketId?: string; meshId?: string }) {
  const { postTypeId, lagTypeId, profnastilTypeId, panel3dId, gateId, wicketId, picketId, meshId } = referenceIds;

  if (!postTypeId && !lagTypeId && !profnastilTypeId && !panel3dId && !gateId && !wicketId && !picketId && !meshId) {
    return [];
  }

  const cacheKey = panel3dId
    ? `calculator:hardware:${postTypeId || 'none'}:${lagTypeId || 'none'}:${profnastilTypeId || 'none'}:${panel3dId}:${gateId || 'none'}:${wicketId || 'none'}`
    : CACHE_KEYS.MOUNTING_HARDWARE(
        postTypeId || 'none',
        lagTypeId || 'none',
        profnastilTypeId || 'none'
      );

  return cache.getOrSet(
    cacheKey,
    async () => {
      const conditions: Array<{ referenceType: string; referenceId: string }> = [];

      if (postTypeId) {
        conditions.push({ referenceType: 'POST', referenceId: postTypeId });
      }
      if (lagTypeId) {
        conditions.push({ referenceType: 'LAG', referenceId: lagTypeId });
      }
      if (profnastilTypeId) {
        conditions.push({ referenceType: 'PROFNASTIL', referenceId: profnastilTypeId });
      }
      if (panel3dId) {
        conditions.push({ referenceType: 'PANEL_3D', referenceId: panel3dId });
      }
      if (gateId) {
        conditions.push({ referenceType: 'GATE', referenceId: gateId });
      }
      if (wicketId) {
        conditions.push({ referenceType: 'WICKET', referenceId: wicketId });
      }
      if (picketId) {
        conditions.push({ referenceType: 'PICKET', referenceId: picketId });
      }
      if (meshId) {
        conditions.push({ referenceType: 'MESH', referenceId: meshId });
      }

      console.log('[MOUNTING HARDWARE] getHardwareForReferences - conditions:', JSON.stringify(conditions, null, 2));

      const hardware = await prisma.mountingHardwareRelation.findMany({
        where: {
          OR: conditions.map(cond => ({
            referenceType: cond.referenceType,
            referenceId: cond.referenceId,
          })),
        },
        include: {
          mountingHardware: true,
        },
        orderBy: {
          mountingHardware: { sortOrder: 'asc' },
        },
      });

      console.log('[MOUNTING HARDWARE] getHardwareForReferences - relations from DB:', hardware.map(h => ({
        referenceType: h.referenceType,
        referenceId: h.referenceId,
        hardwareName: h.mountingHardware.name,
        active: h.mountingHardware.active,
        useInCalculator: h.mountingHardware.useInCalculator
      })));

      const filtered = hardware
        .filter(rel => rel.mountingHardware.active && rel.mountingHardware.useInCalculator)
        .map(rel => rel.mountingHardware);

      console.log('[MOUNTING HARDWARE] getHardwareForReferences - filtered hardware:', filtered.map(h => h.name));

      return filtered;
    },
    CACHE_TTL.REFERENCE_DATA
  );
}

export async function calculateMountingHardware(params: {
  fenceLengthM: number;
  fenceHeightM: number;
  postsCount: number;
  lagsCount: number;
  profnastilCount?: number;
  panel3dCount?: number;
  picketCount?: number;
  meshCount?: number;
  gateCount?: number;
  wicketCount?: number;
  postTypeId?: string;
  lagTypeId?: string;
  profnastilTypeId?: string;
  panel3dId?: string;
  picketId?: string;
  meshId?: string;
  gateId?: string;
  wicketId?: string;
}): Promise<MountingHardwareCalculationResult[]> {
  const {
    fenceLengthM,
    fenceHeightM,
    postsCount,
    lagsCount,
    profnastilCount,
    panel3dCount,
    picketCount,
    meshCount,
    gateCount,
    wicketCount,
    postTypeId,
    lagTypeId,
    profnastilTypeId,
    panel3dId,
    picketId,
    meshId,
    gateId,
    wicketId,
  } = params;

  const fenceArea = fenceLengthM * fenceHeightM;

  const results: MountingHardwareCalculationResult[] = [];

  const hardwareByType = new Map<string, HardwareForCalculation[]>();

  const requestedReferenceTypes: Array<{ referenceType: string; referenceId: string }> = [];
  if (postTypeId) {
    requestedReferenceTypes.push({ referenceType: 'POST', referenceId: postTypeId });
  }
  if (lagTypeId) {
    requestedReferenceTypes.push({ referenceType: 'LAG', referenceId: lagTypeId });
  }
  if (profnastilTypeId) {
    requestedReferenceTypes.push({ referenceType: 'PROFNASTIL', referenceId: profnastilTypeId });
  }
  if (panel3dId) {
    requestedReferenceTypes.push({ referenceType: 'PANEL_3D', referenceId: panel3dId });
  }
  if (gateId) {
    requestedReferenceTypes.push({ referenceType: 'GATE', referenceId: gateId });
  }
  if (wicketId) {
    requestedReferenceTypes.push({ referenceType: 'WICKET', referenceId: wicketId });
  }
  if (picketId) {
    requestedReferenceTypes.push({ referenceType: 'PICKET', referenceId: picketId });
  }
  if (meshId) {
    requestedReferenceTypes.push({ referenceType: 'MESH', referenceId: meshId });
  }

  console.log('[MOUNTING HARDWARE] calculateMountingHardware - requestedReferenceTypes:', JSON.stringify(requestedReferenceTypes, null, 2));

  const relations = requestedReferenceTypes.length > 0
    ? await prisma.mountingHardwareRelation.findMany({
        where: {
          OR: requestedReferenceTypes.map(ref => ({
            referenceType: ref.referenceType,
            referenceId: ref.referenceId,
          })),
        },
        include: {
          mountingHardware: true,
        },
        orderBy: {
          mountingHardware: { sortOrder: 'asc' },
        },
      })
    : [];

  console.log('[MOUNTING HARDWARE] calculateMountingHardware - relations:', relations.map(r => ({
    referenceType: r.referenceType,
    referenceId: r.referenceId,
    hardwareName: r.mountingHardware.name,
    active: r.mountingHardware.active,
    useInCalculator: r.mountingHardware.useInCalculator
  })));

  for (const rel of relations) {
    if (!rel.mountingHardware.active || !rel.mountingHardware.useInCalculator) {
      continue;
    }

    const key = `${rel.referenceType}:${rel.referenceId}`;
    if (!hardwareByType.has(key)) {
      hardwareByType.set(key, []);
    }
    hardwareByType.get(key)!.push({
      id: rel.mountingHardware.id,
      name: rel.mountingHardware.name,
      retailPrice: rel.mountingHardware.retailPrice,
      calculationMethod: rel.mountingHardware.calculationMethod,
      calculationValue: rel.mountingHardware.calculationValue,
      referenceType: rel.referenceType,
      referenceId: rel.referenceId,
    });
  }

  console.log('[MOUNTING HARDWARE] calculateMountingHardware - hardwareByType:', Array.from(hardwareByType.keys()));

  if (postTypeId) {
    const hardware = hardwareByType.get(`POST:${postTypeId}`) || [];
    for (const hw of hardware) {
      const result = calculateHardwareItem(hw, postsCount, fenceLengthM, fenceArea);
      if (result) {
        results.push(result);
      }
    }
  }

  if (lagTypeId) {
    const hardware = hardwareByType.get(`LAG:${lagTypeId}`) || [];
    for (const hw of hardware) {
      const result = calculateHardwareItem(hw, lagsCount, fenceLengthM, fenceArea);
      if (result) {
        results.push(result);
      }
    }
  }

  if (profnastilTypeId && profnastilCount) {
    const hardware = hardwareByType.get(`PROFNASTIL:${profnastilTypeId}`) || [];
    for (const hw of hardware) {
      const result = calculateHardwareItem(hw, profnastilCount, fenceLengthM, fenceArea);
      if (result) {
        results.push(result);
      }
    }
  }

  if (panel3dId && panel3dCount) {
    const hardware = hardwareByType.get(`PANEL_3D:${panel3dId}`) || [];
    for (const hw of hardware) {
      const result = calculateHardwareItem(hw, panel3dCount, fenceLengthM, fenceArea);
      if (result) {
        results.push(result);
      }
    }
  }

  if (gateId && gateCount) {
    const hardware = hardwareByType.get(`GATE:${gateId}`) || [];
    for (const hw of hardware) {
      const result = calculateHardwareItem(hw, gateCount, fenceLengthM, fenceArea);
      if (result) {
        results.push(result);
      }
    }
  }

  if (wicketId && wicketCount) {
    const hardware = hardwareByType.get(`WICKET:${wicketId}`) || [];
    for (const hw of hardware) {
      const result = calculateHardwareItem(hw, wicketCount, fenceLengthM, fenceArea);
      if (result) {
        results.push(result);
      }
    }
  }

  if (picketId && picketCount) {
    const hardware = hardwareByType.get(`PICKET:${picketId}`) || [];
    for (const hw of hardware) {
      const result = calculateHardwareItem(hw, picketCount, fenceLengthM, fenceArea);
      if (result) {
        results.push(result);
      }
    }
  }

  if (meshId && meshCount) {
    const hardware = hardwareByType.get(`MESH:${meshId}`) || [];
    for (const hw of hardware) {
      const result = calculateHardwareItem(hw, meshCount, fenceLengthM, fenceArea);
      if (result) {
        results.push(result);
      }
    }
  }

  return results;
}

function calculateHardwareItem(
  hw: HardwareForCalculation,
  itemCount: number,
  fenceLengthM: number,
  fenceArea: number
): MountingHardwareCalculationResult | null {
  if (!hw.calculationMethod) {
    return null;
  }

  let quantity = 0;
  const method = hw.calculationMethod as CalculationMethod;

  switch (method) {
    case 'BY_QUANTITY':
      quantity = itemCount;
      break;

    case 'BY_LENGTH':
      if (!hw.calculationValue || hw.calculationValue <= 0) {
        console.warn(`[MountingHardware] Invalid calculationValue for BY_LENGTH: ${hw.name}`);
        return null;
      }
      quantity = roundUp(fenceLengthM / hw.calculationValue);
      break;

    case 'BY_AREA':
      if (!hw.calculationValue || hw.calculationValue <= 0) {
        console.warn(`[MountingHardware] Invalid calculationValue for BY_AREA: ${hw.name}`);
        return null;
      }
      quantity = roundUp(fenceArea / hw.calculationValue);
      break;

    case 'BY_RATIO':
      if (!hw.calculationValue || hw.calculationValue <= 0) {
        console.warn(`[MountingHardware] Invalid calculationValue for BY_RATIO: ${hw.name}`);
        return null;
      }
      quantity = roundUp(itemCount * hw.calculationValue);
      break;

    case 'BY_INVERSE_RATIO':
      if (!hw.calculationValue || hw.calculationValue < 1) {
        console.warn(`[MountingHardware] Invalid calculationValue for BY_INVERSE_RATIO: ${hw.name}`);
        return null;
      }
      quantity = roundUp(itemCount / hw.calculationValue);
      break;

    default:
      console.warn(`[MountingHardware] Unknown calculation method: ${method}`);
      return null;
  }

  if (quantity <= 0) {
    return null;
  }

  return {
    category: 'mounting_hardware',
    nomenclatureId: hw.id,
    nomenclatureName: hw.name,
    quantity,
    unit: 'шт',
    pricePerUnit: hw.retailPrice,
    totalPrice: roundUp(quantity * hw.retailPrice * 100) / 100,
    calculationMethod: method,
  };
}
