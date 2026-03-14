import { prisma } from '@/lib/prisma';
import { FenceEstimateInput } from '@/lib/validators/fenceEstimate';
import { calculatePosts, PostCalculationResult } from './postCalculator';
import { calculateLags, LagCalculationResult } from './lagCalculator';
import { calculateProfnastil, ProfnastilCalculationResult } from './profnastilCalculator';
import { calculateInstallation, InstallationCalculationResult } from './installationCalculator';
import { calculateMountingHardware, MountingHardwareCalculationResult } from './mountingHardwareCalculator';
import { findGateByTypeAndLength, GateTypeValue } from './gateLookup';
import { workService } from '@/services/admin/workService';

type EstimateItem = PostCalculationResult | LagCalculationResult | ProfnastilCalculationResult | InstallationCalculationResult | MountingHardwareCalculationResult | GateCalculationResult | GateInstallationCalculationResult;

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

export interface GateInfo {
  type: string;
  length: number;
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
  let gateInstallationTotal = 0;

  console.log('[fenceEstimate] Gate params:', { hasGate, gateType, gateWidth });

  if (hasGate && gateType && gateWidth) {
    const gateWidthMm = Math.round(gateWidth * 1000);
    console.log('[fenceEstimate] Calling findGateByTypeAndLength:', { gateType, gateWidthMm });
    const selectedGate = await findGateByTypeAndLength(gateType as GateTypeValue, gateWidthMm);
    console.log('[fenceEstimate] Selected gate:', selectedGate);

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
      type: selectedGate.type,
      length: selectedGate.gateLength,
      selectedName: selectedGate.name,
    };
    gateTotal = selectedGate.retailPrice;

    const gateWorks = await workService.getWorksForCalculatorByReference('GATE', selectedGate.id);
    
    if (gateWorks.length > 0) {
      const gateInstallationWork = gateWorks.sort((a, b) => a.sortOrder - b.sortOrder)[0];
      gateInstallationTotal = gateInstallationWork.price;
    } else {
      const fenceTypeWorks = await workService.getWorksForCalculator(fenceType.name);
      const gateInstallationWork = fenceTypeWorks
        .filter((w) => w.category === 'MOUNTING')
        .sort((a, b) => a.sortOrder - b.sortOrder)[0];
      
      if (gateInstallationWork) {
        gateInstallationTotal = gateInstallationWork.price;
      }
    }
  }

  const postSpacingMm = fenceType.postSpacing;
  const postSpacingM = postSpacingMm / 1000;

  const [postsResult, lagsResult] = await Promise.all([
    calculatePosts(correctedLength, height, postSpacingM),
    calculateLags(correctedLength, lagRows),
  ]);

  const installationBase = calculateInstallation(length);

  let profnastilResult: ProfnastilCalculationResult | null = null;

  if (fenceType.name === 'Профнастил') {
    profnastilResult = await calculateProfnastil(length, height, coating);
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
      nomenclatureId: gateInfo.selectedName,
      nomenclatureName: gateInfo.selectedName,
      quantity: 1,
      unit: 'шт',
      pricePerUnit: gateTotal,
      totalPrice: gateTotal,
    };
    items.push(gateItem);
  }

  items.push(installationBase);

  if (gateInstallationTotal > 0) {
    const gateInstallationItem: GateInstallationCalculationResult = {
      category: 'installation',
      nomenclatureId: 'gate-installation',
      nomenclatureName: 'Установка ворот',
      quantity: 1,
      unit: 'шт',
      pricePerUnit: gateInstallationTotal,
      totalPrice: gateInstallationTotal,
    };
    items.push(gateInstallationItem);
  }

  items.push(...mountingHardwareResult);

  const mountingHardwareTotal = mountingHardwareResult.reduce((sum, item) => sum + item.totalPrice, 0);
  const materials = postsResult.totalPrice + lagsResult.totalPrice + (profnastilResult?.totalPrice || 0) + gateTotal + mountingHardwareTotal;
  const installation = installationBase.totalPrice + gateInstallationTotal;
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
      gateNomenclatureId: gateInfo ? gateInfo.selectedName : null,
      gateNomenclatureName: gateInfo ? gateInfo.selectedName : null,
      postsTotal: postsResult.totalPrice,
      lagsTotal: lagsResult.totalPrice,
      profnastilTotal: profnastilResult.totalPrice,
      mountingHardwareTotal,
      gateTotal,
      gateInstallationTotal,
      installationTotal: installation,
      materialsTotal: materials,
      grandTotal,
      items: JSON.parse(JSON.stringify(items)),
      userId: metadata?.userId,
      sessionId: metadata?.sessionId,
      userAgent: metadata?.userAgent,
      ipAddress: metadata?.ipAddress,
    },
  });

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
        type: estimate.gateType,
        length: estimate.gateLength,
        selectedName: estimate.gateNomenclatureName || 'Ворота',
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
    },
    calculatedAt: estimate.createdAt.toISOString(),
  };
}
