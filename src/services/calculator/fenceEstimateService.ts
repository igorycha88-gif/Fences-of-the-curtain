import { prisma } from '@/lib/prisma';
import { FenceEstimateInput } from '@/lib/validators/fenceEstimate';
import { calculatePosts, calculatePostsForProfnastil, calculatePostsForPanel3D, PostCalculationResult } from './postCalculator';
import { calculateLags, LagCalculationResult } from './lagCalculator';
import { calculateProfnastil, ProfnastilCalculationResult } from './profnastilCalculator';
import { calculatePanel3D, Panel3DCalculationResult } from './panel3DCalculator';

import { calculateMountingHardware, MountingHardwareCalculationResult } from './mountingHardwareCalculator';
import { findGateByTypeAndLength, GateTypeValue } from './gateLookup';
import { findWicketByHeightAndWidth } from './wicketLookup';
import { workService } from '@/services/admin/workService';
import { fenceTypeCalculatorService } from '@/services/calculator/fenceTypeCalculatorService';
import { getCityByIP } from '@/services/admin/ipLookupService';
import { createAuditLogAsync, getSystemUserId } from '@/lib/audit';
import { getFenceTypeCodeByName } from '@/lib/fenceTypeMap';

type EstimateItem = PostCalculationResult | LagCalculationResult | ProfnastilCalculationResult | Panel3DCalculationResult | MountingHardwareCalculationResult | GateCalculationResult | GateInstallationCalculationResult | WicketCalculationResult | WicketInstallationCalculationResult;

export interface GateCalculationResult {
  category: 'gates';
  nomenclatureId: string;
  nomenclatureName: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  totalPrice: number;
}

export interface GateInstallationCalculationResult {
  category: 'installation';
  nomenclatureId: string;
  nomenclatureName: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  totalPrice: number;
}

export interface WicketCalculationResult {
  category: 'wickets';
  nomenclatureId: string;
  nomenclatureName: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  totalPrice: number;
}

export interface WicketInstallationCalculationResult {
  category: 'installation';
  nomenclatureId: string;
  nomenclatureName: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  totalPrice: number;
}

export interface GateInfo {
  id: string;
  type: string;
  length: number;
  selectedName: string;
}

export interface WicketInfo {
  id: string;
  width: number;
  selectedName: string;
}

export interface FenceEstimateResult {
  estimateId: string;
  items: EstimateItem[];
  totals: {
    materials: number;
    installation: number;
    grandTotal: number;
  };
  parameters: {
    fenceTypeId: string;
    fenceTypeName: string;
    length: number;
    height: number;
    lagRows: 2 | 3;
    coating?: 'GALVANIZED' | 'POLYMER_SINGLE' | 'POLYMER_DOUBLE';
    gate?: GateInfo;
    wicket?: WicketInfo;
  };
  calculatedAt: string;
}

export interface CalculationError {
  error: string;
  message: string;
  details?: Record<string, unknown>;
}

