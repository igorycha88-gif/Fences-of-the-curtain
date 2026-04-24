import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { lagTypeService, checkPeriodOverlap } from '@/services/admin/lagTypeService';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    lagType: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    referenceChangeLog: {
      create: jest.fn(),
    },
  },
}));

jest.mock('@/services/admin/priorityService', () => ({
  priorityService: {
    recalculateAfterDelete: jest.fn(),
  },
}));

jest.mock('@/services/admin/mountingHardwareService', () => ({
  mountingHardwareService: {
    deleteRelationsForReference: jest.fn(),
  },
}));

jest.mock('@/lib/audit-helpers', () => ({
  logPriceChange: jest.fn(),
}));

describe('checkPeriodOverlap', () => {
  it('should detect overlapping periods', () => {
    const result = checkPeriodOverlap(
      new Date('2026-01-01'),
      new Date('2026-06-01'),
      new Date('2026-03-01'),
      new Date('2026-09-01')
    );
    expect(result).toBe(true);
  });

  it('should return false for non-overlapping periods', () => {
    const result = checkPeriodOverlap(
      new Date('2026-01-01'),
      new Date('2026-03-01'),
      new Date('2026-04-01'),
      new Date('2026-09-01')
    );
    expect(result).toBe(false);
  });

  it('should treat null dates as unbounded', () => {
    const result = checkPeriodOverlap(null, null, null, null);
    expect(result).toBe(true);
  });

  it('should treat null start as far past', () => {
    const result = checkPeriodOverlap(
      null,
      new Date('2026-01-01'),
      new Date('2020-01-01'),
      new Date('2025-01-01')
    );
    expect(result).toBe(true);
  });

  it('should treat null end as far future', () => {
    const result = checkPeriodOverlap(
      new Date('2026-01-01'),
      null,
      new Date('2026-06-01'),
      null
    );
    expect(result).toBe(true);
  });

  it('should return false when new period ends exactly where existing starts', () => {
    const result = checkPeriodOverlap(
      new Date('2026-01-01'),
      new Date('2026-03-01'),
      new Date('2026-03-01'),
      new Date('2026-06-01')
    );
    expect(result).toBe(false);
  });
});

