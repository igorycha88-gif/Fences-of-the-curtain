import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { postTypeService, checkPeriodOverlap } from '@/services/admin/postTypeService';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    postType: {
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

jest.mock('@/lib/audit', () => ({
  createAuditLogAsync: jest.fn(),
}));

describe('checkPeriodOverlap (postType)', () => {
  it('should detect overlapping periods', () => {
    expect(
      checkPeriodOverlap(new Date('2026-01-01'), new Date('2026-12-31'), new Date('2026-06-01'), null)
    ).toBe(true);
  });

  it('should return false for non-overlapping', () => {
    expect(
      checkPeriodOverlap(new Date('2026-01-01'), new Date('2026-03-01'), new Date('2026-04-01'), new Date('2026-12-31'))
    ).toBe(false);
  });

  it('should treat both null as fully overlapping', () => {
    expect(checkPeriodOverlap(null, null, null, null)).toBe(true);
  });

  it('should return false when newEnd equals existingStart (adjacent)', () => {
    const result = checkPeriodOverlap(
      new Date('2026-01-01'),
      new Date('2026-06-01'),
      new Date('2026-06-01'),
      new Date('2026-12-01')
    );
    expect(result).toBe(false);
  });
});

describe('PostTypeService', () => {
  const mockUserId = 'user-1';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return posts with pagination', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.postType.findMany.mockResolvedValue([{ id: 'pt-1', name: 'Столб 60x60' }]);
      prisma.postType.count.mockResolvedValue(1);

      const result = await postTypeService.getAll({ page: 1, pageSize: 20 });

      expect(result.posts).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should filter by wall thickness range', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.postType.findMany.mockResolvedValue([]);
      prisma.postType.count.mockResolvedValue(0);

      await postTypeService.getAll({ minThickness: 2, maxThickness: 4 });

      expect(prisma.postType.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            wallThickness: { gte: 2, lte: 4 },
          }),
        })
      );
    });

    it('should filter by search', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.postType.findMany.mockResolvedValue([]);
      prisma.postType.count.mockResolvedValue(0);

      await postTypeService.getAll({ search: 'столб' });

      expect(prisma.postType.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { name: { contains: 'столб', mode: 'insensitive' } },
              { description: { contains: 'столб', mode: 'insensitive' } },
            ],
          }),
        })
      );
    });

    it('should filter by validityFilter "active" with special AND handling when search present', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.postType.findMany.mockResolvedValue([]);
      prisma.postType.count.mockResolvedValue(0);

      await postTypeService.getAll({ search: 'test', validityFilter: 'active' });

      expect(prisma.postType.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            active: true,
            AND: expect.any(Array),
          }),
        })
      );
    });

    it('should filter by validityFilter "active" without search', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.postType.findMany.mockResolvedValue([]);
      prisma.postType.count.mockResolvedValue(0);

      await postTypeService.getAll({ validityFilter: 'active' });

      const where = prisma.postType.findMany.mock.calls[0][0].where;
      expect(where.active).toBe(true);
      expect(where.OR).toEqual([
        { expirationDate: null },
        { expirationDate: { gt: expect.any(Date) } },
      ]);
    });
  });

  describe('getById', () => {
    it('should return post by id', async () => {
      const { prisma } = require('@/lib/prisma');
      const mockPost = { id: 'pt-1', name: 'Столб 60x60' };
      prisma.postType.findUnique.mockResolvedValue(mockPost);

      const result = await postTypeService.getById('pt-1');
      expect(result).toEqual(mockPost);
    });
  });

  describe('findDuplicates', () => {
    it('should find posts with matching dimensions', async () => {
      const { prisma } = require('@/lib/prisma');
      const dups = [{ id: 'pt-1', name: 'Столб', retailPricePerUnit: 1000, validFrom: null, expirationDate: null, active: true }];
      prisma.postType.findMany.mockResolvedValue(dups);

      const result = await postTypeService.findDuplicates({
        sectionWidth: 60,
        sectionHeight: 60,
        wallThickness: 2,
        length: 3000,
      });

      expect(result).toEqual(dups);
    });
  });

  describe('create', () => {
    it('should return warning when duplicates exist with overlapping periods', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.postType.findMany.mockResolvedValue([
        { id: 'pt-1', name: 'Столб', retailPricePerUnit: 800, validFrom: null, expirationDate: null, active: true },
      ]);

      const data = {
        sectionWidth: 60,
        sectionHeight: 60,
        wallThickness: 2,
        length: 3000,
        retailPricePerUnit: 1000,
        validFrom: null,
        expirationDate: null,
      };

      const result = await postTypeService.create(data as any, mockUserId);

      expect(result as any).toHaveProperty('warning');
      expect((result as any).warning.type).toBe('duplicate_params');
      expect((result as any).canProceed).toBe(true);
    });

    it('should throw when duplicate has same price', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.postType.findMany.mockResolvedValue([
        { id: 'pt-1', name: 'Столб', retailPricePerUnit: 1000, validFrom: null, expirationDate: null, active: true },
      ]);

      const data = {
        sectionWidth: 60,
        sectionHeight: 60,
        wallThickness: 2,
        length: 3000,
        retailPricePerUnit: 1000,
        validFrom: null,
        expirationDate: null,
      };

      await expect(
        postTypeService.create(data as any, mockUserId)
      ).rejects.toThrow('Цена должна отличаться');
    });

    it('should create post when no duplicates', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.postType.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      const created = { id: 'pt-1', name: 'Столб', priority: 1 };
      prisma.postType.create.mockResolvedValue(created);
      prisma.referenceChangeLog.create.mockResolvedValue({});

      const result = await postTypeService.create({
        sectionWidth: 60,
        sectionHeight: 60,
        wallThickness: 2,
        length: 3000,
        retailPricePerUnit: 1000,
        name: 'Столб',
      } as any, mockUserId);

      expect(result).toEqual(created);
    });

    it('should create with confirmDuplicate and update existing expiration', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.postType.findMany
        .mockResolvedValueOnce([{ id: 'pt-old', name: 'Old', retailPricePerUnit: 800, validFrom: null, expirationDate: null, active: true }])
        .mockResolvedValueOnce([]);
      prisma.postType.findUnique.mockResolvedValue({ id: 'pt-old' });
      prisma.postType.update.mockResolvedValue({ id: 'pt-old' });
      const created = { id: 'pt-new', priority: 1 };
      prisma.postType.create.mockResolvedValue(created);
      prisma.referenceChangeLog.create.mockResolvedValue({});

      const data = {
        sectionWidth: 60,
        sectionHeight: 60,
        wallThickness: 2,
        length: 3000,
        retailPricePerUnit: 1000,
        validFrom: new Date('2026-06-01'),
        confirmDuplicate: true,
        updateExistingExpiration: 'pt-old',
        name: 'Столб',
      };

      const result = await postTypeService.create(data as any, mockUserId);

      expect(result).toEqual(created);
      expect(prisma.postType.update).toHaveBeenCalledWith({
        where: { id: 'pt-old' },
        data: { expirationDate: expect.any(Date) },
      });
    });
  });

  describe('update', () => {
    it('should update post and log changes', async () => {
      const { prisma } = require('@/lib/prisma');
      const oldPost = { id: 'pt-1', name: 'Old', sectionWidth: 60, sectionHeight: 60, wallThickness: 2, length: 3000, retailPricePerUnit: 1000, purchasePricePerUnit: 800 };
      const newPost = { id: 'pt-1', name: 'Old', sectionWidth: 60, sectionHeight: 60, wallThickness: 2, length: 3000, retailPricePerUnit: 1200, purchasePricePerUnit: 800 };
      prisma.postType.findUnique.mockResolvedValue(oldPost);
      prisma.postType.update.mockResolvedValue(newPost);
      prisma.referenceChangeLog.create.mockResolvedValue({});

      const result = await postTypeService.update('pt-1', { retailPricePerUnit: 1200 } as any, mockUserId);

      expect(result).toEqual(newPost);
    });

    it('should throw error for non-existent post', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.postType.findUnique.mockResolvedValue(null);

      await expect(
        postTypeService.update('nonexistent', {} as any, mockUserId)
      ).rejects.toThrow('Столб не найден');
    });

    it('should throw error when unique fields match existing post', async () => {
      const { prisma } = require('@/lib/prisma');
      const oldPost = { id: 'pt-1', sectionWidth: 60, sectionHeight: 60, wallThickness: 2, length: 3000 };
      prisma.postType.findUnique.mockResolvedValue(oldPost);
      prisma.postType.findFirst.mockResolvedValue({ id: 'pt-2' });

      await expect(
        postTypeService.update('pt-1', { sectionWidth: 80 } as any, mockUserId)
      ).rejects.toThrow('Столб с такими параметрами уже существует');
    });
  });

  describe('delete', () => {
    it('should delete post and clean up', async () => {
      const { prisma } = require('@/lib/prisma');
      const { mountingHardwareService } = require('@/services/admin/mountingHardwareService');
      const oldPost = { id: 'pt-1', name: 'Столб', priority: 1 };
      prisma.postType.findUnique.mockResolvedValue(oldPost);
      prisma.postType.delete.mockResolvedValue(oldPost);
      prisma.referenceChangeLog.create.mockResolvedValue({});

      await postTypeService.delete('pt-1', mockUserId);

      expect(mountingHardwareService.deleteRelationsForReference).toHaveBeenCalledWith('POST', 'pt-1');
      expect(prisma.postType.delete).toHaveBeenCalledWith({ where: { id: 'pt-1' } });
    });

    it('should throw error for non-existent post', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.postType.findUnique.mockResolvedValue(null);

      await expect(
        postTypeService.delete('nonexistent', mockUserId)
      ).rejects.toThrow('Столб не найден');
    });
  });

  describe('toggleActive', () => {
    it('should toggle active status', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.postType.findUnique.mockResolvedValue({ id: 'pt-1', active: true });
      prisma.postType.update.mockResolvedValue({ id: 'pt-1', active: false });
      prisma.referenceChangeLog.create.mockResolvedValue({});

      const result = await postTypeService.toggleActive('pt-1', mockUserId);
      expect(result.active).toBe(false);
    });

    it('should throw error for non-existent post', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.postType.findUnique.mockResolvedValue(null);

      await expect(
        postTypeService.toggleActive('nonexistent', mockUserId)
      ).rejects.toThrow('Столб не найден');
    });
  });

  describe('deactivateExpired', () => {
    it('should deactivate expired posts', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.postType.updateMany.mockResolvedValue({ count: 4 });

      const count = await postTypeService.deactivateExpired();

      expect(count).toBe(4);
    });
  });

  describe('logChange with price audit', () => {
    it('should create audit log for price changes', async () => {
      const { prisma } = require('@/lib/prisma');
      const { createAuditLogAsync } = require('@/lib/audit');
      prisma.referenceChangeLog.create.mockResolvedValue({});

      const service = postTypeService as any;
      await service.logChange('pt-1', 'UPDATE', 
        { retailPricePerUnit: 1000, purchasePricePerUnit: 800, name: 'test' },
        { retailPricePerUnit: 1200, purchasePricePerUnit: 800, name: 'test' },
        mockUserId
      );

      expect(createAuditLogAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'UPDATE_PRICE',
          entityType: 'PostType',
        })
      );
    });

    it('should not create price audit when no price changed', async () => {
      const { prisma } = require('@/lib/prisma');
      const { createAuditLogAsync } = require('@/lib/audit');
      prisma.referenceChangeLog.create.mockResolvedValue({});

      const service = postTypeService as any;
      await service.logChange('pt-1', 'UPDATE',
        { name: 'Old', retailPricePerUnit: 1000 },
        { name: 'New', retailPricePerUnit: 1000 },
        mockUserId
      );

      expect(createAuditLogAsync).not.toHaveBeenCalled();
    });
  });
});
