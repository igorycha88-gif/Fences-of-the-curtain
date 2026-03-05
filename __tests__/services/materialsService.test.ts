import { materialsService } from '@/services/admin/materialsService';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    fenceMaterial: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    canopyMaterial: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    fenceType: {
      findMany: jest.fn(),
    },
    canopyType: {
      findMany: jest.fn(),
    },
  },
}));

describe('MaterialsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getFenceMaterials', () => {
    it('should return materials with pagination', async () => {
      const mockMaterials = [
        { id: '1', name: 'Профнастил', category: 'PROFNASTIL', basePrice: 500, active: true },
      ];
      const { prisma } = require('@/lib/prisma');
      prisma.fenceMaterial.findMany.mockResolvedValue(mockMaterials);
      prisma.fenceMaterial.count.mockResolvedValue(1);

      const result = await materialsService.getFenceMaterials({ page: 1, pageSize: 20 });

      expect(result.materials).toEqual(mockMaterials);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);
    });

    it('should filter by category', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.fenceMaterial.findMany.mockResolvedValue([]);
      prisma.fenceMaterial.count.mockResolvedValue(0);

      await materialsService.getFenceMaterials({ category: 'PROFNASTIL' });

      expect(prisma.fenceMaterial.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            category: 'PROFNASTIL',
          }),
        })
      );
    });
  });
});

describe('getCanopyMaterials', () => {
  it('should return canopy materials with pagination', async () => {
    const mockMaterials = [
      { id: '1', name: 'Поликарбонат', category: 'POLYCARBONATE', basePrice: 600, active: true },
    ];
    const { prisma } = require('@/lib/prisma');
    prisma.canopyMaterial.findMany.mockResolvedValue(mockMaterials);
    prisma.canopyMaterial.count.mockResolvedValue(1);

    const result = await materialsService.getCanopyMaterials({ page: 1, pageSize: 20 });

    expect(result.materials).toEqual(mockMaterials);
    expect(result.total).toBe(1);
  });
});
