import { prisma } from '@/lib/prisma';
import logger from '@/lib/logger';

export interface MaterialItem {
  name: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  total: number;
}

export interface WorkItem {
  name: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  total: number;
}

export type CanopyRoofType = 'SINGLE_SLOPE' | 'DOUBLE_SLOPE' | 'ARCH' | 'SINGLE_SLOPE_CURVED';

export interface CanopyCalculatorInput {
  canopyType: CanopyRoofType;
  purpose: string;
  postTypeId: string;
  length: number;
  width: number;
  height: number;
  ridgeHeight: number;
  roofCoveringId: string;
  installationType: 'ground' | 'wall' | 'base';
  hasWaterSystem: boolean;
}

export interface CanopyCalculatorResult {
  materials: MaterialItem[];
  works: WorkItem[];
  materialsTotal: number;
  worksTotal: number;
  grandTotal: number;
}

export async function calculateCanopy(
  input: CanopyCalculatorInput
): Promise<CanopyCalculatorResult> {
  logger.info('Starting canopy calculation', { input });

  const { length, width, height, canopyType, hasWaterSystem, postTypeId, roofCoveringId } = input;

  const [postProfile, roofCovering] = await Promise.all([
    prisma.trussProfileType.findUnique({ where: { id: postTypeId } }),
    prisma.trussRoofCovering.findUnique({ where: { id: roofCoveringId } }),
  ]);

  if (!postProfile) {
    logger.error('Post profile not found', { postTypeId });
    throw new Error(`Профиль столба не найден: ${postTypeId}`);
  }
  if (!roofCovering) {
    logger.error('Roof covering not found', { roofCoveringId });
    throw new Error(`Покрытие крыши не найдено: ${roofCoveringId}`);
  }

  const areaCoef = getAreaCoef(canopyType);
  const roofArea = length * width * areaCoef;
  const perimeter = (length + width) * 2;

  const materials: MaterialItem[] = [];
  const works: WorkItem[] = [];

  materials.push({
    name: roofCovering.name,
    quantity: Math.ceil(roofArea * 100) / 100,
    unit: 'м²',
    pricePerUnit: roofCovering.retailPricePerSqm,
    total: Math.ceil(roofArea * 100) / 100 * roofCovering.retailPricePerSqm,
  });

  const profilePerimeter = perimeter;
  materials.push({
    name: 'Профиль 60x60 для каркаса',
    quantity: Math.ceil(profilePerimeter * 100) / 100,
    unit: 'м.п.',
    pricePerUnit: 450,
    total: Math.ceil(profilePerimeter * 100) / 100 * 450,
  });

  materials.push({
    name: 'Профиль 40x20 для стропил',
    quantity: Math.ceil(length * 3 * 100) / 100,
    unit: 'м.п.',
    pricePerUnit: 280,
    total: Math.ceil(length * 3 * 100) / 100 * 280,
  });

  const postCount = Math.max(4, Math.ceil(perimeter / 3));
  materials.push({
    name: postProfile.name,
    quantity: postCount,
    unit: 'шт',
    pricePerUnit: postProfile.retailPricePerUnit || postProfile.retailPricePerMeter * height,
    total: postCount * (postProfile.retailPricePerUnit || postProfile.retailPricePerMeter * height),
  });

  if (hasWaterSystem) {
    materials.push({
      name: 'Водосточная система',
      quantity: Math.ceil(perimeter * 100) / 100,
      unit: 'м.п.',
      pricePerUnit: 350,
      total: Math.ceil(perimeter * 100) / 100 * 350,
    });
  }

  materials.push({
    name: 'Крепеж',
    quantity: Math.ceil(roofArea * 15),
    unit: 'шт',
    pricePerUnit: 8,
    total: Math.ceil(roofArea * 15) * 8,
  });

  works.push({
    name: 'Монтаж навеса',
    quantity: Math.ceil(roofArea * 100) / 100,
    unit: 'м²',
    pricePerUnit: 1500,
    total: Math.ceil(roofArea * 100) / 100 * 1500,
  });

  works.push({
    name: 'Установка стоек',
    quantity: postCount,
    unit: 'шт',
    pricePerUnit: 1000,
    total: postCount * 1000,
  });

  const materialsTotal = materials.reduce((sum, m) => sum + m.total, 0);
  const worksTotal = works.reduce((sum, w) => sum + w.total, 0);

  const result: CanopyCalculatorResult = {
    materials,
    works,
    materialsTotal,
    worksTotal,
    grandTotal: materialsTotal + worksTotal,
  };

  logger.info('Canopy calculation completed', { grandTotal: result.grandTotal });

  return result;
}

function getAreaCoef(type: string): number {
  const coefficients: Record<string, number> = {
    'SINGLE_SLOPE': 1.0,
    'DOUBLE_SLOPE': 1.1,
    'ARCH': 1.15,
    'SINGLE_SLOPE_CURVED': 1.1,
  };

  return coefficients[type] || 1.0;
}
