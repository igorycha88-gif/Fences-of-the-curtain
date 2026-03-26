import { portfolioService } from '@/services/admin/portfolioService';

jest.mock('@/lib/prisma', () => {
  const mockPrisma = {
    portfolioItem: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
      aggregate: jest.fn(),
      count: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  };
  return {
    prisma: mockPrisma,
  };
});

import { prisma } from '@/lib/prisma';

describe('PortfolioService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return paginated list', async () => {
      const mockItems = [
        { id: '1', title: 'Test 1', category: 'fence', images: [], active: true, sortOrder: 0 },
        { id: '2', title: 'Test 2', category: 'canopy', images: [], active: true, sortOrder: 1 },
      ];

      (prisma.portfolioItem.findMany as any).mockResolvedValue(mockItems);
      (prisma.portfolioItem.count as any).mockResolvedValue(2);

      const result = await portfolioService.getAll({ page: 1, pageSize: 20 });

      expect(result.items).toEqual(mockItems);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);
      expect(result.totalPages).toBe(1);
    });

    it('should filter by category', async () => {
      (prisma.portfolioItem.findMany as any).mockResolvedValue([]);
      (prisma.portfolioItem.count as any).mockResolvedValue(0);

      await portfolioService.getAll({ page: 1, pageSize: 20, category: 'fence' });

      expect(prisma.portfolioItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ category: 'fence' }),
        })
      );
    });

    it('should filter by active status', async () => {
      (prisma.portfolioItem.findMany as any).mockResolvedValue([]);
      (prisma.portfolioItem.count as any).mockResolvedValue(0);

      await portfolioService.getAll({ page: 1, pageSize: 20, active: true });

      expect(prisma.portfolioItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ active: true }),
        })
      );
    });
  });

  describe('getById', () => {
    it('should return item by id', async () => {
      const mockItem = { id: '1', title: 'Test', category: 'fence', images: [] };
      (prisma.portfolioItem.findUnique as any).mockResolvedValue(mockItem);

      const result = await portfolioService.getById('1');
      expect(result).toEqual(mockItem);
    });
  });

  describe('create', () => {
    it('should create item with auto sortOrder', async () => {
      const mockItem = { 
        id: '1', 
        title: 'Test', 
        category: 'fence', 
        images: ['/test.jpg'],
        active: true,
        sortOrder: 6,
        showCost: false,
      };

      (prisma.portfolioItem.aggregate as any).mockResolvedValue({
        _max: { sortOrder: 5 },
      });
      (prisma.portfolioItem.create as any).mockResolvedValue(mockItem);
      (prisma.auditLog.create as any).mockResolvedValue({});

      const result = await portfolioService.create({
        title: 'Test',
        category: 'fence',
        images: ['/test.jpg'],
        showCost: false,
        active: true,
      }, 'user1');

      expect(result).toEqual(mockItem);
      expect(prisma.portfolioItem.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: 'Test',
            category: 'fence',
            images: ['/test.jpg'],
            sortOrder: 6,
          }),
        })
      );
    });
  });

  describe('toggleActive', () => {
    it('should toggle active status', async () => {
      const oldItem = { id: '1', active: true, images: [] };
      const newItem = { id: '1', active: false, images: [] };

      (prisma.portfolioItem.findUnique as any).mockResolvedValue(oldItem);
      (prisma.portfolioItem.update as any).mockResolvedValue(newItem);
      (prisma.auditLog.create as any).mockResolvedValue({});

      const result = await portfolioService.toggleActive('1', 'user1');

      expect(result.active).toBe(false);
    });
  });
});
