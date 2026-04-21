import { statisticsService } from '@/services/admin/statisticsService';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    order: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

describe('StatisticsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDashboardStats', () => {
    it('should return dashboard statistics', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.order.count.mockResolvedValue(0);
      prisma.order.findMany.mockResolvedValue([]);

      const result = await statisticsService.getDashboardStats('month');

      expect(result).toHaveProperty('newOrders');
      expect(result).toHaveProperty('ordersInProgress');
      expect(result).toHaveProperty('completedOrders');
      expect(result).toHaveProperty('averageOrderCost');
      expect(result).toHaveProperty('totalRevenue');
      expect(result).toHaveProperty('conversionRate');
      expect(result.period).toBe('month');
    });
  });

  describe('getOrdersByType', () => {
    it('should group orders by type', async () => {
      const mockOrders = [
        { serviceType: 'fence' as any },
        { serviceType: 'fence' as any },
        { serviceType: 'canopy' as any },
      ];
      const { prisma } = require('@/lib/prisma');
      prisma.order.findMany.mockResolvedValue(mockOrders);

      const result = await statisticsService.getOrdersByType();

      expect(result).toEqual({
        fence: 2,
        canopy: 1,
      });
    });
  });

  describe('getOrdersByStatus', () => {
    it('should group orders by status', async () => {
      const mockOrders = [
        { status: 'NEW' },
        { status: 'NEW' },
        { status: 'IN_PROGRESS' },
        { status: 'COMPLETED' },
      ];
      const { prisma } = require('@/lib/prisma');
      prisma.order.findMany.mockResolvedValue(mockOrders);

      const result = await statisticsService.getOrdersByStatus();

      expect(result).toEqual({
        NEW: 2,
        IN_PROGRESS: 1,
        COMPLETED: 1,
      });
    });
  });

  describe('getOrdersByDay', () => {
    it('should group orders by date', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.order.findMany.mockResolvedValue([
        { createdAt: new Date('2026-01-15T10:00:00Z') },
        { createdAt: new Date('2026-01-15T14:00:00Z') },
        { createdAt: new Date('2026-01-16T09:00:00Z') },
      ]);

      const result = await statisticsService.getOrdersByDay('month');

      expect(result).toHaveLength(2);
      expect(result[0].count).toBe(2);
      expect(result[1].count).toBe(1);
    });

    it('should return empty array when no orders', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.order.findMany.mockResolvedValue([]);

      const result = await statisticsService.getOrdersByDay('week');

      expect(result).toEqual([]);
    });
  });

  describe('getRecentOrders', () => {
    it('should return recent orders with limit', async () => {
      const { prisma } = require('@/lib/prisma');
      const mockOrders = [
        { id: '1', clientName: 'Test', assignedUser: { name: 'Admin' } },
      ];
      prisma.order.findMany.mockResolvedValue(mockOrders);

      const result = await statisticsService.getRecentOrders(5);

      expect(result).toEqual(mockOrders);
      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 5 })
      );
    });
  });

  describe('getDashboardStats — with data', () => {
    it('should calculate averages correctly', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.order.count
        .mockResolvedValueOnce(5)   // newOrders
        .mockResolvedValueOnce(3)   // inProgress
        .mockResolvedValueOnce(2)   // completed
        .mockResolvedValueOnce(10)  // total
        .mockResolvedValueOnce(10); // calculations
      prisma.order.findMany.mockResolvedValue([
        { calculatedCost: 100000 },
        { calculatedCost: 200000 },
      ]);

      const result = await statisticsService.getDashboardStats('month');

      expect(result.newOrders).toBe(5);
      expect(result.totalRevenue).toBe(300000);
      expect(result.averageOrderCost).toBe(150000);
      expect(result.conversionRate).toBe(20);
    });

    it('should handle zero total orders for conversion rate', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.order.count
        .mockResolvedValue(0);
      prisma.order.findMany.mockResolvedValue([]);

      const result = await statisticsService.getDashboardStats('day');

      expect(result.conversionRate).toBe(0);
      expect(result.averageOrderCost).toBe(0);
    });
  });

  describe('getStatisticsByPeriod', () => {
    it('should return comprehensive statistics', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.order.findMany
        .mockResolvedValueOnce([{ calculatedCost: 100000, serviceType: 'fence', status: 'NEW' }])
        .mockResolvedValueOnce([{ calculatedCost: 100000 }]) // completed
        .mockResolvedValueOnce([]) // inProgress
        .mockResolvedValueOnce([]); // cancelled

      const result = await statisticsService.getStatisticsByPeriod('month');

      expect(result.total).toBe(1);
      expect(result.byStatus.new).toBe(1);
      expect(result.byStatus.completed).toBe(1);
      expect(result.totalRevenue).toBe(100000);
      expect(result.averageCheck).toBe(100000);
    });
  });
});
