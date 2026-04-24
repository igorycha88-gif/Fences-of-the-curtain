import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { mountingHardwareService } from '@/services/admin/mountingHardwareService';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    mountingHardware: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    mountingHardwareRelation: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
      findMany: jest.fn(),
    },
    referenceChangeLog: {
      create: jest.fn(),
    },
  },
}));

jest.mock('@/lib/referenceRegistry', () => ({
  referenceRegistry: {
    getItemName: jest.fn().mockResolvedValue('Test Reference'),
    getAll: jest.fn().mockReturnValue([]),
    getItems: jest.fn().mockResolvedValue([]),
  },
}));

jest.mock('@/lib/audit-helpers', () => ({
  logPriceChange: jest.fn(),
}));

describe('MountingHardwareService', () => {
  const mockUserId = 'user-1';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return items with pagination and reference names', async () => {
      const { prisma } = require('@/lib/prisma');
      const mockItems = [{
        id: 'mh-1',
        name: 'Саморез 4.2x16',
        relations: [{ referenceType: 'POST', referenceId: 'post-1' }],
      }];
      prisma.mountingHardware.findMany.mockResolvedValue(mockItems);
      prisma.mountingHardware.count.mockResolvedValue(1);

      const result = await mountingHardwareService.getAll({ page: 1, pageSize: 20 });

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.items[0].relations[0]).toHaveProperty('referenceName', 'Test Reference');
    });

    it('should filter by referenceType and referenceId', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.mountingHardware.findMany.mockResolvedValue([]);
      prisma.mountingHardware.count.mockResolvedValue(0);

      await mountingHardwareService.getAll({ referenceType: 'POST', referenceId: 'post-1' });

      expect(prisma.mountingHardware.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            relations: {
              some: { referenceType: 'POST', referenceId: 'post-1' },
            },
          }),
        })
      );
    });

    it('should filter by active', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.mountingHardware.findMany.mockResolvedValue([]);
      prisma.mountingHardware.count.mockResolvedValue(0);

      await mountingHardwareService.getAll({ active: true });

      expect(prisma.mountingHardware.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ active: true }),
        })
      );
    });

    it('should filter by search', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.mountingHardware.findMany.mockResolvedValue([]);
      prisma.mountingHardware.count.mockResolvedValue(0);

      await mountingHardwareService.getAll({ search: 'саморез' });

      expect(prisma.mountingHardware.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { name: { contains: 'саморез', mode: 'insensitive' } },
              { description: { contains: 'саморез', mode: 'insensitive' } },
            ],
          }),
        })
      );
    });
  });

  describe('getById', () => {
    it('should return item with reference names', async () => {
      const { prisma } = require('@/lib/prisma');
      const mockItem = {
        id: 'mh-1',
        name: 'Саморез',
        relations: [{ referenceType: 'POST', referenceId: 'post-1' }],
      };
      prisma.mountingHardware.findUnique.mockResolvedValue(mockItem);

      const result = await mountingHardwareService.getById('mh-1');

      expect(result).not.toBeNull();
      expect(result!.relations[0]).toHaveProperty('referenceName', 'Test Reference');
    });

    it('should return null for non-existent id', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.mountingHardware.findUnique.mockResolvedValue(null);

      const result = await mountingHardwareService.getById('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create hardware with relations and log', async () => {
      const { prisma } = require('@/lib/prisma');
      const mockCreated = {
        id: 'mh-1',
        name: 'Саморез',
        relations: [{ referenceType: 'POST', referenceId: 'post-1' }],
      };
      prisma.mountingHardware.create.mockResolvedValue(mockCreated);
      prisma.referenceChangeLog.create.mockResolvedValue({});

      const data = {
        name: 'Саморез',
        description: 'desc',
        retailPrice: 10,
        purchasePrice: 5,
        unit: 'шт',
        active: true,
        useInCalculator: true,
        sortOrder: 0,
        relations: [
          { referenceType: 'POST' as const, referenceId: 'post-1' },
        ],
      };

      const result = await mountingHardwareService.create(data as any, mockUserId);

      expect(result).toEqual(mockCreated);
      expect(prisma.mountingHardware.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Саморез',
          relations: {
            create: [{ referenceType: 'POST', referenceId: 'post-1' }],
          },
        }),
        include: { relations: true },
      });
      expect(prisma.referenceChangeLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          entityType: 'MountingHardware',
          fieldName: 'created',
        }),
      });
    });
  });

  describe('update', () => {
    it('should update hardware and replace relations', async () => {
      const { prisma } = require('@/lib/prisma');
      const oldItem = { id: 'mh-1', name: 'Old', relations: [] };
      prisma.mountingHardware.findUnique.mockResolvedValue(oldItem);
      prisma.mountingHardwareRelation.deleteMany.mockResolvedValue({ count: 1 });
      prisma.mountingHardwareRelation.createMany.mockResolvedValue({ count: 1 });
      const updated = { id: 'mh-1', name: 'New', relations: [] };
      prisma.mountingHardware.update.mockResolvedValue(updated);
      prisma.referenceChangeLog.create.mockResolvedValue({});

      const result = await mountingHardwareService.update('mh-1', {
        name: 'New',
        relations: [{ referenceType: 'GATE' as const, referenceId: 'gate-1' }],
      } as any, mockUserId);

      expect(result).toEqual(updated);
      expect(prisma.mountingHardwareRelation.deleteMany).toHaveBeenCalledWith({
        where: { mountingHardwareId: 'mh-1' },
      });
      expect(prisma.mountingHardwareRelation.createMany).toHaveBeenCalled();
    });

    it('should throw error for non-existent item', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.mountingHardware.findUnique.mockResolvedValue(null);

      await expect(
        mountingHardwareService.update('nonexistent', {} as any, mockUserId)
      ).rejects.toThrow('Позиция не найдена');
    });

    it('should update without replacing relations when not provided', async () => {
      const { prisma } = require('@/lib/prisma');
      const oldItem = { id: 'mh-1', name: 'Old', relations: [] };
      prisma.mountingHardware.findUnique.mockResolvedValue(oldItem);
      const updated = { id: 'mh-1', name: 'New', relations: [] };
      prisma.mountingHardware.update.mockResolvedValue(updated);
      prisma.referenceChangeLog.create.mockResolvedValue({});

      await mountingHardwareService.update('mh-1', { name: 'New' } as any, mockUserId);

      expect(prisma.mountingHardwareRelation.deleteMany).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete hardware and log', async () => {
      const { prisma } = require('@/lib/prisma');
      const oldItem = { id: 'mh-1', name: 'Саморез' };
      prisma.mountingHardware.findUnique.mockResolvedValue(oldItem);
      prisma.mountingHardware.delete.mockResolvedValue(oldItem);
      prisma.referenceChangeLog.create.mockResolvedValue({});

      await mountingHardwareService.delete('mh-1', mockUserId);

      expect(prisma.mountingHardware.delete).toHaveBeenCalledWith({ where: { id: 'mh-1' } });
      expect(prisma.referenceChangeLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          fieldName: 'deleted',
          oldValue: { id: 'mh-1', name: 'Саморез' },
        }),
      });
    });

    it('should throw error for non-existent item', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.mountingHardware.findUnique.mockResolvedValue(null);

      await expect(
        mountingHardwareService.delete('nonexistent', mockUserId)
      ).rejects.toThrow('Позиция не найдена');
    });
  });

  describe('toggleActive', () => {
    it('should toggle active status', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.mountingHardware.findUnique.mockResolvedValue({ id: 'mh-1', active: true });
      prisma.mountingHardware.update.mockResolvedValue({ id: 'mh-1', active: false });
      prisma.referenceChangeLog.create.mockResolvedValue({});

      const result = await mountingHardwareService.toggleActive('mh-1', mockUserId);
      expect(result.active).toBe(false);
    });

    it('should throw error for non-existent', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.mountingHardware.findUnique.mockResolvedValue(null);

      await expect(
        mountingHardwareService.toggleActive('nonexistent', mockUserId)
      ).rejects.toThrow('Позиция не найдена');
    });
  });

  describe('deleteRelationsForReference', () => {
    it('should delete relations and find orphaned hardware', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.mountingHardwareRelation.deleteMany.mockResolvedValue({ count: 2 });
      prisma.mountingHardware.findMany.mockResolvedValue([]);

      const result = await mountingHardwareService.deleteRelationsForReference('GATE', 'gate-1');

      expect(prisma.mountingHardwareRelation.deleteMany).toHaveBeenCalledWith({
        where: { referenceType: 'GATE', referenceId: 'gate-1' },
      });
      expect(result.deletedCount).toBe(2);
      expect(result.orphanedHardware).toEqual([]);
    });

    it('should report orphaned hardware', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.mountingHardwareRelation.deleteMany.mockResolvedValue({ count: 1 });
      prisma.mountingHardware.findMany.mockResolvedValue([
        { id: 'mh-orphan', name: 'Orphan Item' },
      ]);

      const result = await mountingHardwareService.deleteRelationsForReference('POST', 'post-1');

      expect(result.orphanedHardware).toHaveLength(1);
    });
  });

  describe('deactivateExpired', () => {
    it('should deactivate expired hardware', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.mountingHardware.updateMany.mockResolvedValue({ count: 3 });

      const count = await mountingHardwareService.deactivateExpired();
      expect(count).toBe(3);
    });
  });
});
