import { prisma } from '@/lib/prisma';
import { FenceEstimateInput } from '@/lib/validators/fenceEstimate';
import { calculatePosts, PostCalculationResult } from './postCalculator';
import { calculateLags, LagCalculationResult } from './lagCalculator';
import { calculateProfnastil, ProfnastilCalculationResult } from './profnastilCalculator';
import { calculateInstallation, InstallationCalculationResult } from './installationCalculator';
import { calculateMountingHardware, MountingHardwareCalculationResult } from './mountingHardwareCalculator';
import { findGateByTypeAndLength, GateTypeValue } from './gateLookup';
import { findWicketByHeightAndWidth } from './wicketLookup';
import { workService } from '@/services/admin/workService';
import { getCityByIP } from '@/services/admin/ipLookupService';

type EstimateItem = PostCalculationResult | LagCalculationResult | ProfnastilCalculationResult | InstallationCalculationResult | MountingHardwareCalculationResult | GateCalculationResult | GateInstallationCalculationResult | WicketCalculationResult | WicketInstallationCalculationResult;

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
    coating: 'GALVANIZED' | 'POLYMER_SINGLE' | 'POLYMER_DOUBLE';
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

  if (!fenceType) {
    throw {
      error: 'NO_FENCE_TYPE',
      message: 'Тип забора не найден',
    } as CalculationError;
  }

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
      const fenceTypeWorks = await workService.getWorksForCalculator(fenceType.name);
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
      const fenceTypeWorks = await workService.getWorksForCalculator(fenceType.name);
      const wicketInstallationWorksList = fenceTypeWorks
        .filter((w) => w.category === 'MOUNTING');
      
      if (wicketInstallationWorksList.length > 0) {
        wicketInstallationWorks = wicketInstallationWorksList.map(w => ({ id: w.id, name: w.name, price: w.price }));
      }
    }
  }

  const postSpacingMm = fenceType.postSpacing;
  const postSpacingM = postSpacingMm / 1000;

  const [postsResult, lagsResult, profnastilResult] = await Promise.all([
    calculatePosts(correctedLength, height, postSpacingM),
    calculateLags(correctedLength, lagRows),
    (async () => {
      if (fenceType.name === 'Профнастил') {
        return calculateProfnastil(length, height, coating);
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
      } else if (fenceType.name === '3D -панели') {
        throw {
          error: 'CALCULATOR_NOT_IMPLEMENTED',
          message: 'Расчёт для типа забора "3D -панели" пока не реализован',
        } as CalculationError;
      } else {
        throw {
          error: 'UNKNOWN_FENCE_TYPE',
          message: `Неизвестный тип забора: ${fenceType.name}`,
        } as CalculationError;
      }
    })(),
  ]);

  const installationBase = calculateInstallation(length);

  const mountingHardwareResult = await calculateMountingHardware({
    fenceLengthM: correctedLength,
    fenceHeightM: height,
    postsCount: postsResult.quantity,
    lagsCount: lagsResult.quantity,
    profnastilCount: profnastilResult?.quantity || 0,
    postTypeId: postsResult.nomenclatureId,
    lagTypeId: lagsResult.nomenclatureId,
    profnastilTypeId: profnastilResult?.nomenclatureId || '',
  });

  const items: EstimateItem[] = [
    postsResult,
    lagsResult,
    ...(profnastilResult ? [profnastilResult] : []),
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

  items.push(installationBase);

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

  items.push(...mountingHardwareResult);

  const mountingHardwareTotal = mountingHardwareResult.reduce((sum, item) => sum + item.totalPrice, 0);
  const gateInstallationTotal = gateInstallationWorks.reduce((sum, work) => sum + work.price, 0);
  const wicketInstallationTotal = wicketInstallationWorks.reduce((sum, work) => sum + work.price, 0);
  const materials = postsResult.totalPrice + lagsResult.totalPrice + (profnastilResult?.totalPrice || 0) + gateTotal + wicketTotal + mountingHardwareTotal;
  const installation = installationBase.totalPrice + gateInstallationTotal + wicketInstallationTotal;
  const grandTotal = materials + installation;

  const estimate = await prisma.fenceEstimate.create({
    data: {
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
