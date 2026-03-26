import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { profnastilTypeService } from '@/services/admin/profnastilTypeService';
import { prisma } from '@/lib/prisma';
import { ProfnastilTypeInput, ProfnastilTypeUpdate } from '@/lib/validators/profnastilType';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    profnastilType: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    referenceChangeLog: {
      create: jest.fn(),
    },
  },
}));

describe('ProfnastilTypeService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create method', () => {
    it('should calculate purchasePricePerUnit from pricePerMeter and length', async () => {
      const mockData: ProfnastilTypeInput = {
        name: 'Тестовый профнастил',
        metalThickness: 0.5,
        fullWidth: 1200,
        usefulWidth: 1150,
        length: 2000,
        coating: 'Полимерное (одностороннее)',
        purchasePricePerLinearMeter: 350,
        retailPricePerUnit: 1200,
        active: true,
        sortOrder: 0,
      };

      (prisma.profnastilType.findFirst as any).mockResolvedValue(null);
      (prisma.profnastilType.findMany as any).mockResolvedValue([]);
      (prisma.profnastilType.create as any).mockResolvedValue({
        id: 'test-id',
        ...mockData,
        purchasePricePerUnit: 700,
        priority: 1,
      });
      (prisma.referenceChangeLog.create as any).mockResolvedValue({});

      const result = await profnastilTypeService.create(mockData, 'user-id');

      expect(result.purchasePricePerUnit).toBe(700);
    });

    it('should calculate with rounding to 2 decimal places', async () => {
      const mockData: ProfnastilTypeInput = {
        name: 'Тестовый профнастил 2',
        metalThickness: 0.5,
        fullWidth: 1200,
        usefulWidth: 1150,
        length: 3000,
        coating: 'Полимерное (одностороннее)',
        purchasePricePerLinearMeter: 333.33,
        retailPricePerUnit: 1500,
        active: true,
        sortOrder: 0,
      };

      (prisma.profnastilType.findFirst as any).mockResolvedValue(null);
      (prisma.profnastilType.findMany as any).mockResolvedValue([]);
      (prisma.profnastilType.create as any).mockResolvedValue({
        id: 'test-id',
        ...mockData,
        purchasePricePerUnit: 999.99,
        priority: 1,
      });
      (prisma.referenceChangeLog.create as any).mockResolvedValue({});

      const result = await profnastilTypeService.create(mockData, 'user-id');

      expect(result.purchasePricePerUnit).toBe(999.99);
    });

    it('should return null for purchasePricePerUnit when pricePerMeter is null', async () => {
      const mockData: ProfnastilTypeInput = {
        name: 'Тестовый профнастил 3',
        metalThickness: 0.5,
        fullWidth: 1200,
        usefulWidth: 1150,
        length: 2000,
        coating: 'Полимерное (одностороннее)',
        purchasePricePerLinearMeter: null,
        retailPricePerUnit: 1200,
        active: true,
        sortOrder: 0,
      };

      (prisma.profnastilType.findFirst as any).mockResolvedValue(null);
      (prisma.profnastilType.findMany as any).mockResolvedValue([]);
      (prisma.profnastilType.create as any).mockResolvedValue({
        id: 'test-id',
        ...mockData,
        purchasePricePerUnit: null,
        priority: 1,
      });
      (prisma.referenceChangeLog.create as any).mockResolvedValue({});

      const result = await profnastilTypeService.create(mockData, 'user-id');

      expect(result.purchasePricePerUnit).toBeNull();
    });
  });

  describe('update method', () => {
    it('should recalculate purchasePricePerUnit when updating', async () => {
      const existingItem = {
        id: 'test-id',
        name: 'Тестовый профнастил',
        metalThickness: 0.5,
        fullWidth: 1200,
        usefulWidth: 1150,
        length: 2000,
        coating: 'Полимерное (одностороннее)',
        purchasePricePerLinearMeter: 350,
        purchasePricePerUnit: 700,
        retailPricePerUnit: 1200,
        active: true,
        priority: 1,
      };

      const updateData = {
        length: 2500,
        purchasePricePerLinearMeter: 380,
      };

      (prisma.profnastilType.findUnique as any).mockResolvedValue(existingItem);
      (prisma.profnastilType.update as any).mockResolvedValue({
        ...existingItem,
        ...updateData,
        purchasePricePerUnit: 950,
      });
      (prisma.referenceChangeLog.create as any).mockResolvedValue({});

      const result = await profnastilTypeService.update('test-id', updateData, 'user-id');

      expect(result.purchasePricePerUnit).toBe(950);
    });

    it('should recalculate when only pricePerMeter changes', async () => {
      const existingItem = {
        id: 'test-id',
        name: 'Тестовый профнастил',
        metalThickness: 0.5,
        fullWidth: 1200,
        usefulWidth: 1150,
        length: 2000,
        coating: 'Полимерное (одностороннее)',
        purchasePricePerLinearMeter: 350,
        purchasePricePerUnit: 700,
        retailPricePerUnit: 1200,
        active: true,
        priority: 1,
      };

      const updateData = {
        purchasePricePerLinearMeter: 400,
      };

      (prisma.profnastilType.findUnique as any).mockResolvedValue(existingItem);
      (prisma.profnastilType.update as any).mockResolvedValue({
        ...existingItem,
        ...updateData,
        purchasePricePerUnit: 800,
      });
      (prisma.referenceChangeLog.create as any).mockResolvedValue({});

      const result = await profnastilTypeService.update('test-id', updateData, 'user-id');

      expect(result.purchasePricePerUnit).toBe(800);
    });

    it('should recalculate when only length changes', async () => {
      const existingItem = {
        id: 'test-id',
        name: 'Тестовый профнастил',
        metalThickness: 0.5,
        fullWidth: 1200,
        usefulWidth: 1150,
        length: 2000,
        coating: 'Полимерное (одностороннее)',
        purchasePricePerLinearMeter: 350,
        purchasePricePerUnit: 700,
        retailPricePerUnit: 1200,
        active: true,
        priority: 1,
      };

      const updateData = {
        length: 6000,
      };

      (prisma.profnastilType.findUnique as any).mockResolvedValue(existingItem);
      (prisma.profnastilType.update as any).mockResolvedValue({
        ...existingItem,
        ...updateData,
        purchasePricePerUnit: 2100,
      });
      (prisma.referenceChangeLog.create as any).mockResolvedValue({});

      const result = await profnastilTypeService.update('test-id', updateData, 'user-id');

      expect(result.purchasePricePerUnit).toBe(2100);
    });
  });
});
