import { prisma } from '@/lib/prisma';
import { cache } from '@/lib/cache';
import { CACHE_KEYS, CACHE_TTL } from '@/lib/cache-keys';

export type MeshCoatingType = 'GALVANIZED' | 'POLYMER';

const MESH_COATING_MAPPING = {
  'GALVANIZED': 'Оцинковка',
  'POLYMER': 'Полимерное',
} as const;

export interface MeshCalculationResult {
  category: 'mesh';
  nomenclatureId: string;
  nomenclatureName: string;
  quantity: number;
  unit: 'м.п.';
  pricePerUnit: number;
  totalPrice: number;
  height: number;
  cellSize: number;
  wireThickness: number;
  coating: string;
}

export interface MeshCalculationError {
  error: 'NO_MESH_FOUND';
  message: string;
  details: {
    requiredHeight: number;
    cellSize: number;
    wireThickness: number;
    coating: string;
    suggestion: string;
  };
}

async function getActiveMesh() {
  return cache.getOrSet(
    CACHE_KEYS.MESH_ACTIVE,
    async () => {
      const now = new Date();
      return prisma.meshType.findMany({
        where: {
          active: true,
          OR: [
            { validFrom: null },
            { validFrom: { lte: now } },
          ],
          AND: {
            OR: [
              { validUntil: null },
              { validUntil: { gt: now } },
            ],
          },
        },
        orderBy: [
          { priority: 'asc' },
          { height: 'asc' },
        ],
      });
    },
    CACHE_TTL.REFERENCE_DATA
  );
}

export async function calculateMesh(
  fenceLengthM: number,
  fenceHeightM: number,
  cellSize: number,
  wireThickness: number,
  coating: MeshCoatingType
): Promise<MeshCalculationResult> {
  const fenceHeightMm = Math.round(fenceHeightM * 1000);
  const coatingValue = MESH_COATING_MAPPING[coating];

  const allMesh = await getActiveMesh();

  const matchingMesh = allMesh.filter(
    m => m.height >= fenceHeightMm
      && m.cellSize === cellSize
      && m.wireThickness === wireThickness
      && m.coating === coatingValue
  );

  if (matchingMesh.length === 0) {
    const error: MeshCalculationError = {
      error: 'NO_MESH_FOUND',
      message: 'Не найдена сетка-рабица с указанными параметрами',
      details: {
        requiredHeight: fenceHeightMm,
        cellSize,
        wireThickness,
        coating: coatingValue,
        suggestion: 'Попробуйте выбрать другие параметры или свяжитесь с нами',
      },
    };
    throw error;
  }

  const selectedMesh = matchingMesh[0];
  const quantity = Math.ceil(fenceLengthM);
  const pricePerUnit = selectedMesh.retailPricePerUnit;
  const totalPrice = quantity * pricePerUnit;

  return {
    category: 'mesh',
    nomenclatureId: selectedMesh.id,
    nomenclatureName: selectedMesh.name,
    quantity,
    unit: 'м.п.',
    pricePerUnit,
    totalPrice,
    height: selectedMesh.height,
    cellSize: selectedMesh.cellSize,
    wireThickness: selectedMesh.wireThickness,
    coating: selectedMesh.coating,
  };
}

export async function getMeshOptions(fenceHeightM?: number) {
  const allMesh = await getActiveMesh();

  const filtered = fenceHeightM
    ? allMesh.filter(m => m.height >= Math.round(fenceHeightM * 1000))
    : allMesh;

  const coatings = [...new Set(filtered.map(m => m.coating))].sort();
  const cellSizes = [...new Set(filtered.map(m => m.cellSize))].sort((a, b) => a - b);
  const wireThicknesses = [...new Set(filtered.map(m => m.wireThickness))].sort((a, b) => a - b);

  const coatingEnumMap: Record<string, string> = {};
  for (const c of coatings) {
    const key = Object.entries(MESH_COATING_MAPPING).find(([, v]) => v === c)?.[0];
    if (key) coatingEnumMap[key] = c;
  }

  return { coatings: coatingEnumMap, cellSizes, wireThicknesses };
}
