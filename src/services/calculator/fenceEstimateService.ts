import { prisma } from '@/lib/prisma';
import { FenceEstimateInput } from '@/lib/validators/fenceEstimate';
import { calculatePosts, calculatePostsForProfnastil, calculatePostsForPanel3D, PostCalculationResult } from './postCalculator';
import { calculateLags, LagCalculationResult } from './lagCalculator';
import { calculateProfnastil, ProfnastilCalculationResult } from './profnastilCalculator';
import { calculatePanel3D, Panel3DCalculationResult } from './panel3DCalculator';
import { calculatePicket, PicketCalculationResult, MountingType } from './picketCalculator';

import { calculateMountingHardware, MountingHardwareCalculationResult } from './mountingHardwareCalculator';
import { findGateByTypeAndLength, GateTypeValue } from './gateLookup';
import { findWicketByHeightAndWidth } from './wicketLookup';
import { workService } from '@/services/admin/workService';
import { fenceTypeCalculatorService } from '@/services/calculator/fenceTypeCalculatorService';
import { getCityByIP } from '@/services/admin/ipLookupService';
import { createAuditLogAsync, getSystemUserId } from '@/lib/audit';
import { getFenceTypeCodeByName } from '@/lib/fenceTypeMap';

type EstimateItem = PostCalculationResult | LagCalculationResult | ProfnastilCalculationResult | Panel3DCalculationResult | PicketCalculationResult | MountingHardwareCalculationResult | GateCalculationResult | GateInstallationCalculationResult | WicketCalculationResult | WicketInstallationCalculationResult;

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

