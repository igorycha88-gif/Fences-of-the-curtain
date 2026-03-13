import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { PriorityService } from '@/services/admin/priorityService';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: jest.fn((callback: any) => callback(mockTx)),
    fenceType: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
    referenceChangeLog: {
      create: jest.fn(),
    },
  },
}));

const mockTx = {
  fenceType: {
    update: jest.fn(),
  },
};

describe('PriorityService', () => {
  let priorityService: PriorityService;

  beforeEach(() => {
    jest.clearAllMocks();
    priorityService = new PriorityService();
  });

  describe('reorder', () => {
    test('should log priority change in referenceChangeLog', async () => {
      const { prisma } = require('@/lib/prisma');
      
      prisma.fenceType.findMany.mockResolvedValue([
        { id: '1', priority: 1 },
        { id: '2', priority: 2 },
        { id: '3', priority: 3 },
      ]);

      prisma.referenceChangeLog.create.mockResolvedValue({});

      const result = await priorityService.reorder('fenceType', '3', 1, 'user-1');

      expect(result.success).toBe(true);
      expect(prisma.referenceChangeLog.create).toHaveBeenCalled();
    });

    test('should throw error for invalid priority', async () => {
      const { prisma } = require('@/lib/prisma');
      
      prisma.fenceType.findMany.mockResolvedValue([
        { id: '1', priority: 1 },
        { id: '2', priority: 2 },
      ]);

      await expect(
        priorityService.reorder('fenceType', '1', 5, 'user-1')
      ).rejects.toThrow('Приоритет не может превышать общее количество записей');
    });

    test('should throw error if item not found', async () => {
      const { prisma } = require('@/lib/prisma');
      
      prisma.fenceType.findMany.mockResolvedValue([
        { id: '1', priority: 1 },
      ]);

      await expect(
        priorityService.reorder('fenceType', '999', 1, 'user-1')
      ).rejects.toThrow('Запись не найдена');
    });
  });

  describe('recalculateAfterDelete', () => {
    test('should recalculate priorities and log changes', async () => {
      const { prisma } = require('@/lib/prisma');
      
      prisma.fenceType.findMany.mockResolvedValue([
        { id: '2', priority: 2 },
        { id: '3', priority: 3 },
        { id: '5', priority: 5 },
      ]);

      prisma.referenceChangeLog.create.mockResolvedValue({});

      await priorityService.recalculateAfterDelete('fenceType', 'user-1');

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    test('should not update if priorities are already sequential', async () => {
      const { prisma } = require('@/lib/prisma');
      
      prisma.fenceType.findMany.mockResolvedValue([
        { id: '1', priority: 1 },
        { id: '2', priority: 2 },
        { id: '3', priority: 3 },
      ]);

      await priorityService.recalculateAfterDelete('fenceType', 'user-1');

      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('getNextPriorityValue', () => {
    test('should return next priority value', async () => {
      const { prisma } = require('@/lib/prisma');
      
      prisma.fenceType.findMany.mockResolvedValue([
        { id: '1', priority: 1 },
        { id: '2', priority: 2 },
      ]);

      const nextPriority = await priorityService.getNextPriorityValue('fenceType');

      expect(nextPriority).toBe(3);
    });

    test('should return 1 for empty table', async () => {
      const { prisma } = require('@/lib/prisma');
      
      prisma.fenceType.findMany.mockResolvedValue([]);

      const nextPriority = await priorityService.getNextPriorityValue('fenceType');

      expect(nextPriority).toBe(1);
    });
  });
});
