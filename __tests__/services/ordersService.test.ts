import { ordersService } from '@/services/admin/ordersService';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    order: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    adminActionLog: {
      create: jest.fn(),
    },
  },
}));

describe('OrdersService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getOrders', () => {
    it('should return orders with pagination', async () => {
      const mockOrders = [
        {
          id: '1',
          clientName: 'Иван Иванов',
          phone: '+79001234567',
          serviceType: 'fence',
          calculatedCost: 100000,
          status: 'NEW',
          createdAt: new Date('2026-03-01'),
        },
      ];
      const { prisma } = require('@/lib/prisma');
      prisma.order.findMany.mockResolvedValue(mockOrders);
      prisma.order.count.mockResolvedValue(1);

      const result = await ordersService.getOrders({ page: 1, pageSize: 20 });

      expect(result.orders).toEqual(mockOrders);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
    });

    it('should filter by status', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.order.findMany.mockResolvedValue([]);
      prisma.order.count.mockResolvedValue(0);

      await ordersService.getOrders({ status: 'NEW' });

      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'NEW',
          }),
        })
      );
    });
  });

  describe('updateOrder', () => {
    it('should update order status', async () => {
      const mockOrder = {
        id: '1',
        clientName: 'Иван Иванов',
        phone: '+79001234567',
        serviceType: 'fence',
        calculatedCost: 100000,
        status: 'NEW',
        createdAt: new Date('2026-03-01'),
      };
      const { prisma } = require('@/lib/prisma');
      prisma.order.findUnique.mockResolvedValue(mockOrder);
      prisma.order.update.mockResolvedValue({ ...mockOrder, status: 'IN_PROGRESS' });

      const result = await ordersService.updateOrder('1', { status: 'IN_PROGRESS' }, 'user-id');

      expect(result.status).toBe('IN_PROGRESS');
    });
  });
});
