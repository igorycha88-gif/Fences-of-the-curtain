import { calculateMesh, getMeshOptions } from '@/services/calculator/meshCalculator';

jest.mock('@/lib/cache', () => ({
  cache: {
    getOrSet: jest.fn((_key: string, fn: () => Promise<unknown>) => fn()),
    del: jest.fn(),
    delPattern: jest.fn(),
  },
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    meshType: {
      findMany: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';

const mockMeshTypes = [
  {
    id: 'mesh-1',
    name: 'Сетка 1.5м яч.50 прут 2.0 оцинк',
    description: null,
    height: 1500,
    cellSize: 50,
    wireThickness: 2.0,
    coating: 'Оцинковка',
    retailPricePerUnit: 250,
    purchasePricePerUnit: 180,
    image: null,
    active: true,
    validFrom: null,
    validUntil: null,
    priority: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'mesh-2',
    name: 'Сетка 2.0м яч.50 прут 2.5 полимер',
    description: null,
    height: 2000,
    cellSize: 50,
    wireThickness: 2.5,
    coating: 'Полимерное',
    retailPricePerUnit: 350,
    purchasePricePerUnit: 250,
    image: null,
    active: true,
    validFrom: null,
    validUntil: null,
    priority: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'mesh-3',
    name: 'Сетка 1.5м яч.60 прут 2.0 оцинк',
    description: null,
    height: 1500,
    cellSize: 60,
    wireThickness: 2.0,
    coating: 'Оцинковка',
    retailPricePerUnit: 230,
    purchasePricePerUnit: 160,
    image: null,
    active: true,
    validFrom: null,
    validUntil: null,
    priority: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

describe('meshCalculator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateMesh', () => {
    it('should select mesh matching height, cellSize, wireThickness, coating', async () => {
      (prisma.meshType.findMany as jest.Mock).mockResolvedValue(mockMeshTypes);

      const result = await calculateMesh(30, 1.5, 50, 2.0, 'GALVANIZED');

      expect(result).toEqual({
        category: 'mesh',
        nomenclatureId: 'mesh-1',
        nomenclatureName: 'Сетка 1.5м яч.50 прут 2.0 оцинк',
        quantity: 30,
        unit: 'м.п.',
        pricePerUnit: 250,
        totalPrice: 7500,
        height: 1500,
        cellSize: 50,
        wireThickness: 2.0,
        coating: 'Оцинковка',
      });
    });

    it('should select mesh with higher height when exact match not available', async () => {
      (prisma.meshType.findMany as jest.Mock).mockResolvedValue(mockMeshTypes);

      const result = await calculateMesh(20, 1.8, 50, 2.5, 'POLYMER');

      expect(result.nomenclatureId).toBe('mesh-2');
      expect(result.height).toBe(2000);
    });

    it('should throw NO_MESH_FOUND when no matching mesh', async () => {
      (prisma.meshType.findMany as jest.Mock).mockResolvedValue(mockMeshTypes);

      await expect(
        calculateMesh(20, 3.0, 50, 2.0, 'GALVANIZED')
      ).rejects.toEqual({
        error: 'NO_MESH_FOUND',
        message: 'Не найдена сетка-рабица с указанными параметрами',
        details: {
          requiredHeight: 3000,
          cellSize: 50,
          wireThickness: 2.0,
          coating: 'Оцинковка',
          suggestion: 'Попробуйте выбрать другие параметры или свяжитесь с нами',
        },
      });
    });

    it('should ceil the quantity', async () => {
      (prisma.meshType.findMany as jest.Mock).mockResolvedValue(mockMeshTypes);

      const result = await calculateMesh(15.7, 1.5, 50, 2.0, 'GALVANIZED');

      expect(result.quantity).toBe(16);
    });
  });

  describe('getMeshOptions', () => {
    it('should return unique coatings, cellSizes, wireThicknesses', async () => {
      (prisma.meshType.findMany as jest.Mock).mockResolvedValue(mockMeshTypes);

      const options = await getMeshOptions();

      expect(options.cellSizes).toEqual([50, 60]);
      expect(options.wireThicknesses).toEqual([2.0, 2.5]);
      expect(options.coatings).toHaveProperty('GALVANIZED', 'Оцинковка');
      expect(options.coatings).toHaveProperty('POLYMER', 'Полимерное');
    });

    it('should filter by height when provided', async () => {
      (prisma.meshType.findMany as jest.Mock).mockResolvedValue(mockMeshTypes);

      const options = await getMeshOptions(1.5);

      expect(options.cellSizes).toEqual([50, 60]);
    });
  });
});