export async function calculateFenceEstimate(
  input: FenceEstimateInput,
  metadata?: { userId?: string; sessionId?: string; userAgent?: string; ipAddress?: string }
): Promise<FenceEstimateResult> {
  const { fenceTypeId, length, height, lagRows, coating, hasGate, gateType, gateWidth } = input;

  const fenceType = await prisma.fenceType.findUnique({
    where: { id: fenceTypeId },
  });

  const fenceTypeCode = fenceType ? getFenceTypeCodeByName(fenceType.name) : '';

  if (!fenceType) {
    throw {
      error: 'NO_FENCE_TYPE',
      message: 'Тип забора не найден',
    } as CalculationError;
  }

  await fenceTypeCalculatorService.invalidateCache();

  let correctedLength = length;
  let gateInfo: GateInfo | undefined;
  let gateTotal = 0;
  let gateInstallationWorks: Array<{ id: string; name: string; price: number }> = [];
  let wicketInfo: WicketInfo | undefined;
  let wicketTotal = 0;
  let wicketInstallationWorks: Array<{ id: string; name: string; price: number }> = [];

  console.log('[fenceEstimate] Gate params:', { hasGate, gateType, gateWidth });

  const gatePromise = (async () => {
    if (hasGate && gateType && gateWidth) {
      const gateWidthMm = Math.round(gateWidth * 1000);
      console.log('[fenceEstimate] Calling findGateByTypeAndLength:', { gateType, gateWidthMm });
      const selectedGate = await findGateByTypeAndLength(gateType as GateTypeValue, gateWidthMm);
      console.log('[fenceEstimate] Selected gate:', selectedGate);
      return selectedGate;
    }
    return null;
  })();

  const wicketPromise = (async () => {
    if (input.hasWicket && input.wicketWidth) {
      const heightMm = Math.round(height * 1000);
      const wicketWidthMm = Math.round(input.wicketWidth * 1000);
      console.log('[fenceEstimate] Calling findWicketByHeightAndWidth:', { heightMm, wicketWidthMm });
      const selectedWicket = await findWicketByHeightAndWidth(heightMm, wicketWidthMm);
      console.log('[fenceEstimate] Selected wicket:', selectedWicket);
      return selectedWicket;
    }
    return null;
  })();

  const [selectedGate, selectedWicket] = await Promise.all([gatePromise, wicketPromise]);

  if (selectedGate) {
    const gateLengthMm = selectedGate.gateLength;
    correctedLength = length - gateLengthMm / 1000;

    if (correctedLength <= 0) {
      throw {
        error: 'INVALID_PARAMETERS',
        message: 'Длина ворот превышает или равна общей длине забора',
        details: {
          fenceLength: length,
          gateLength: gateLengthMm / 1000,
        },
      } as CalculationError;
    }

    gateInfo = {
      id: selectedGate.id,
      type: selectedGate.type,
      length: selectedGate.gateLength,
      selectedName: selectedGate.name,
    };
    gateTotal = selectedGate.retailPrice;

    const gateWorks = await workService.getWorksForCalculatorByReference('GATE', selectedGate.id);
    
    if (gateWorks.length > 0) {
      gateInstallationWorks = gateWorks.map(w => ({ id: w.id, name: w.name, price: w.price }));
    } else {
      const fenceTypeWorks = await workService.getWorksForCalculator(fenceTypeCode);
      const gateInstallationWorksList = fenceTypeWorks
        .filter((w) => w.category === 'MOUNTING');
      
      if (gateInstallationWorksList.length > 0) {
        gateInstallationWorks = gateInstallationWorksList.map(w => ({ id: w.id, name: w.name, price: w.price }));
      }
    }
  }

  if (selectedWicket) {
    const wicketLengthMm = selectedWicket.wicketLength;
    correctedLength = correctedLength - wicketLengthMm / 1000;

    if (correctedLength <= 0) {
      throw {
        error: 'INVALID_PARAMETERS',
        message: 'Ширина калитки превышает или равна скорректированной длине забора',
        details: {
          fenceLength: length,
          wicketLength: wicketLengthMm / 1000,
        },
      } as CalculationError;
    }

    wicketInfo = {
      id: selectedWicket.id,
      width: selectedWicket.wicketLength,
      selectedName: selectedWicket.name,
    };
    wicketTotal = selectedWicket.retailPrice;

    const wicketWorks = await workService.getWorksForCalculatorByReference('WICKET', selectedWicket.id);
    
    if (wicketWorks.length > 0) {
      wicketInstallationWorks = wicketWorks.map(w => ({ id: w.id, name: w.name, price: w.price }));
    } else {
      const fenceTypeWorks = await workService.getWorksForCalculator(fenceTypeCode);
      const wicketInstallationWorksList = fenceTypeWorks
        .filter((w) => w.category === 'MOUNTING');
      
      if (wicketInstallationWorksList.length > 0) {
        wicketInstallationWorks = wicketInstallationWorksList.map(w => ({ id: w.id, name: w.name, price: w.price }));
      }
    }
  }

  const postSpacingMm = fenceType.postSpacing;
  const postSpacingM = postSpacingMm / 1000;

  let profnastilResult: ProfnastilCalculationResult | undefined;
  let panel3dResult: Panel3DCalculationResult | undefined;

  if (fenceType.name === 'Профнастил') {
    profnastilResult = await calculateProfnastil(correctedLength, height, coating);
  } else if (fenceType.name === '3D-панели') {
    panel3dResult = await calculatePanel3D(correctedLength, height);
  } else if (fenceType.name === 'Евроштакетник') {
    throw {
      error: 'CALCULATOR_NOT_IMPLEMENTED',
      message: 'Расчёт для типа забора "Евроштакетник" пока не реализован',
    } as CalculationError;
  } else if (fenceType.name === 'Сетка-рабица') {
    throw {
      error: 'CALCULATOR_NOT_IMPLEMENTED',
      message: 'Расчёт для типа забора "Сетка-рабица" пока не реализован',
    } as CalculationError;
  } else {
    throw {
      error: 'UNKNOWN_FENCE_TYPE',
      message: `Неизвестный тип забора: ${fenceType.name}`,
    } as CalculationError;
  }

  const postsResult = await (fenceType.name === 'Профнастил'
    ? calculatePostsForProfnastil(correctedLength, height, postSpacingM)
    : calculatePostsForPanel3D(correctedLength, height, postSpacingM));

  const lagsResult = await calculateLags(correctedLength, lagRows);

  let mountingHardwareResult: MountingHardwareCalculationResult[];

  if (panel3dResult) {
    mountingHardwareResult = await calculateMountingHardware({
      fenceLengthM: correctedLength,
      fenceHeightM: height,
      postsCount: postsResult.quantity,
      lagsCount: lagsResult.quantity,
      postTypeId: postsResult.nomenclatureId,
      panel3dId: panel3dResult.nomenclatureId,
      panel3dCount: panel3dResult.quantity,
    });
  } else if (profnastilResult) {
    mountingHardwareResult = await calculateMountingHardware({
      fenceLengthM: correctedLength,
      fenceHeightM: height,
      postsCount: postsResult.quantity,
      lagsCount: lagsResult.quantity,
      profnastilCount: profnastilResult.quantity,
      postTypeId: postsResult.nomenclatureId,
      lagTypeId: lagsResult.nomenclatureId,
      profnastilTypeId: profnastilResult.nomenclatureId,
    });
  } else if (selectedGate) {
    mountingHardwareResult = await calculateMountingHardware({
      fenceLengthM: correctedLength,
      fenceHeightM: height,
      postsCount: postsResult.quantity,
      lagsCount: lagsResult.quantity,
      gateId: selectedGate.id,
      gateCount: 1,
    });
  } else if (selectedWicket) {
    mountingHardwareResult = await calculateMountingHardware({
      fenceLengthM: correctedLength,
      fenceHeightM: height,
      postsCount: postsResult.quantity,
      lagsCount: lagsResult.quantity,
      wicketId: selectedWicket.id,
      wicketCount: 1,
    });
  } else {
    mountingHardwareResult = await calculateMountingHardware({
      fenceLengthM: correctedLength,
      fenceHeightM: height,
      postsCount: postsResult.quantity,
      lagsCount: lagsResult.quantity,
    });
  }

  let panel3dInstallationWorks: Array<{ id: string; name: string; price: number }> = [];

  if (panel3dResult) {
    const panel3dWorks = await workService.getWorksForCalculatorByReference('PANEL_3D', panel3dResult.nomenclatureId);
    
    if (panel3dWorks.length > 0) {
      panel3dInstallationWorks = panel3dWorks.map(w => ({ id: w.id, name: w.name, price: w.price }));
    }
  }

  const items: EstimateItem[] = [
    postsResult,
    lagsResult,
    ...(profnastilResult ? [profnastilResult] : []),
    ...(panel3dResult ? [panel3dResult] : []),
  ];

  if (hasGate && gateInfo) {
    const gateItem: GateCalculationResult = {
      category: 'gates',
      nomenclatureId: gateInfo.id,
      nomenclatureName: gateInfo.selectedName,
      quantity: 1,
      unit: 'шт',
      pricePerUnit: gateTotal,
      totalPrice: gateTotal,
    };
    items.push(gateItem);
  }

  if (input.hasWicket && wicketInfo) {
    const wicketItem: WicketCalculationResult = {
      category: 'wickets',
      nomenclatureId: wicketInfo.id,
      nomenclatureName: wicketInfo.selectedName,
      quantity: 1,
      unit: 'шт',
      pricePerUnit: wicketTotal,
      totalPrice: wicketTotal,
    };
    items.push(wicketItem);
  }

  console.log('[fenceEstimate] About to call getWorksForCalculator with:', { fenceTypeName: fenceType.name, fenceTypeCode });
  const fenceTypeWorks = await workService.getWorksForCalculator(fenceTypeCode);
  console.log('[fenceEstimate] Fence type works:', { fenceType: fenceType.name, fenceTypeCode, total: fenceTypeWorks.length });
  console.log('[fenceEstimate] All fence type works:', JSON.stringify(fenceTypeWorks, null, 2));

  const fenceTypeMountingWorks = fenceTypeWorks.filter((w) => w.category === 'MOUNTING');
  console.log('[fenceEstimate] Mounting works:', { count: fenceTypeMountingWorks.length, works: fenceTypeMountingWorks.map(w => ({ id: w.id, name: w.name, unit: w.unit, category: w.category })) });

  for (const work of fenceTypeMountingWorks) {
    let quantity = 1;
    let totalPrice = work.price;

    if (work.unit === 'MP') {
      quantity = correctedLength;
      totalPrice = correctedLength * work.price;
    } else if (work.unit === 'PCS') {
      quantity = 1;
      totalPrice = work.price;
    } else if (work.unit === 'FIXED') {
      quantity = 1;
      totalPrice = work.price;
    }

    const fenceTypeWorkItem: GateInstallationCalculationResult = {
      category: 'installation',
      nomenclatureId: work.id,
      nomenclatureName: work.name,
      quantity,
      unit: work.unit === 'MP' ? 'м.п.' : 'шт',
      pricePerUnit: work.price,
      totalPrice,
    };
    items.push(fenceTypeWorkItem);
  }

  for (const work of gateInstallationWorks) {
    const gateInstallationItem: GateInstallationCalculationResult = {
      category: 'installation',
      nomenclatureId: work.id,
      nomenclatureName: work.name,
      quantity: 1,
      unit: 'шт',
      pricePerUnit: work.price,
      totalPrice: work.price,
    };
    items.push(gateInstallationItem);
  }

  for (const work of wicketInstallationWorks) {
    const wicketInstallationItem: WicketInstallationCalculationResult = {
      category: 'installation',
      nomenclatureId: work.id,
      nomenclatureName: work.name,
      quantity: 1,
      unit: 'шт',
      pricePerUnit: work.price,
      totalPrice: work.price,
    };
    items.push(wicketInstallationItem);
  }

  for (const work of panel3dInstallationWorks) {
    const panel3dInstallationItem: GateInstallationCalculationResult = {
      category: 'installation',
      nomenclatureId: work.id,
      nomenclatureName: work.name,
      quantity: panel3dResult ? panel3dResult.quantity : 1,
      unit: 'шт',
      pricePerUnit: work.price,
      totalPrice: work.price * (panel3dResult ? panel3dResult.quantity : 1),
    };
    items.push(panel3dInstallationItem);
  }

  items.push(...mountingHardwareResult);

  const mountingHardwareTotal = mountingHardwareResult.reduce((sum, item) => sum + item.totalPrice, 0);
  const gateInstallationTotal = gateInstallationWorks.reduce((sum, work) => sum + work.price, 0);
  const wicketInstallationTotal = wicketInstallationWorks.reduce((sum, work) => sum + work.price, 0);
  const panel3dInstallationTotal = panel3dInstallationWorks.reduce((sum, work) => sum + work.price * (panel3dResult ? panel3dResult.quantity : 1), 0);

  const fenceTypeMountingWorksTotal = fenceTypeMountingWorks.reduce((sum, work) => {
    if (work.unit === 'MP') {
      return sum + (correctedLength * work.price);
    }
    return sum + work.price;
  }, 0);

  const materials = postsResult.totalPrice + lagsResult.totalPrice + (profnastilResult?.totalPrice || 0) + (panel3dResult?.totalPrice || 0) + gateTotal + wicketTotal + mountingHardwareTotal;
  const installation = gateInstallationTotal + wicketInstallationTotal + panel3dInstallationTotal + fenceTypeMountingWorksTotal;
  const grandTotal = materials + installation;

  const estimate = await prisma.$transaction(async (tx) => {
    return await tx.fenceEstimate.create({
      data: {
        id: `estimate-${crypto.randomUUID()}`,
        fenceTypeId,
        length: correctedLength,
        height,
        lagRows,
        coating,
        hasGate: hasGate || false,
        gateType: gateType || null,
        gateLength: gateInfo?.length || null,
        gateNomenclatureId: gateInfo ? gateInfo.id : null,
        gateNomenclatureName: gateInfo ? gateInfo.selectedName : null,
        postsTotal: postsResult.totalPrice,
        lagsTotal: lagsResult.totalPrice,
        profnastilTotal: profnastilResult?.totalPrice || 0,
        mountingHardwareTotal,
        gateTotal,
        gateInstallationTotal,
        hasWicket: input.hasWicket || false,
        wicketWidth: wicketInfo?.width || null,
        wicketNomenclatureId: wicketInfo ? wicketInfo.id : null,
        wicketNomenclatureName: wicketInfo ? wicketInfo.selectedName : null,
        wicketTotal,
        wicketInstallationTotal,
        panel3dId: panel3dResult ? panel3dResult.nomenclatureId : null,
        panel3dNomenclatureName: panel3dResult ? panel3dResult.nomenclatureName : null,
        panel3dTotal: panel3dResult?.totalPrice || 0,
        panel3dInstallationTotal,
        installationTotal: installation,
        materialsTotal: materials,
        grandTotal,
        items: JSON.parse(JSON.stringify(items)),
        userId: metadata?.userId,
        sessionId: metadata?.sessionId,
        userAgent: metadata?.userAgent,
        ipAddress: metadata?.ipAddress,
        city: null,
      },
    });
  });

  if (metadata?.ipAddress) {
    getCityByIP(metadata.ipAddress)
      .then(city => {
        if (city) {
          return prisma.fenceEstimate.update({
            where: { id: estimate.id },
            data: { city },
          });
        }
        return null;
      })
      .catch(err => console.error('[IP Lookup] Background update failed:', err));
  }

  return {
    estimateId: estimate.id,
    items,
    totals: {
      materials,
      installation,
      grandTotal,
    },
    parameters: {
      fenceTypeId,
      fenceTypeName: fenceType.name,
      length,
      height,
      lagRows,
      coating,
      ...(gateInfo ? { gate: gateInfo } : {}),
      ...(wicketInfo ? { wicket: wicketInfo } : {}),
    },
    calculatedAt: estimate.createdAt.toISOString(),
  };
}



