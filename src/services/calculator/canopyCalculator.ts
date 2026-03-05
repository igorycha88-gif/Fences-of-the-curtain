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

export interface CanopyCalculatorInput {
  canopyType: 'single-slope' | 'double-slope' | 'arch';
  purpose: 'car-1' | 'car-2' | 'car-3' | 'gazebo' | 'terrace' | 'storage';
  length: number;
  width: number;
  height: number;
  frameMaterial: string;
  roofMaterial: string;
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
  const { length, width, height, canopyType, hasWaterSystem } = input;

  const areaCoef = getAreaCoef(canopyType);
  const roofArea = length * width * areaCoef;
  const perimeter = (length + width) * 2;

  const materials: MaterialItem[] = [];
  const works: WorkItem[] = [];

  materials.push({
    name: 'Поликарбонат сотовый 8мм',
    quantity: roofArea,
    unit: 'м²',
    pricePerUnit: 800,
    total: roofArea * 800,
  });

  materials.push({
    name: 'Профиль 60x60 для каркаса',
    quantity: perimeter,
    unit: 'м.п.',
    pricePerUnit: 450,
    total: perimeter * 450,
  });

  materials.push({
    name: 'Профиль 40x20 для стропил',
    quantity: length * 3,
    unit: 'м.п.',
    pricePerUnit: 280,
    total: length * 3 * 280,
  });

  materials.push({
    name: 'Стойки 80x80',
    quantity: Math.max(4, Math.ceil(perimeter / 3)),
    unit: 'шт',
    pricePerUnit: 1800,
    total: Math.max(4, Math.ceil(perimeter / 3)) * 1800,
  });

  if (hasWaterSystem) {
    materials.push({
      name: 'Водосточная система',
      quantity: perimeter,
      unit: 'м.п.',
      pricePerUnit: 350,
      total: perimeter * 350,
    });
  }

  materials.push({
    name: 'Крепеж',
    quantity: roofArea * 15,
    unit: 'шт',
    pricePerUnit: 8,
    total: roofArea * 15 * 8,
  });

  works.push({
    name: 'Монтаж навеса',
    quantity: roofArea,
    unit: 'м²',
    pricePerUnit: 1500,
    total: roofArea * 1500,
  });

  works.push({
    name: 'Установка стоек',
    quantity: Math.max(4, Math.ceil(perimeter / 3)),
    unit: 'шт',
    pricePerUnit: 1000,
    total: Math.max(4, Math.ceil(perimeter / 3)) * 1000,
  });

  const materialsTotal = materials.reduce((sum, m) => sum + m.total, 0);
  const worksTotal = works.reduce((sum, w) => sum + w.total, 0);

  return {
    materials,
    works,
    materialsTotal,
    worksTotal,
    grandTotal: materialsTotal + worksTotal,
  };
}

function getAreaCoef(type: string): number {
  const coefficients: Record<string, number> = {
    'single-slope': 1.0,
    'double-slope': 1.1,
    'arch': 1.15,
  };

  return coefficients[type] || 1.0;
}