describe('LagTypeService', () => {
  const mockUserId = 'user-1';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return lags with pagination', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.lagType.findMany.mockResolvedValue([{ id: 'lag-1', name: 'Лага 40x40' }]);
      prisma.lagType.count.mockResolvedValue(1);

      const result = await lagTypeService.getAll({ page: 1, pageSize: 20 });

      expect(result.lags).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should filter by thickness range', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.lagType.findMany.mockResolvedValue([]);
      prisma.lagType.count.mockResolvedValue(0);

      await lagTypeService.getAll({ minThickness: 1.5, maxThickness: 3.0 });

      expect(prisma.lagType.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            metalThickness: { gte: 1.5, lte: 3.0 },
          }),
        })
      );
    });

    it('should filter by validityFilter "expired"', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.lagType.findMany.mockResolvedValue([]);
      prisma.lagType.count.mockResolvedValue(0);

      await lagTypeService.getAll({ validityFilter: 'expired' });

      expect(prisma.lagType.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            expirationDate: { lt: expect.any(Date) },
          }),
        })
      );
    });
  });

  describe('getById', () => {
    it('should return lag by id', async () => {
      const { prisma } = require('@/lib/prisma');
      const mockLag = { id: 'lag-1', name: 'Лага 40x40' };
      prisma.lagType.findUnique.mockResolvedValue(mockLag);

      const result = await lagTypeService.getById('lag-1');
      expect(result).toEqual(mockLag);
    });
  });

  describe('findDuplicates', () => {
    it('should find lags with matching dimensions', async () => {
      const { prisma } = require('@/lib/prisma');
      const dups = [{ id: 'lag-1', name: 'Лага', retailPricePerUnit: 500, validFrom: null, expirationDate: null, active: true }];
      prisma.lagType.findMany.mockResolvedValue(dups);

      const result = await lagTypeService.findDuplicates({
        width: 40,
        height: 40,
        metalThickness: 2,
        length: 3000,
      });

      expect(result).toEqual(dups);
      expect(prisma.lagType.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          width: 40,
          height: 40,
          metalThickness: 2,
          length: 3000,
        }),
        select: expect.any(Object),
      });
    });

    it('should exclude specified id', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.lagType.findMany.mockResolvedValue([]);

      await lagTypeService.findDuplicates({
        width: 40,
        height: 40,
        metalThickness: 2,
        length: 3000,
        excludeId: 'lag-1',
      });

      expect(prisma.lagType.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: { not: 'lag-1' } }),
        })
      );
    });
  });

  describe('create', () => {
    it('should return warning when duplicates exist with overlapping periods', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.lagType.findMany.mockResolvedValue([
        { id: 'lag-1', name: 'Лага', retailPricePerUnit: 400, validFrom: null, expirationDate: null, active: true },
      ]);

      const data = {
        name: 'Новая лага',
        width: 40,
        height: 40,
        metalThickness: 2,
        length: 3000,
        retailPricePerUnit: 500,
        validFrom: null,
        expirationDate: null,
      };

      const result = await lagTypeService.create(data as any, mockUserId);

      expect(result as any).toHaveProperty('warning');
      expect((result as any).warning.type).toBe('duplicate_params');
      expect(result as any).toHaveProperty('canProceed', true);
    });

    it('should throw when duplicate has same price', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.lagType.findMany.mockResolvedValue([
        { id: 'lag-1', name: 'Лага', retailPricePerUnit: 500, validFrom: null, expirationDate: null, active: true },
      ]);

      const data = {
        name: 'Новая лага',
        width: 40,
        height: 40,
        metalThickness: 2,
        length: 3000,
        retailPricePerUnit: 500,
        validFrom: null,
        expirationDate: null,
      };

      await expect(
        lagTypeService.create(data as any, mockUserId)
      ).rejects.toThrow('Розничная цена должна отличаться');
    });

    it('should create lag when confirmDuplicate is true', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.lagType.findMany
        .mockResolvedValueOnce([{ id: 'lag-1', name: 'Лага', retailPricePerUnit: 400, validFrom: null, expirationDate: null, active: true }])
        .mockResolvedValueOnce([{ id: 'lag-1', priority: 1 }]);
      prisma.lagType.findUnique.mockResolvedValue({ id: 'lag-1' });
      prisma.lagType.update.mockResolvedValue({ id: 'lag-1' });
      const created = { id: 'lag-2', name: 'Новая', priority: 2 };
      prisma.lagType.create.mockResolvedValue(created);
      prisma.referenceChangeLog.create.mockResolvedValue({});

      const data = {
        name: 'Новая лага',
        width: 40,
        height: 40,
        metalThickness: 2,
        length: 3000,
        retailPricePerUnit: 500,
        validFrom: new Date('2026-06-01'),
        expirationDate: null,
        confirmDuplicate: true,
        updateExistingExpiration: 'lag-1',
      };

      const result = await lagTypeService.create(data as any, mockUserId);

      expect(result).toEqual(created);
      expect(prisma.lagType.update).toHaveBeenCalled();
    });

    it('should create lag when no duplicates exist', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.lagType.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      const created = { id: 'lag-1', name: 'Лага', priority: 1 };
      prisma.lagType.create.mockResolvedValue(created);
      prisma.referenceChangeLog.create.mockResolvedValue({});

      const data = {
        name: 'Лага',
        width: 40,
        height: 40,
        metalThickness: 2,
        length: 3000,
        retailPricePerUnit: 500,
      };

      const result = await lagTypeService.create(data as any, mockUserId);

      expect(result).toEqual(created);
    });
  });

  describe('update', () => {
    it('should update lag and log changes', async () => {
      const { prisma } = require('@/lib/prisma');
      const oldLag = { id: 'lag-1', name: 'Old', retailPricePerUnit: 400 };
      const newLag = { id: 'lag-1', name: 'New', retailPricePerUnit: 500 };
      prisma.lagType.findUnique.mockResolvedValue(oldLag);
      prisma.lagType.update.mockResolvedValue(newLag);
      prisma.referenceChangeLog.create.mockResolvedValue({});

      const result = await lagTypeService.update('lag-1', { name: 'New', retailPricePerUnit: 500 } as any, mockUserId);

      expect(result).toEqual(newLag);
    });

    it('should throw error for non-existent lag', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.lagType.findUnique.mockResolvedValue(null);

      await expect(
        lagTypeService.update('nonexistent', {} as any, mockUserId)
      ).rejects.toThrow('Лага не найдена');
    });

    it('should throw error for duplicate name', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.lagType.findUnique.mockResolvedValue({ id: 'lag-1', name: 'Old' });
      prisma.lagType.findFirst.mockResolvedValue({ id: 'lag-2', name: 'Existing' });

      await expect(
        lagTypeService.update('lag-1', { name: 'Existing' } as any, mockUserId)
      ).rejects.toThrow('Лага с таким названием уже существует');
    });
  });

  describe('delete', () => {
    it('should delete lag and clean up', async () => {
      const { prisma } = require('@/lib/prisma');
      const { mountingHardwareService } = require('@/services/admin/mountingHardwareService');
      const oldLag = { id: 'lag-1', name: 'Лага', priority: 1 };
      prisma.lagType.findUnique.mockResolvedValue(oldLag);
      prisma.lagType.delete.mockResolvedValue(oldLag);
      prisma.referenceChangeLog.create.mockResolvedValue({});

      await lagTypeService.delete('lag-1', mockUserId);

      expect(mountingHardwareService.deleteRelationsForReference).toHaveBeenCalledWith('LAG', 'lag-1');
      expect(prisma.lagType.delete).toHaveBeenCalledWith({ where: { id: 'lag-1' } });
    });

    it('should throw error for non-existent lag', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.lagType.findUnique.mockResolvedValue(null);

      await expect(
        lagTypeService.delete('nonexistent', mockUserId)
      ).rejects.toThrow('Лага не найдена');
    });
  });

  describe('toggleActive', () => {
    it('should toggle active status', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.lagType.findUnique.mockResolvedValue({ id: 'lag-1', active: true });
      prisma.lagType.update.mockResolvedValue({ id: 'lag-1', active: false });
      prisma.referenceChangeLog.create.mockResolvedValue({});

      const result = await lagTypeService.toggleActive('lag-1', mockUserId);

      expect(result.active).toBe(false);
    });
  });

  describe('deactivateExpired', () => {
    it('should deactivate expired lags and return count', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.lagType.updateMany.mockResolvedValue({ count: 2 });

      const count = await lagTypeService.deactivateExpired();

      expect(count).toBe(2);
      expect(prisma.lagType.updateMany).toHaveBeenCalledWith({
        where: { expirationDate: { lt: expect.any(Date) }, active: true },
        data: { active: false },
      });
    });
  });
});