export interface FenceEstimateCoreResult {
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
  correctedLength: number;
  gateInfo?: GateInfo;
  wicketInfo?: WicketInfo;
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

export async function calculateFenceEstimateCore(
  input: FenceEstimateInput
): Promise<FenceEstimateCoreResult> {
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

  if (fenceType.name !== '3D-панели' && !lagRows) {
    throw {
      error: 'MISSING_LAG_ROWS',
      message: 'Количество лаг обязательно для этого типа забора',
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
  let picketResult: PicketCalculationResult | undefined;

  if (fenceType.name === 'Профнастил') {
    profnastilResult = await calculateProfnastil(correctedLength, height, coating);
  } else if (fenceType.name === '3D-панели') {
    panel3dResult = await calculatePanel3D(correctedLength, height);
  } else if (fenceType.name === 'Евроштакетник') {
    if (!input.picketProfileType || !input.picketStep || !input.picketMountingType) {
      throw {
        error: 'MISSING_PICKET_PARAMS',
        message: 'Для расчёта Евроштакетника необходимо указать тип профиля, шаг и тип монтажа',
      } as CalculationError;
    }
    picketResult = await calculatePicket({
      fenceLengthM: correctedLength,
      fenceHeightM: height,
      profileTypeName: input.picketProfileType,
      stepCm: input.picketStep,
      mountingType: input.picketMountingType as MountingType,
    });
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

  const lagsResult = fenceType.name === '3D-панели'
    ? null
    : await calculateLags(correctedLength, lagRows!);

  let mountingHardwareResult: MountingHardwareCalculationResult[];

  if (panel3dResult) {
    mountingHardwareResult = await calculateMountingHardware({
      fenceLengthM: correctedLength,
      fenceHeightM: height,
      postsCount: postsResult.quantity,
      lagsCount: 0,
      postTypeId: postsResult.nomenclatureId,
      panel3dId: panel3dResult.nomenclatureId,
      panel3dCount: panel3dResult.quantity,
    });
  } else if (picketResult) {
    mountingHardwareResult = await calculateMountingHardware({
      fenceLengthM: correctedLength,
      fenceHeightM: height,
      postsCount: postsResult.quantity,
      lagsCount: lagsResult!.quantity,
      postTypeId: postsResult.nomenclatureId,
      lagTypeId: lagsResult!.nomenclatureId,
      picketId: picketResult.nomenclatureId,
      picketCount: picketResult.quantity,
    });
  } else if (profnastilResult) {
    mountingHardwareResult = await calculateMountingHardware({
      fenceLengthM: correctedLength,
      fenceHeightM: height,
      postsCount: postsResult.quantity,
      lagsCount: lagsResult!.quantity,
      profnastilCount: profnastilResult.quantity,
      postTypeId: postsResult.nomenclatureId,
      lagTypeId: lagsResult!.nomenclatureId,
      profnastilTypeId: profnastilResult.nomenclatureId,
    });
  } else if (selectedGate) {
    mountingHardwareResult = await calculateMountingHardware({
      fenceLengthM: correctedLength,
      fenceHeightM: height,
      postsCount: postsResult.quantity,
      lagsCount: lagsResult!.quantity,
      gateId: selectedGate.id,
      gateCount: 1,
    });
  } else if (selectedWicket) {
    mountingHardwareResult = await calculateMountingHardware({
      fenceLengthM: correctedLength,
      fenceHeightM: height,
      postsCount: postsResult.quantity,
      lagsCount: lagsResult!.quantity,
      wicketId: selectedWicket.id,
      wicketCount: 1,
    });
  } else {
    mountingHardwareResult = await calculateMountingHardware({
      fenceLengthM: correctedLength,
      fenceHeightM: height,
      postsCount: postsResult.quantity,
      lagsCount: lagsResult!.quantity,
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
    ...(lagsResult ? [lagsResult] : []),
    ...(profnastilResult ? [profnastilResult] : []),
    ...(panel3dResult ? [panel3dResult] : []),
    ...(picketResult ? [picketResult] : []),
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

  const referenceQuantityMap: Record<string, number> = {};
  if (picketResult) {
    referenceQuantityMap[`PICKET:${picketResult.nomenclatureId}`] = picketResult.quantity;
  }
  if (profnastilResult) {
    referenceQuantityMap[`PROFNASTIL:${profnastilResult.nomenclatureId}`] = profnastilResult.quantity;
  }
  if (panel3dResult) {
    referenceQuantityMap[`PANEL_3D:${panel3dResult.nomenclatureId}`] = panel3dResult.quantity;
  }

  for (const work of fenceTypeMountingWorks) {
    let quantity = 1;
    let totalPrice = work.price;

    const hasReferenceRelation = work.relations?.some(
      (rel) => rel.referenceType && rel.referenceId
    );

    if (work.unit === 'MP') {
      quantity = correctedLength;
      totalPrice = correctedLength * work.price;
    } else if (work.unit === 'PCS') {
      if (hasReferenceRelation) {
        const matchingRel = work.relations?.find(
          (rel) => rel.referenceType && rel.referenceId && referenceQuantityMap[`${rel.referenceType}:${rel.referenceId}`]
        );
        if (matchingRel) {
          quantity = referenceQuantityMap[`${matchingRel.referenceType}:${matchingRel.referenceId}`];
        }
      }
      totalPrice = quantity * work.price;
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
    const hasReferenceRelation = work.relations?.some(
      (rel) => rel.referenceType && rel.referenceId
    );
    if (work.unit === 'MP') {
      return sum + (correctedLength * work.price);
    } else if (work.unit === 'PCS' && hasReferenceRelation) {
      const matchingRel = work.relations?.find(
        (rel) => rel.referenceType && rel.referenceId && referenceQuantityMap[`${rel.referenceType}:${rel.referenceId}`]
      );
      if (matchingRel) {
        const qty = referenceQuantityMap[`${matchingRel.referenceType}:${matchingRel.referenceId}`];
        return sum + (qty * work.price);
      }
    }
    return sum + work.price;
  }, 0);

  const materials = postsResult.totalPrice + (lagsResult?.totalPrice || 0) + (profnastilResult?.totalPrice || 0) + (panel3dResult?.totalPrice || 0) + (picketResult?.totalPrice || 0) + gateTotal + wicketTotal + mountingHardwareTotal;
  const installation = gateInstallationTotal + wicketInstallationTotal + panel3dInstallationTotal + fenceTypeMountingWorksTotal;
  const grandTotal = materials + installation;

  return {
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
      lagRows: lagRows || 2,
      coating,
      ...(gateInfo ? { gate: gateInfo } : {}),
      ...(wicketInfo ? { wicket: wicketInfo } : {}),
    },
    correctedLength,
    gateInfo,
    wicketInfo,
  };
}

export async function calculateFenceEstimate(
  input: FenceEstimateInput,
  metadata?: { userId?: string; sessionId?: string; userAgent?: string; ipAddress?: string }
): Promise<FenceEstimateResult> {
  const coreResult = await calculateFenceEstimateCore(input);

  const estimate = await prisma.$transaction(async (tx) => {
    return await tx.fenceEstimate.create({
      data: {
        id: `estimate-${crypto.randomUUID()}`,
        fenceTypeId: input.fenceTypeId,
        length: coreResult.correctedLength,
        height: input.height,
        lagRows: input.lagRows || 2,
        coating: input.coating,
        hasGate: input.hasGate || false,
        gateType: input.gateType || null,
        gateLength: coreResult.gateInfo?.length || null,
        gateNomenclatureId: coreResult.gateInfo ? coreResult.gateInfo.id : null,
        gateNomenclatureName: coreResult.gateInfo ? coreResult.gateInfo.selectedName : null,
        postsTotal: (coreResult.items.find(i => i.category === 'posts')?.totalPrice || 0),
        lagsTotal: (coreResult.items.find(i => i.category === 'lags')?.totalPrice || 0),
        profnastilTotal: (coreResult.items.find(i => i.category === 'profnastil')?.totalPrice || 0),
        mountingHardwareTotal: coreResult.items
          .filter(i => i.category === 'mounting_hardware')
          .reduce((sum, item) => sum + item.totalPrice, 0),
        gateTotal: (coreResult.items.find(i => i.category === 'gates')?.totalPrice || 0),
        gateInstallationTotal: coreResult.items
          .filter(i => i.category === 'installation' && i.nomenclatureName.includes('ворот'))
          .reduce((sum, item) => sum + item.totalPrice, 0),
        hasWicket: input.hasWicket || false,
        wicketWidth: coreResult.wicketInfo?.width || null,
        wicketNomenclatureId: coreResult.wicketInfo ? coreResult.wicketInfo.id : null,
        wicketNomenclatureName: coreResult.wicketInfo ? coreResult.wicketInfo.selectedName : null,
        wicketTotal: (coreResult.items.find(i => i.category === 'wickets')?.totalPrice || 0),
        wicketInstallationTotal: coreResult.items
          .filter(i => i.category === 'installation' && i.nomenclatureName.includes('калитк'))
          .reduce((sum, item) => sum + item.totalPrice, 0),
        panel3dId: (coreResult.items.find(i => i.category === 'panel3d') as Panel3DCalculationResult)?.nomenclatureId || null,
        panel3dNomenclatureName: (coreResult.items.find(i => i.category === 'panel3d') as Panel3DCalculationResult)?.nomenclatureName || null,
        panel3dTotal: (coreResult.items.find(i => i.category === 'panel3d')?.totalPrice || 0),
        panel3dInstallationTotal: coreResult.items
          .filter(i => i.category === 'installation' && i.nomenclatureName.includes('панел'))
          .reduce((sum, item) => sum + item.totalPrice, 0),
        picketNomenclatureId: (coreResult.items.find(i => i.category === 'picket') as PicketCalculationResult)?.nomenclatureId || null,
        picketNomenclatureName: (coreResult.items.find(i => i.category === 'picket') as PicketCalculationResult)?.nomenclatureName || null,
        picketTotal: (coreResult.items.find(i => i.category === 'picket')?.totalPrice || 0),
        picketStep: input.picketStep || null,
        picketMountingType: input.picketMountingType || null,
        picketProfileType: input.picketProfileType || null,
        picketCoatingName: input.picketCoating || null,
        installationTotal: coreResult.totals.installation,
        materialsTotal: coreResult.totals.materials,
        grandTotal: coreResult.totals.grandTotal,
        items: JSON.parse(JSON.stringify(coreResult.items)),
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
    items: coreResult.items,
    totals: coreResult.totals,
    parameters: coreResult.parameters,
    calculatedAt: estimate.createdAt.toISOString(),
  };
}

export async function calculateFenceEstimateDryRun(
  input: FenceEstimateInput
): Promise<Omit<FenceEstimateResult, 'estimateId' | 'calculatedAt'>> {
  const coreResult = await calculateFenceEstimateCore(input);

  return {
    items: coreResult.items,
    totals: coreResult.totals,
    parameters: coreResult.parameters,
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
