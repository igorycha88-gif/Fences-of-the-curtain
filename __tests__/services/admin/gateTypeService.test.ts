import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { gateTypeService } from '@/services/admin/gateTypeService';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    gateType: {
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

describe('GateTypeService', () => {
  const mockUserId = 'user-1';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return gates with pagination', async () => {
      const { prisma } = require('@/lib/prisma');
      const mockGates = [{ id: 'gt-1', name: 'Ворота распашные 3м', priority: 1 }];
      prisma.gateType.findMany.mockResolvedValue(mockGates);
      prisma.gateType.count.mockResolvedValue(1);

      const result = await gateTypeService.getAll({ page: 1, pageSize: 20 });

      expect(result.gates).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
    });

    it('should filter by type', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.gateType.findMany.mockResolvedValue([]);
      prisma.gateType.count.mockResolvedValue(0);

      await gateTypeService.getAll({ type: 'Распашные' });

      expect(prisma.gateType.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ type: 'Распашные' }),
        })
      );
    });

    it('should not filter by type when type is "all"', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.gateType.findMany.mockResolvedValue([]);
      prisma.gateType.count.mockResolvedValue(0);

      await gateTypeService.getAll({ type: 'all' });

      const where = prisma.gateType.findMany.mock.calls[0][0].where;
      expect(where.type).toBeUndefined();
    });

    it('should filter by search', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.gateType.findMany.mockResolvedValue([]);
      prisma.gateType.count.mockResolvedValue(0);

      await gateTypeService.getAll({ search: 'распашные' });

      expect(prisma.gateType.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { name: { contains: 'распашные', mode: 'insensitive' } },
              { description: { contains: 'распашные', mode: 'insensitive' } },
            ],
          }),
        })
      );
    });

    it('should filter by validityFilter "expired"', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.gateType.findMany.mockResolvedValue([]);
      prisma.gateType.count.mockResolvedValue(0);

      await gateTypeService.getAll({ validityFilter: 'expired' });

      expect(prisma.gateType.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            expirationDate: { lt: expect.any(Date) },
          }),
        })
      );
    });

    it('should filter by validityFilter "active"', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.gateType.findMany.mockResolvedValue([]);
      prisma.gateType.count.mockResolvedValue(0);

      await gateTypeService.getAll({ validityFilter: 'active' });

      expect(prisma.gateType.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ active: true }),
        })
      );
    });
  });

  describe('getById', () => {
    it('should return gate by id', async () => {
      const { prisma } = require('@/lib/prisma');
      const mockGate = { id: 'gt-1', name: 'Ворота' };
      prisma.gateType.findUnique.mockResolvedValue(mockGate);

      const result = await gateTypeService.getById('gt-1');

      expect(result).toEqual(mockGate);
    });

    it('should return null for non-existent id', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.gateType.findUnique.mockResolvedValue(null);

      const result = await gateTypeService.getById('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create gate with next priority and log', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.gateType.findMany.mockResolvedValue([{ id: 'gt-1', priority: 1 }]);
      const mockCreated = { id: 'gt-2', name: 'Ворота', priority: 2 };
      prisma.gateType.create.mockResolvedValue(mockCreated);
      prisma.referenceChangeLog.create.mockResolvedValue({});

      const data = {
        name: 'Ворота',
        description: 'desc',
        type: 'Распашные',
        metalThickness: 2,
        sectionWidth: 3000,
        sectionHeight: 2000,
        gateHeight: 2000,
        gateLength: 3000,
        retailPrice: 50000,
        purchasePrice: 35000,
        image: null,
        active: true,
        validFrom: null,
        expirationDate: null,
      };

      const result = await gateTypeService.create(data as any, mockUserId);

      expect(result).toEqual(mockCreated);
      expect(prisma.gateType.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ priority: 2 }),
      });
      expect(prisma.referenceChangeLog.create).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update gate and log changes', async () => {
      const { prisma } = require('@/lib/prisma');
      const oldGate = { id: 'gt-1', name: 'Old', retailPrice: 50000 };
      const newGate = { id: 'gt-1', name: 'New', retailPrice: 60000 };
      prisma.gateType.findUnique.mockResolvedValue(oldGate);
      prisma.gateType.update.mockResolvedValue(newGate);
      prisma.referenceChangeLog.create.mockResolvedValue({});

      const result = await gateTypeService.update('gt-1', { name: 'New', retailPrice: 60000 } as any, mockUserId);

      expect(result).toEqual(newGate);
    });

    it('should throw error for non-existent gate', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.gateType.findUnique.mockResolvedValue(null);

      await expect(
        gateTypeService.update('nonexistent', {} as any, mockUserId)
      ).rejects.toThrow('Ворота не найдены');
    });

    it('should throw error if name already exists', async () => {
      const { prisma } = require('@/lib/prisma');
      const oldGate = { id: 'gt-1', name: 'Old' };
      prisma.gateType.findUnique.mockResolvedValue(oldGate);
      prisma.gateType.findFirst.mockResolvedValue({ id: 'gt-2', name: 'Existing' });

      await expect(
        gateTypeService.update('gt-1', { name: 'Existing' } as any, mockUserId)
      ).rejects.toThrow('Ворота с таким названием уже существуют');
    });
  });

  describe('delete', () => {
    it('should delete gate, remove mounting hardware relations, and recalculate priority', async () => {
      const { prisma } = require('@/lib/prisma');
      const { mountingHardwareService } = require('@/services/admin/mountingHardwareService');
      const oldGate = { id: 'gt-1', name: 'Ворота', priority: 1 };
      prisma.gateType.findUnique.mockResolvedValue(oldGate);
      prisma.gateType.delete.mockResolvedValue(oldGate);
      prisma.referenceChangeLog.create.mockResolvedValue({});

      await gateTypeService.delete('gt-1', mockUserId);

      expect(mountingHardwareService.deleteRelationsForReference).toHaveBeenCalledWith('GATE', 'gt-1');
      expect(prisma.gateType.delete).toHaveBeenCalledWith({ where: { id: 'gt-1' } });
      expect(prisma.referenceChangeLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          fieldName: 'deleted',
          entityId: 'gt-1',
        }),
      });
    });

    it('should throw error for non-existent gate', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.gateType.findUnique.mockResolvedValue(null);

      await expect(
        gateTypeService.delete('nonexistent', mockUserId)
      ).rejects.toThrow('Ворота не найдены');
    });
  });

  describe('toggleActive', () => {
    it('should toggle active status', async () => {
      const { prisma } = require('@/lib/prisma');
      const oldGate = { id: 'gt-1', active: true };
      const newGate = { id: 'gt-1', active: false };
      prisma.gateType.findUnique.mockResolvedValue(oldGate);
      prisma.gateType.update.mockResolvedValue(newGate);
      prisma.referenceChangeLog.create.mockResolvedValue({});

      const result = await gateTypeService.toggleActive('gt-1', mockUserId);

      expect(result.active).toBe(false);
    });

    it('should throw error for non-existent gate', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.gateType.findUnique.mockResolvedValue(null);

      await expect(
        gateTypeService.toggleActive('nonexistent', mockUserId)
      ).rejects.toThrow('Ворота не найдены');
    });
  });

  describe('deactivateExpired', () => {
    it('should deactivate expired gates and return count', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.gateType.updateMany.mockResolvedValue({ count: 3 });

      const count = await gateTypeService.deactivateExpired();

      expect(count).toBe(3);
      expect(prisma.gateType.updateMany).toHaveBeenCalledWith({
        where: {
          expirationDate: { lt: expect.any(Date) },
          active: true,
        },
        data: { active: false },
      });
    });

    it('should return 0 when no expired gates', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.gateType.updateMany.mockResolvedValue({ count: 0 });

      const count = await gateTypeService.deactivateExpired();
      expect(count).toBe(0);
    });
  });
});
