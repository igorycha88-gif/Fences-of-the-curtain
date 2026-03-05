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
});
