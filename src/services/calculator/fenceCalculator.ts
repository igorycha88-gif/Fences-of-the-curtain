interface MaterialItem {
  name: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  total: number;
}

interface WorkItem {
  name: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  total: number;
}

export interface FenceCalculatorInput {
  fenceTypeId: string;
  length: number;
  height: number;
  postType: string;
  lagType: string;
  lagRows: 2 | 3;
  hasGate: boolean;
  gateType?: 'SWING' | 'SLIDING';
  gateWidth?: number;
  hasWicket: boolean;
  wicketWidth?: number;
  coating: 'GALVANIZED' | 'POLYMER_SINGLE' | 'POLYMER_DOUBLE';
  color?: string;
  region?: string;
  difficultyCoef?: number;
  postSpacing?: number;
}

export interface FenceCalculatorResult {
  materials: MaterialItem[];
  works: WorkItem[];
  materialsTotal: number;
  worksTotal: number;
  grandTotal: number;
}

export async function calculateFence(
  input: FenceCalculatorInput
): Promise<FenceCalculatorResult> {
  const {
    length,
    height,
    lagRows,
    hasGate,
    gateWidth = 4,
    hasWicket,
    wicketWidth = 1,
    postSpacing = 2500,
    difficultyCoef = 1.0,
  } = input;

  const postSpacingM = postSpacing / 1000;
  const postsCount = Math.ceil(length / postSpacingM) + 1;
  const lagsLength = length * lagRows;
  const coverageArea = length * height;

  const materials: MaterialItem[] = [];
  const works: WorkItem[] = [];

  materials.push({
    name: 'Профнастил С8',
    quantity: coverageArea,
    unit: 'м²',
    pricePerUnit: 450,
    total: coverageArea * 450,
  });

  materials.push({
    name: 'Столбы металлические',
    quantity: postsCount,
    unit: 'шт',
    pricePerUnit: 1200,
    total: postsCount * 1200,
  });

  materials.push({
    name: 'Лаги металлические',
    quantity: lagsLength,
    unit: 'м.п.',
    pricePerUnit: 300,
    total: lagsLength * 300,
  });

  if (hasGate) {
    materials.push({
      name: input.gateType === 'SWING' ? 'Ворота распашные' : 'Ворота откатные',
      quantity: 1,
      unit: 'шт',
      pricePerUnit: input.gateType === 'SWING' ? 15000 : 25000,
      total: input.gateType === 'SWING' ? 15000 : 25000,
    });

    works.push({
      name: 'Установка ворот',
      quantity: 1,
      unit: 'шт',
      pricePerUnit: 5000,
      total: 5000,
    });
  }

  if (hasWicket) {
    materials.push({
      name: 'Калитка',
      quantity: 1,
      unit: 'шт',
      pricePerUnit: 8000,
      total: 8000,
    });

    works.push({
      name: 'Установка калитки',
      quantity: 1,
      unit: 'шт',
      pricePerUnit: 3000,
      total: 3000,
    });
  }

  materials.push({
    name: 'Крепеж',
    quantity: length * 10,
    unit: 'шт',
    pricePerUnit: 5,
    total: length * 10 * 5,
  });

  works.push({
    name: 'Монтаж забора',
    quantity: length,
    unit: 'м.п.',
    pricePerUnit: 800,
    total: length * 800,
  });

  works.push({
    name: 'Бетонирование столбов',
    quantity: postsCount,
    unit: 'шт',
    pricePerUnit: 500,
    total: postsCount * 500,
  });

  const materialsTotal = materials.reduce((sum, m) => sum + m.total, 0);
  const worksTotal = works.reduce((sum, w) => sum + w.total, 0) * difficultyCoef;

  return {
    materials,
    works,
    materialsTotal,
    worksTotal,
    grandTotal: materialsTotal + worksTotal,
  };
}
