import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { picketTypeService } from '@/services/admin/picketTypeService';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    picketType: {
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

describe('PicketTypeService', () => {
  const mockUserId = 'user-1';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return pickets with pagination', async () => {
      const { prisma } = require('@/lib/prisma');
      const mockPickets = [{
        id: 'pkt-1',
        name: 'Штакетник Сланец',
        purchasePricePerUnit: 100,
        retailPricePerUnit: 150,
      }];
      prisma.picketType.findMany.mockResolvedValue(mockPickets);
      prisma.picketType.count.mockResolvedValue(1);

      const result = await picketTypeService.getAll({ page: 1, pageSize: 20 });

      expect(result.pickets).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.pickets[0]).toHaveProperty('purchasePricePerUnit');
      expect(result.pickets[0]).toHaveProperty('retailPricePerUnit');
    });

    it('should filter by coating', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.picketType.findMany.mockResolvedValue([]);
      prisma.picketType.count.mockResolvedValue(0);

      await picketTypeService.getAll({ coating: 'Полимер' });

      expect(prisma.picketType.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            picketCoatingType: { name: { equals: 'Полимер', mode: 'insensitive' } },
          }),
        })
      );
    });

    it('should filter by search across multiple fields', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.picketType.findMany.mockResolvedValue([]);
      prisma.picketType.count.mockResolvedValue(0);

      await picketTypeService.getAll({ search: 'сланец' });

      expect(prisma.picketType.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { name: { contains: 'сланец', mode: 'insensitive' } },
              { color: { contains: 'сланец', mode: 'insensitive' } },
            ]),
          }),
        })
      );
    });

    it('should apply custom sorting', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.picketType.findMany.mockResolvedValue([]);
      prisma.picketType.count.mockResolvedValue(0);

      await picketTypeService.getAll({ sortBy: 'name', sortOrder: 'desc' });

      expect(prisma.picketType.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { name: 'desc' },
        })
      );
    });

    it('should default sort by priority ascending', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.picketType.findMany.mockResolvedValue([]);
      prisma.picketType.count.mockResolvedValue(0);

      await picketTypeService.getAll({});

      expect(prisma.picketType.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { priority: 'asc' },
        })
      );
    });

    it('should filter by validityFilter "expired"', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.picketType.findMany.mockResolvedValue([]);
      prisma.picketType.count.mockResolvedValue(0);

      await picketTypeService.getAll({ validityFilter: 'expired' });

      expect(prisma.picketType.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            validUntil: { lt: expect.any(Date) },
          }),
        })
      );
    });
  });

  describe('getById', () => {
    it('should return picket with prices', async () => {
      const { prisma } = require('@/lib/prisma');
      const mockPicket = { id: 'pkt-1', name: 'Штакетник', purchasePricePerUnit: 100, retailPricePerUnit: 150 };
      prisma.picketType.findUnique.mockResolvedValue(mockPicket);

      const result = await picketTypeService.getById('pkt-1');

      expect(result).toEqual(expect.objectContaining({
        id: 'pkt-1',
        purchasePricePerUnit: 100,
        retailPricePerUnit: 150,
      }));
    });

    it('should return null for non-existent id', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.picketType.findUnique.mockResolvedValue(null);

      const result = await picketTypeService.getById('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should throw error if existing picket with same unique fields', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.picketType.findFirst.mockResolvedValue({ id: 'pkt-existing' });

      const data = {
        name: 'Штакетник',
        metalThickness: 1.5,
        coatingId: 'coat-1',
        color: 'Сланец',
        description: '',
        width: 100,
        length: 2000,
        profileTypeId: 'prof-1',
        purchasePricePerUnit: 100,
        retailPricePerUnit: 150,
        active: true,
      };

      await expect(
        picketTypeService.create(data as any, mockUserId)
      ).rejects.toThrow('Номенклатура с такими параметрами уже существует');
    });

    it('should create picket when no duplicate exists', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.picketType.findFirst.mockResolvedValue(null);
      prisma.picketType.findMany.mockResolvedValue([]);
      const created = { id: 'pkt-1', name: 'Штакетник', priority: 1 };
      prisma.picketType.create.mockResolvedValue(created);
      prisma.referenceChangeLog.create.mockResolvedValue({});

      const data = {
        name: 'Штакетник',
        metalThickness: 1.5,
        coatingId: 'coat-1',
        color: 'Сланец',
        description: '',
        width: 100,
        length: 2000,
        profileTypeId: 'prof-1',
        purchasePricePerUnit: 100,
        retailPricePerUnit: 150,
        active: true,
      };

      const result = await picketTypeService.create(data as any, mockUserId);

      expect(result).toEqual(created);
      expect(prisma.picketType.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ priority: 1 }),
      });
    });
  });

  describe('update', () => {
    it('should throw error if unique fields match existing', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.picketType.findUnique.mockResolvedValue({ id: 'pkt-1', name: 'Old', metalThickness: 1.5, coatingId: 'coat-1', color: 'Red' });
      prisma.picketType.findFirst.mockResolvedValue({ id: 'pkt-2' });

      await expect(
        picketTypeService.update('pkt-1', { name: 'New' } as any, mockUserId)
      ).rejects.toThrow('Номенклатура с такими параметрами уже существует');
    });

    it('should update picket when no conflict', async () => {
      const { prisma } = require('@/lib/prisma');
      const oldItem = { id: 'pkt-1', name: 'Old', metalThickness: 1.5, coatingId: 'coat-1', color: 'Red' };
      const newItem = { id: 'pkt-1', name: 'Old', metalThickness: 1.5, coatingId: 'coat-1', color: 'Red', retailPricePerUnit: 200 };
      prisma.picketType.findUnique.mockResolvedValue(oldItem);
      prisma.picketType.update.mockResolvedValue(newItem);
      prisma.referenceChangeLog.create.mockResolvedValue({});

      const result = await picketTypeService.update('pkt-1', { retailPricePerUnit: 200 } as any, mockUserId);

      expect(result).toEqual(newItem);
    });

    it('should throw error for non-existent picket', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.picketType.findUnique.mockResolvedValue(null);

      await expect(
        picketTypeService.update('nonexistent', {} as any, mockUserId)
      ).rejects.toThrow('Номенклатура не найдена');
    });
  });

  describe('delete', () => {
    it('should delete picket and clean up', async () => {
      const { prisma } = require('@/lib/prisma');
      const { mountingHardwareService } = require('@/services/admin/mountingHardwareService');
      const oldItem = { id: 'pkt-1', name: 'Штакетник', priority: 1 };
      prisma.picketType.findUnique.mockResolvedValue(oldItem);
      prisma.picketType.delete.mockResolvedValue(oldItem);
      prisma.referenceChangeLog.create.mockResolvedValue({});

      await picketTypeService.delete('pkt-1', mockUserId);

      expect(mountingHardwareService.deleteRelationsForReference).toHaveBeenCalledWith('PICKET', 'pkt-1');
      expect(prisma.picketType.delete).toHaveBeenCalledWith({ where: { id: 'pkt-1' } });
    });

    it('should throw error for non-existent picket', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.picketType.findUnique.mockResolvedValue(null);

      await expect(
        picketTypeService.delete('nonexistent', mockUserId)
      ).rejects.toThrow('Номенклатура не найдена');
    });
  });

  describe('toggleActive', () => {
    it('should toggle active status', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.picketType.findUnique.mockResolvedValue({ id: 'pkt-1', active: true });
      prisma.picketType.update.mockResolvedValue({ id: 'pkt-1', active: false });
      prisma.referenceChangeLog.create.mockResolvedValue({});

      const result = await picketTypeService.toggleActive('pkt-1', mockUserId);
      expect(result.active).toBe(false);
    });

    it('should throw error for non-existent picket', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.picketType.findUnique.mockResolvedValue(null);

      await expect(
        picketTypeService.toggleActive('nonexistent', mockUserId)
      ).rejects.toThrow('Номенклатура не найдена');
    });
  });

  describe('deactivateExpired', () => {
    it('should deactivate expired pickets', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.picketType.updateMany.mockResolvedValue({ count: 2 });

      const count = await picketTypeService.deactivateExpired();
      expect(count).toBe(2);
      expect(prisma.picketType.updateMany).toHaveBeenCalledWith({
        where: { validUntil: { lt: expect.any(Date) }, active: true },
        data: { active: false },
      });
    });
  });
});
