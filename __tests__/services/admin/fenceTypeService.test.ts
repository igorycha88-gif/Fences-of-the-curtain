import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { fenceTypeService } from '@/services/admin/fenceTypeService';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    fenceType: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    fenceMaterial: {
      count: jest.fn(),
    },
    referenceChangeLog: {
      create: jest.fn(),
    },
  },
}));

jest.mock('@/services/calculator/fenceTypeCalculatorService', () => ({
  fenceTypeCalculatorService: {
    invalidateCache: jest.fn(),
  },
}));

jest.mock('@/services/admin/priorityService', () => ({
  priorityService: {
    recalculateAfterDelete: jest.fn(),
  },
}));

describe('FenceTypeService', () => {
  const mockUserId = 'user-1';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return fence types with pagination', async () => {
      const { prisma } = require('@/lib/prisma');
      const mockTypes = [
        { id: 'ft-1', name: 'Профнастил', priority: 1, active: true },
      ];
      prisma.fenceType.findMany.mockResolvedValue(mockTypes);
      prisma.fenceType.count.mockResolvedValue(1);

      const result = await fenceTypeService.getAll({ page: 1, pageSize: 20 });

      expect(result.types).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
      expect(prisma.fenceType.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 20,
          orderBy: { priority: 'asc' },
        })
      );
    });

    it('should filter by active status', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.fenceType.findMany.mockResolvedValue([]);
      prisma.fenceType.count.mockResolvedValue(0);

      await fenceTypeService.getAll({ active: true });

      expect(prisma.fenceType.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ active: true }),
        })
      );
    });

    it('should filter by search term', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.fenceType.findMany.mockResolvedValue([]);
      prisma.fenceType.count.mockResolvedValue(0);

      await fenceTypeService.getAll({ search: 'проф' });

      expect(prisma.fenceType.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { name: { contains: 'проф', mode: 'insensitive' } },
              { description: { contains: 'проф', mode: 'insensitive' } },
            ],
          }),
        })
      );
    });

    it('should handle pagination for page 2', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.fenceType.findMany.mockResolvedValue([]);
      prisma.fenceType.count.mockResolvedValue(25);

      await fenceTypeService.getAll({ page: 2, pageSize: 10 });

      expect(prisma.fenceType.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 10 })
      );
      expect(prisma.fenceType.count).toHaveBeenCalled();
    });
  });

  describe('getById', () => {
    it('should return fence type with materials', async () => {
      const { prisma } = require('@/lib/prisma');
      const mockType = {
        id: 'ft-1',
        name: 'Профнастил',
        materials: [{ id: 'mat-1', sortOrder: 1 }],
      };
      prisma.fenceType.findUnique.mockResolvedValue(mockType);

      const result = await fenceTypeService.getById('ft-1');

      expect(result).toEqual(mockType);
      expect(prisma.fenceType.findUnique).toHaveBeenCalledWith({
        where: { id: 'ft-1' },
        include: {
          materials: { orderBy: { sortOrder: 'asc' } },
          lengthMarkups: { orderBy: { priority: 'asc' } },
        },
      });
    });

    it('should return null for non-existent id', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.fenceType.findUnique.mockResolvedValue(null);

      const result = await fenceTypeService.getById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create fence type with next priority and log change', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.fenceType.findMany.mockResolvedValue([
        { id: 'ft-1', priority: 1 },
      ]);
      const mockCreated = { id: 'ft-2', name: 'Евроштакетник', priority: 2 };
      prisma.fenceType.create.mockResolvedValue(mockCreated);
      prisma.referenceChangeLog.create.mockResolvedValue({});

      const result = await fenceTypeService.create(
        { name: 'Евроштакетник', description: 'desc' } as any,
        mockUserId
      );

      expect(result).toEqual(mockCreated);
      expect(prisma.fenceType.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ priority: 2 }),
      });
      expect(prisma.referenceChangeLog.create).toHaveBeenCalledWith({
        data: {
          entityType: 'FenceType',
          entityId: 'ft-2',
          fieldName: 'priority',
          oldValue: undefined,
          newValue: 2,
          changedBy: mockUserId,
        },
      });
    });

    it('should set priority to 1 for empty table', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.fenceType.findMany.mockResolvedValue([]);
      prisma.fenceType.create.mockResolvedValue({ id: 'ft-1', priority: 1 });
      prisma.referenceChangeLog.create.mockResolvedValue({});

      await fenceTypeService.create({ name: 'Test' } as any, mockUserId);

      expect(prisma.fenceType.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ priority: 1 }),
      });
    });
  });

  describe('update', () => {
    it('should update fence type and log changes', async () => {
      const { prisma } = require('@/lib/prisma');
      const oldType = { id: 'ft-1', name: 'Старый', active: true };
      const newType = { id: 'ft-1', name: 'Новый', active: true };
      prisma.fenceType.findUnique.mockResolvedValue(oldType);
      prisma.fenceType.update.mockResolvedValue(newType);
      prisma.referenceChangeLog.create.mockResolvedValue({});

      const result = await fenceTypeService.update('ft-1', { name: 'Новый' } as any, mockUserId);

      expect(result).toEqual(newType);
      expect(prisma.fenceType.update).toHaveBeenCalledWith({
        where: { id: 'ft-1' },
        data: { name: 'Новый' },
      });
      expect(prisma.referenceChangeLog.create).toHaveBeenCalled();
    });

    it('should throw error for non-existent fence type', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.fenceType.findUnique.mockResolvedValue(null);

      await expect(
        fenceTypeService.update('nonexistent', {} as any, mockUserId)
      ).rejects.toThrow('Тип забора не найден');
    });
  });

  describe('delete', () => {
    it('should delete fence type when no materials exist', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.fenceMaterial.count.mockResolvedValue(0);
      const oldType = { id: 'ft-1', name: 'Test', priority: 1 };
      prisma.fenceType.findUnique.mockResolvedValue(oldType);
      prisma.fenceType.delete.mockResolvedValue(oldType);
      prisma.referenceChangeLog.create.mockResolvedValue({});

      await fenceTypeService.delete('ft-1', mockUserId);

      expect(prisma.fenceType.delete).toHaveBeenCalledWith({ where: { id: 'ft-1' } });
      expect(prisma.referenceChangeLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          entityType: 'FenceType',
          entityId: 'ft-1',
          fieldName: 'deleted',
        }),
      });
    });

    it('should throw error when materials reference the fence type', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.fenceMaterial.count.mockResolvedValue(3);

      await expect(
        fenceTypeService.delete('ft-1', mockUserId)
      ).rejects.toThrow('Невозможно удалить тип забора, используется в 3 материалах');
    });
  });

  describe('toggleActive', () => {
    it('should toggle active status from true to false', async () => {
      const { prisma } = require('@/lib/prisma');
      const oldType = { id: 'ft-1', active: true };
      const newType = { id: 'ft-1', active: false };
      prisma.fenceType.findUnique.mockResolvedValue(oldType);
      prisma.fenceType.update.mockResolvedValue(newType);
      prisma.referenceChangeLog.create.mockResolvedValue({});

      const result = await fenceTypeService.toggleActive('ft-1', mockUserId);

      expect(result.active).toBe(false);
      expect(prisma.fenceType.update).toHaveBeenCalledWith({
        where: { id: 'ft-1' },
        data: { active: false },
      });
    });

    it('should throw error for non-existent fence type', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.fenceType.findUnique.mockResolvedValue(null);

      await expect(
        fenceTypeService.toggleActive('nonexistent', mockUserId)
      ).rejects.toThrow('Тип забора не найден');
    });
  });

  describe('logChange', () => {
    it('should skip logging for CREATE action', async () => {
      const { prisma } = require('@/lib/prisma');
      const service = fenceTypeService as any;

      await service.logChange('ft-1', 'CREATE', {}, {}, mockUserId);

      expect(prisma.referenceChangeLog.create).not.toHaveBeenCalled();
    });

    it('should skip logging for DELETE action', async () => {
      const { prisma } = require('@/lib/prisma');
      const service = fenceTypeService as any;

      await service.logChange('ft-1', 'DELETE', {}, {}, mockUserId);

      expect(prisma.referenceChangeLog.create).not.toHaveBeenCalled();
    });

    it('should log changed fields', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.referenceChangeLog.create.mockResolvedValue({});
      const service = fenceTypeService as any;

      const oldValue = { name: 'Old', active: true };
      const newValue = { name: 'New', active: true };

      await service.logChange('ft-1', 'UPDATE', oldValue, newValue, mockUserId);

      expect(prisma.referenceChangeLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          entityType: 'FenceType',
          entityId: 'ft-1',
          fieldName: 'name',
          oldValue: 'Old',
          newValue: 'New',
        }),
      });
    });
  });
});
