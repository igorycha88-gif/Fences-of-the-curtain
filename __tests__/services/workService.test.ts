import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { workService } from '@/services/admin/workService';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/cache', () => ({
  cache: {
    get: (jest.fn as any)().mockResolvedValue(null as any),
    set: (jest.fn as any)().mockResolvedValue(undefined as any),
    del: (jest.fn as any)().mockResolvedValue(undefined as any),
    delPattern: (jest.fn as any)().mockResolvedValue(undefined as any),
    getOrSet: (jest.fn as any)().mockImplementation(async (key: string, factory: () => Promise<any>, ttl: number) => {
      return await factory();
    }),
    healthCheck: (jest.fn as any)().mockResolvedValue({ redis: false, memory: true } as any),
  },
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    work: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    workRelation: {
      createMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    referenceChangeLog: {
      create: jest.fn(),
    },
  },
}));

describe('WorkService', () => {
  const mockUserId = 'test-user-id';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create work with relations', async () => {
      const { prisma } = require('@/lib/prisma');
      const mockWork = {
        id: 'work-1',
        name: 'Монтаж забора',
        description: 'Описание',
        category: 'MOUNTING',
        unit: 'M',
        price: 500.00,
        useInCalculator: true,
        sortOrder: 0,
        active: true,
        relations: [
          { id: 'rel-1', workId: 'work-1', fenceType: 'PROFNASTIL', createdAt: new Date() },
        ],
      };

      prisma.work.create.mockResolvedValue(mockWork);
      prisma.workRelation.createMany.mockResolvedValue({ count: 1 });
      prisma.referenceChangeLog.create.mockResolvedValue({});

      const createData = {
        name: 'Монтаж забора',
        description: 'Описание',
        category: 'MOUNTING',
        unit: 'M',
        price: 500.00,
        useInCalculator: true,
        sortOrder: 0,
        active: true,
        relations: [{ fenceType: 'PROFNASTIL' }],
      };

      const result = await workService.create(createData as any, mockUserId);

      expect(prisma.work.create).toHaveBeenCalledWith({
        data: {
          name: 'Монтаж забора',
          description: 'Описание',
          category: 'MOUNTING',
          unit: 'M',
          price: 500.00,
          useInCalculator: true,
          sortOrder: 0,
          active: true,
          relations: {
            create: [{ fenceType: 'PROFNASTIL', referenceType: null, referenceId: null }],
          },
        },
        include: { relations: true },
      });

      expect(prisma.referenceChangeLog.create).toHaveBeenCalledWith({
        data: {
          entityType: 'Work',
          entityId: 'work-1',
          fieldName: 'created',
          oldValue: undefined,
          newValue: { name: 'Монтаж забора' },
          changedBy: mockUserId,
        },
      });

      expect(result).toEqual(mockWork);
    });

    it('should create work without relations', async () => {
      const { prisma } = require('@/lib/prisma');
      const mockWork = {
        id: 'work-2',
        name: 'Замер',
        category: 'MEASUREMENT',
        unit: 'FIXED',
        price: 1000.00,
        useInCalculator: false,
        sortOrder: 0,
        active: true,
        relations: [],
      };

      prisma.work.create.mockResolvedValue(mockWork);
      prisma.referenceChangeLog.create.mockResolvedValue({});

      const createData = {
        name: 'Замер',
        category: 'MEASUREMENT',
        unit: 'FIXED',
        price: 1000.00,
        relations: [],
      };

      const result = await workService.create(createData as any, mockUserId);

      expect(prisma.work.create).toHaveBeenCalledWith({
        data: {
          ...createData,
          relations: {
            create: [],
          },
        },
        include: { relations: true },
      });

      expect(result).toEqual(mockWork);
    });

    it('should log change log', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.work.create.mockResolvedValue({ id: 'work-3' });
      prisma.referenceChangeLog.create.mockResolvedValue({});

      const createData = {
        name: 'Тест',
        category: 'MOUNTING',
        unit: 'M',
        price: 500.00,
      };

      await workService.create(createData as any, mockUserId);

      expect(prisma.referenceChangeLog.create).toHaveBeenCalled();
    });
  });

  describe('getAll', () => {
    it('should return works with pagination', async () => {
      const { prisma } = require('@/lib/prisma');
      const mockWorks = [
        {
          id: 'work-1',
          name: 'Монтаж забора',
          category: 'MOUNTING',
          unit: 'M',
          price: 500.00,
          active: true,
          relations: [],
        },
      ];

      prisma.work.findMany.mockResolvedValue(mockWorks);
      prisma.work.count.mockResolvedValue(1);

      const result = await workService.getAll({ page: 1, pageSize: 20 });

      expect(prisma.work.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 20,
        orderBy: { sortOrder: 'asc' },
        include: { relations: true },
      });

      expect(prisma.work.count).toHaveBeenCalledWith({
        where: {},
      });

      expect(result).toEqual({
        items: expect.arrayContaining([{
          ...mockWorks[0],
          categoryName: 'Монтаж',
          unitName: 'м',
          relations: [],
        }]),
        total: 1,
        page: 1,
        pageSize: 20,
        totalPages: 1,
      });
    });

    it('should filter by search', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.work.findMany.mockResolvedValue([]);
      prisma.work.count.mockResolvedValue(0);

      await workService.getAll({ search: 'забор' });

      expect(prisma.work.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { name: { contains: 'забор', mode: 'insensitive' } },
            { description: { contains: 'забор', mode: 'insensitive' } },
          ],
        },
        skip: 0,
        take: 20,
        orderBy: { sortOrder: 'asc' },
        include: { relations: true },
      });
    });

    it('should filter by category', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.work.findMany.mockResolvedValue([]);
      prisma.work.count.mockResolvedValue(0);

      await workService.getAll({ category: 'MOUNTING' });

      expect(prisma.work.findMany).toHaveBeenCalledWith({
        where: {
          category: 'MOUNTING',
        },
        skip: 0,
        take: 20,
        orderBy: { sortOrder: 'asc' },
        include: { relations: true },
      });
    });

    it('should filter by active status', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.work.findMany.mockResolvedValue([]);
      prisma.work.count.mockResolvedValue(0);

      await workService.getAll({ active: true });

      expect(prisma.work.findMany).toHaveBeenCalledWith({
        where: { active: true },
        skip: 0,
        take: 20,
        orderBy: { sortOrder: 'asc' },
        include: { relations: true },
      });
    });

    it('should filter by useInCalculator', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.work.findMany.mockResolvedValue([]);
      prisma.work.count.mockResolvedValue(0);

      await workService.getAll({ useInCalculator: true });

      expect(prisma.work.findMany).toHaveBeenCalledWith({
        where: { useInCalculator: true },
        skip: 0,
        take: 20,
        orderBy: { sortOrder: 'asc' },
        include: { relations: true },
      });
    });

    it('should filter by fenceType', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.work.findMany.mockResolvedValue([]);
      prisma.work.count.mockResolvedValue(0);

      await workService.getAll({ fenceType: 'PROFNASTIL' });

      expect(prisma.work.findMany).toHaveBeenCalledWith({
        where: {
          relations: {
            some: { fenceType: 'PROFNASTIL' },
          },
        },
        skip: 0,
        take: 20,
        orderBy: { sortOrder: 'asc' },
        include: { relations: true },
      });
    });

    it('should handle pagination correctly', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.work.findMany.mockResolvedValue([]);
      prisma.work.count.mockResolvedValue(0);

      await workService.getAll({ page: 2, pageSize: 10 });

      expect(prisma.work.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 10,
        take: 10,
        orderBy: { sortOrder: 'asc' },
        include: { relations: true },
      });
    });
  });

  describe('getById', () => {
    it('should return work by id', async () => {
      const { prisma } = require('@/lib/prisma');
      const mockWork = {
        id: 'work-1',
        name: 'Монтаж забора',
        category: 'MOUNTING',
        unit: 'M',
        price: 500.00,
        active: true,
        relations: [],
      };

      prisma.work.findUnique.mockResolvedValue(mockWork);

      const result = await workService.getById('work-1');

      expect(prisma.work.findUnique).toHaveBeenCalledWith({
        where: { id: 'work-1' },
        include: { relations: true },
      });

      expect(result).toEqual({
        ...mockWork,
        categoryName: 'Монтаж',
        unitName: 'м',
        relations: [],
      });
    });

    it('should return null for non-existent id', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.work.findUnique.mockResolvedValue(null);

      const result = await workService.getById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getByFenceType', () => {
    it('should return works by fence type', async () => {
      const { prisma } = require('@/lib/prisma');
      const mockWorks = [
        {
          id: 'work-1',
          name: 'Монтаж забора',
          category: 'MOUNTING',
          unit: 'M',
          price: 500.00,
          useInCalculator: true,
          relations: [
            { fenceType: 'PROFNASTIL' },
          ],
        },
      ];

      prisma.work.findMany.mockResolvedValue(mockWorks);

      const result = await workService.getByFenceType('PROFNASTIL');

      expect(prisma.work.findMany).toHaveBeenCalledWith({
        where: {
          active: true,
          useInCalculator: true,
        },
        orderBy: { sortOrder: 'asc' },
        include: {
          relations: true,
        },
      });

      expect(result).toEqual([
        {
          id: 'work-1',
          name: 'Монтаж забора',
          category: 'MOUNTING',
          categoryName: 'Монтаж',
          unit: 'M',
          unitName: 'м',
          price: 500.00,
          useInCalculator: true,
        },
      ]);
    });

    it('should return works without fence type', async () => {
      const { prisma } = require('@/lib/prisma');
      const mockWorks = [
        {
          id: 'work-2',
          name: 'Замер',
          category: 'MEASUREMENT',
          unit: 'FIXED',
          price: 1000.00,
          useInCalculator: true,
        },
      ];

      prisma.work.findMany.mockResolvedValue(mockWorks);

      const result = await workService.getWorksForCalculator();

      expect(prisma.work.findMany).toHaveBeenCalledWith({
        where: {
          active: true,
          useInCalculator: true,
        },
        orderBy: { sortOrder: 'asc' },
        include: {
          relations: true,
        },
      });

      expect(result).toEqual([
        {
          ...mockWorks[0],
        },
      ]);
    });
  });

  describe('update', () => {
    it('should update work', async () => {
      const { prisma } = require('@/lib/prisma');
      const mockOldWork = {
        id: 'work-1',
        name: 'Старое название',
        category: 'MOUNTING',
        unit: 'M',
        price: 400.00,
      };
      const mockUpdatedWork = {
        id: 'work-1',
        name: 'Новое название',
        category: 'MOUNTING',
        unit: 'M',
        price: 600.00,
      };

      prisma.work.findUnique.mockResolvedValue(mockOldWork);
      prisma.workRelation.deleteMany.mockResolvedValue({ count: 1 });
      prisma.workRelation.createMany.mockResolvedValue({ count: 2 });
      prisma.work.update.mockResolvedValue(mockUpdatedWork);
      prisma.referenceChangeLog.create.mockResolvedValue({});

      const updateData = {
        name: 'Новое название',
        price: 600.00,
        relations: [
          { fenceType: 'PICKET' },
          { fenceType: 'GATE' },
        ],
      };

      await workService.update('work-1', updateData as any, mockUserId);

      expect(prisma.work.findUnique).toHaveBeenCalledWith({
        where: { id: 'work-1' },
        include: { relations: true },
      });

      expect(prisma.workRelation.deleteMany).toHaveBeenCalledWith({
        where: { workId: 'work-1' },
      });

      expect(prisma.workRelation.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          { workId: 'work-1', fenceType: 'PICKET', referenceType: null, referenceId: null },
          { workId: 'work-1', fenceType: 'GATE', referenceType: null, referenceId: null },
        ]),
      });

      expect(prisma.work.update).toHaveBeenCalledWith({
        where: { id: 'work-1' },
        data: {
          name: 'Новое название',
          price: 600.00,
        },
        include: { relations: true },
      });

      expect(prisma.referenceChangeLog.create).toHaveBeenCalled();
    });

    it('should handle relations update', async () => {
      const { prisma } = require('@/lib/prisma');
      const mockWork = { id: 'work-1', name: 'Тест' };
      
      prisma.work.findUnique.mockResolvedValue(mockWork);
      prisma.workRelation.deleteMany.mockResolvedValue({ count: 2 });
      prisma.work.update.mockResolvedValue(mockWork);
      prisma.referenceChangeLog.create.mockResolvedValue({});

      await workService.update('work-1', { relations: [] } as any, mockUserId);

      expect(prisma.workRelation.deleteMany).toHaveBeenCalled();
      expect(prisma.work.update).toHaveBeenCalledWith({
        where: { id: 'work-1' },
        data: {},
        include: { relations: true },
      });
    });

  });

  describe('delete', () => {
    it('should delete work', async () => {
      const { prisma } = require('@/lib/prisma');
      const mockWork = {
        id: 'work-1',
        name: 'Монтаж забора',
      };

      prisma.work.findUnique.mockResolvedValue(mockWork);
      prisma.work.delete.mockResolvedValue(mockWork);
      prisma.referenceChangeLog.create.mockResolvedValue({});

      await workService.delete('work-1', mockUserId);

      expect(prisma.work.findUnique).toHaveBeenCalledWith({
        where: { id: 'work-1' },
      });

      expect(prisma.work.delete).toHaveBeenCalledWith({
        where: { id: 'work-1' },
      });

      expect(prisma.referenceChangeLog.create).toHaveBeenCalledWith({
        data: {
          entityType: 'Work',
          entityId: 'work-1',
          fieldName: 'deleted',
          oldValue: { id: 'work-1', name: 'Монтаж забора' },
          newValue: undefined,
          changedBy: mockUserId,
        },
      });
    });

    it('should throw error for non-existent work', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.work.findUnique.mockResolvedValue(null);

      await expect(workService.delete('non-existent', mockUserId)).rejects.toThrow('Работа не найдена');
    });
  });

  describe('toggleActive', () => {
    it('should toggle active status', async () => {
      const { prisma } = require('@/lib/prisma');
      const mockWork = {
        id: 'work-1',
        name: 'Монтаж забора',
        active: true,
      };
      const mockUpdatedWork = {
        id: 'work-1',
        name: 'Монтаж забора',
        active: false,
      };

      prisma.work.findUnique.mockResolvedValue(mockWork);
      prisma.work.update.mockResolvedValue(mockUpdatedWork);
      prisma.referenceChangeLog.create.mockResolvedValue({});

      await workService.toggleActive('work-1', mockUserId);

      expect(prisma.work.findUnique).toHaveBeenCalledWith({
        where: { id: 'work-1' },
      });

      expect(prisma.work.update).toHaveBeenCalledWith({
        where: { id: 'work-1' },
        data: { active: false },
      });

      expect(prisma.referenceChangeLog.create).toHaveBeenCalled();
    });

    it('should throw error for non-existent work', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.work.findUnique.mockResolvedValue(null);

      await expect(workService.toggleActive('non-existent', mockUserId)).rejects.toThrow('Работа не найдена');
    });
  });

  describe('getFenceTypes', () => {
    it('should return fence types', async () => {
      const result = await workService.getFenceTypes();

      expect(result).toEqual([
        { value: 'PROFNASTIL', label: 'Профнастил' },
        { value: 'PICKET', label: 'Евроштакетник' },
        { value: 'PANEL_3D', label: '3D-панели' },
        { value: 'GATE', label: 'Ворота' },
        { value: 'WICKET', label: 'Калитки' },
      ]);
    });
  });

  describe('getWorksForCalculator', () => {
    it('should return works for calculator by fence type', async () => {
      const { prisma } = require('@/lib/prisma');
      const mockWorks = [
        {
          id: 'work-1',
          name: 'Монтаж забора',
          category: 'MOUNTING',
          unit: 'M',
          price: 500.00,
          useInCalculator: true,
          relations: [
            { fenceType: 'PROFNASTIL' },
          ],
        },
      ];

      prisma.work.findMany.mockResolvedValue(mockWorks);

      const result = await workService.getWorksForCalculator('PROFNASTIL');

      expect(prisma.work.findMany).toHaveBeenCalledWith({
        where: {
          active: true,
          useInCalculator: true,
        },
        orderBy: { sortOrder: 'asc' },
        include: {
          relations: true,
        },
      });

      expect(result).toEqual(mockWorks);
    });

    it('should return works for calculator without fence type', async () => {
      const { prisma } = require('@/lib/prisma');
      const mockWorks = [
        {
          id: 'work-2',
          name: 'Замер',
          category: 'MEASUREMENT',
          unit: 'FIXED',
          price: 1000.00,
          useInCalculator: true,
        },
      ];

      prisma.work.findMany.mockResolvedValue(mockWorks);

      const result = await workService.getWorksForCalculator();

      expect(prisma.work.findMany).toHaveBeenCalledWith({
        where: {
          active: true,
          useInCalculator: true,
        },
        orderBy: { sortOrder: 'asc' },
        include: {
          relations: true,
        },
      });

      expect(result).toEqual(mockWorks);
    });
  });

  describe('getFenceTypeName', () => {
    it('should return correct fence type names', () => {
      const service = workService as any;
      
      expect(service.getFenceTypeName('PROFNASTIL')).toBe('Профнастил');
      expect(service.getFenceTypeName('PICKET')).toBe('Евроштакетник');
      expect(service.getFenceTypeName('GATE')).toBe('Ворота');
      expect(service.getFenceTypeName('WICKET')).toBe('Калитки');
      expect(service.getFenceTypeName('UNKNOWN')).toBe('UNKNOWN');
    });
  });
});
