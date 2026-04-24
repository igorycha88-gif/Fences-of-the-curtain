import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { wicketTypeService } from '@/services/admin/wicketTypeService';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    wicketType: {
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

describe('WicketTypeService', () => {
  const mockUserId = 'user-1';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return wickets with pagination', async () => {
      const { prisma } = require('@/lib/prisma');
      const mockWickets = [{ id: 'wt-1', name: 'Калитка 1м', priority: 1 }];
      prisma.wicketType.findMany.mockResolvedValue(mockWickets);
      prisma.wicketType.count.mockResolvedValue(1);

      const result = await wicketTypeService.getAll({ page: 1, pageSize: 20 });

      expect(result.wickets).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
    });

    it('should filter by active status', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.wicketType.findMany.mockResolvedValue([]);
      prisma.wicketType.count.mockResolvedValue(0);

      await wicketTypeService.getAll({ active: true });

      expect(prisma.wicketType.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ active: true }),
        })
      );
    });

    it('should filter by search', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.wicketType.findMany.mockResolvedValue([]);
      prisma.wicketType.count.mockResolvedValue(0);

      await wicketTypeService.getAll({ search: 'калитка' });

      expect(prisma.wicketType.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { name: { contains: 'калитка', mode: 'insensitive' } },
              { description: { contains: 'калитка', mode: 'insensitive' } },
            ],
          }),
        })
      );
    });

    it('should filter by validityFilter "expired"', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.wicketType.findMany.mockResolvedValue([]);
      prisma.wicketType.count.mockResolvedValue(0);

      await wicketTypeService.getAll({ validityFilter: 'expired' });

      expect(prisma.wicketType.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            expirationDate: { lt: expect.any(Date) },
          }),
        })
      );
    });

    it('should filter by validityFilter "expiring_soon"', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.wicketType.findMany.mockResolvedValue([]);
      prisma.wicketType.count.mockResolvedValue(0);

      await wicketTypeService.getAll({ validityFilter: 'expiring_soon' });

      expect(prisma.wicketType.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            expirationDate: {
              gt: expect.any(Date),
              lte: expect.any(Date),
            },
          }),
        })
      );
    });
  });

  describe('create', () => {
    it('should create wicket with next priority and log', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.wicketType.findMany.mockResolvedValue([]);
      const mockCreated = { id: 'wt-1', name: 'Калитка', priority: 1 };
      prisma.wicketType.create.mockResolvedValue(mockCreated);
      prisma.referenceChangeLog.create.mockResolvedValue({});

      const data = {
        name: 'Калитка',
        description: 'desc',
        metalThickness: 2,
        sectionWidth: 1000,
        sectionHeight: 2000,
        wicketHeight: 2000,
        wicketLength: 1000,
        retailPrice: 25000,
        purchasePrice: 18000,
        image: null,
        active: true,
        validFrom: null,
        expirationDate: null,
      };

      const result = await wicketTypeService.create(data as any, mockUserId);

      expect(result).toEqual(mockCreated);
      expect(prisma.wicketType.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ priority: 1 }),
      });
      expect(prisma.referenceChangeLog.create).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update wicket and log changes', async () => {
      const { prisma } = require('@/lib/prisma');
      const oldWicket = { id: 'wt-1', name: 'Old' };
      const newWicket = { id: 'wt-1', name: 'New' };
      prisma.wicketType.findUnique.mockResolvedValue(oldWicket);
      prisma.wicketType.update.mockResolvedValue(newWicket);
      prisma.referenceChangeLog.create.mockResolvedValue({});

      const result = await wicketTypeService.update('wt-1', { name: 'New' } as any, mockUserId);

      expect(result).toEqual(newWicket);
    });

    it('should throw error for non-existent wicket', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.wicketType.findUnique.mockResolvedValue(null);

      await expect(
        wicketTypeService.update('nonexistent', {} as any, mockUserId)
      ).rejects.toThrow('Калитка не найдена');
    });

    it('should throw error for duplicate name', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.wicketType.findUnique.mockResolvedValue({ id: 'wt-1', name: 'Old' });
      prisma.wicketType.findFirst.mockResolvedValue({ id: 'wt-2', name: 'Existing' });

      await expect(
        wicketTypeService.update('wt-1', { name: 'Existing' } as any, mockUserId)
      ).rejects.toThrow('Калитка с таким названием уже существует');
    });
  });

  describe('delete', () => {
    it('should delete wicket and clean up relations', async () => {
      const { prisma } = require('@/lib/prisma');
      const { mountingHardwareService } = require('@/services/admin/mountingHardwareService');
      const oldWicket = { id: 'wt-1', name: 'Калитка', priority: 1 };
      prisma.wicketType.findUnique.mockResolvedValue(oldWicket);
      prisma.wicketType.delete.mockResolvedValue(oldWicket);
      prisma.referenceChangeLog.create.mockResolvedValue({});

      await wicketTypeService.delete('wt-1', mockUserId);

      expect(mountingHardwareService.deleteRelationsForReference).toHaveBeenCalledWith('WICKET', 'wt-1');
      expect(prisma.wicketType.delete).toHaveBeenCalledWith({ where: { id: 'wt-1' } });
    });

    it('should throw error for non-existent wicket', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.wicketType.findUnique.mockResolvedValue(null);

      await expect(
        wicketTypeService.delete('nonexistent', mockUserId)
      ).rejects.toThrow('Калитка не найдена');
    });
  });

  describe('toggleActive', () => {
    it('should toggle active status', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.wicketType.findUnique.mockResolvedValue({ id: 'wt-1', active: false });
      prisma.wicketType.update.mockResolvedValue({ id: 'wt-1', active: true });
      prisma.referenceChangeLog.create.mockResolvedValue({});

      const result = await wicketTypeService.toggleActive('wt-1', mockUserId);

      expect(result.active).toBe(true);
    });

    it('should throw error for non-existent wicket', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.wicketType.findUnique.mockResolvedValue(null);

      await expect(
        wicketTypeService.toggleActive('nonexistent', mockUserId)
      ).rejects.toThrow('Калитка не найдена');
    });
  });

  describe('deactivateExpired', () => {
    it('should deactivate expired wickets and return count', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.wicketType.updateMany.mockResolvedValue({ count: 5 });

      const count = await wicketTypeService.deactivateExpired();

      expect(count).toBe(5);
      expect(prisma.wicketType.updateMany).toHaveBeenCalledWith({
        where: { expirationDate: { lt: expect.any(Date) }, active: true },
        data: { active: false },
      });
    });
  });
});