export async function getFenceEstimateById(id: string): Promise<FenceEstimateResult | null> {
  const estimate = await prisma.fenceEstimate.findUnique({
    where: { id },
    include: { fenceType: true },
  });

  if (!estimate) {
    return null;
  }

  const gateInfo: GateInfo | undefined = estimate.hasGate && estimate.gateType && estimate.gateLength
    ? {
        id: estimate.gateNomenclatureId || '',
        type: estimate.gateType,
        length: estimate.gateLength,
        selectedName: estimate.gateNomenclatureName || 'Ворота',
      }
    : undefined;

  const wicketInfo: WicketInfo | undefined = estimate.hasWicket && estimate.wicketWidth
    ? {
        id: estimate.wicketNomenclatureId || '',
        width: estimate.wicketWidth,
        selectedName: estimate.wicketNomenclatureName || 'Калитка',
      }
    : undefined;

  return {
    estimateId: estimate.id,
    items: estimate.items as unknown as EstimateItem[],
    totals: {
      materials: estimate.materialsTotal,
      installation: estimate.installationTotal,
      grandTotal: estimate.grandTotal,
    },
    parameters: {
      fenceTypeId: estimate.fenceTypeId,
      fenceTypeName: estimate.fenceType.name,
      length: estimate.length,
      height: estimate.height,
      lagRows: estimate.lagRows as 2 | 3,
      coating: estimate.coating as 'GALVANIZED' | 'POLYMER_SINGLE' | 'POLYMER_DOUBLE',
      ...(gateInfo ? { gate: gateInfo } : {}),
      ...(wicketInfo ? { wicket: wicketInfo } : {}),
    },
    calculatedAt: estimate.createdAt.toISOString(),
  };
}
