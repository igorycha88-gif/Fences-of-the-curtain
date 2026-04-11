import { ordersService } from '@/services/admin/ordersService';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    order: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    adminActionLog: {
      create: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    postType: {
      findUnique: jest.fn(),
    },
    lagType: {
      findUnique: jest.fn(),
    },
    profnastilType: {
      findUnique: jest.fn(),
    },
    picketType: {
      findUnique: jest.fn(),
    },
    gateType: {
      findUnique: jest.fn(),
    },
    wicketType: {
      findUnique: jest.fn(),
    },
    mountingHardware: {
      findUnique: jest.fn(),
    },
    fenceEstimate: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    fenceType: {
      findMany: jest.fn(),
    },
    multiFenceEstimate: {
      findFirst: jest.fn(),
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
          statusLabel: 'Новая',
          createdAt: new Date('2026-03-01'),
        },
      ];
      const { prisma } = require('@/lib/prisma');
      prisma.order.findMany.mockResolvedValue(mockOrders);
      prisma.order.count.mockResolvedValue(1);

      const result = await ordersService.getOrders({ page: 1, pageSize: 20 });

      expect(result.orders).toHaveLength(1);
      expect(result.orders[0].id).toBe('1');
      expect(result.orders[0].statusLabel).toBe('Новая');
      expect(result.orders[0].isIndividualRequest).toBe(false);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
    });

    it('should mark individual requests', async () => {
      const mockOrders = [
        {
          id: '1',
          clientName: 'Иван Иванов',
          phone: '+79001234567',
          serviceType: 'INDIVIDUAL_CALCULATION',
          calculatedCost: 0,
          status: 'NEW',
          statusLabel: 'Новая',
          createdAt: new Date('2026-03-01'),
        },
      ];
      const { prisma } = require('@/lib/prisma');
      prisma.order.findMany.mockResolvedValue(mockOrders);
      prisma.order.count.mockResolvedValue(1);

      const result = await ordersService.getOrders({ page: 1, pageSize: 20 });

      expect(result.orders[0].isIndividualRequest).toBe(true);
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
      prisma.order.update.mockResolvedValue({ ...mockOrder, status: 'ESTIMATE_APPROVAL' });

      prisma.user.findUnique.mockResolvedValue({ id: 'user-id', name: 'Менеджер' });

      const result = await ordersService.updateOrder('1', { status: 'ESTIMATE_APPROVAL' }, 'user-id');

      expect(result.status).toBe('ESTIMATE_APPROVAL');
    });
  });

  describe('getOrderFull', () => {
    it('should return order with statusHistory containing data for current status', async () => {
      const mockOrder = {
        id: 'order1',
        clientName: 'Иван Иванов',
        phone: '+7 (900) 123-45-67',
        email: 'test@example.com',
        serviceType: 'fence',
        status: 'PRODUCTION',
        calculatedCost: 165000,
        createdAt: new Date('2026-03-15'),
        updatedAt: new Date('2026-03-17'),
        measurementAddress: 'г. Москва, ул. Ленина, д. 10',
        measurementDate: new Date('2026-03-20'),
        cancellationReason: null,
        completionDate: null,
        assignedTo: null,
        parameters: {},
        statusHistory: [
          {
            status: 'NEW',
            changedAt: '2026-03-15T10:30:00Z',
            changedBy: 'system',
            changedByName: 'Система',
            data: {},
          },
          {
            status: 'PRODUCTION',
            changedAt: '2026-03-17T14:00:00Z',
            changedBy: 'user1',
            changedByName: 'Менеджер',
            data: {
              measurementConfirmed: true,
              measurementResult: 'Объект готов к монтажу',
              adjustedCost: 170000,
            },
          },
        ],
        assignedUser: null,
        estimate: {
          id: 'estimate1',
          fenceType: { id: 'type1', name: 'Профнастил' },
          length: 50,
          height: 2,
          lagRows: 2,
          coating: 'POLYMER_SINGLE',
          hasGate: true,
          gateType: 'SWING',
          gateLength: 3,
          gateNomenclatureName: 'Ворота распашные 3м',
          hasWicket: true,
          wicketWidth: 1,
          wicketNomenclatureName: 'Калитка 1м',
          city: 'Москва',
          grandTotal: 165000,
          userId: null,
          user: null,
          sessionId: 'session123',
          ipAddress: '192.168.1.1',
          userAgent: 'Chrome/120',
          createdAt: new Date('2026-03-15'),
          items: [],
        },
      };

      const { prisma } = require('@/lib/prisma');
      prisma.order.findFirst.mockResolvedValue(mockOrder);

      const result = await ordersService.getOrderFull('order1', 'MANAGER');

      expect(result).not.toBeNull();
      expect(result!.order.status).toBe('PRODUCTION');
      expect(result!.order.statusHistory).toHaveLength(2);
      
      const productionEntry = result!.order.statusHistory.find(h => h.status === 'PRODUCTION');
      expect(productionEntry).toBeDefined();
      expect(productionEntry!.data.measurementConfirmed).toBe(true);
      expect(productionEntry!.data.measurementResult).toBe('Объект готов к монтажу');
      expect(productionEntry!.data.adjustedCost).toBe(170000);
    });

    it('should NOT include purchase prices for MANAGER', async () => {
      const mockOrder = {
        id: 'order1',
        clientName: 'Иван Иванов',
        phone: '+7 (900) 123-45-67',
        email: 'test@example.com',
        serviceType: 'fence',
        status: 'PRODUCTION',
        calculatedCost: 165000,
        createdAt: new Date('2026-03-15'),
        updatedAt: new Date('2026-03-17'),
        measurementAddress: null,
        measurementDate: null,
        cancellationReason: null,
        completionDate: null,
        assignedTo: null,
        parameters: {},
        statusHistory: [],
        assignedUser: null,
        estimate: {
          id: 'estimate1',
          fenceType: { id: 'type1', name: 'Профнастил' },
          length: 50,
          height: 2,
          lagRows: 2,
          coating: 'POLYMER_SINGLE',
          hasGate: false,
          gateType: null,
          gateLength: null,
          gateNomenclatureName: null,
          hasWicket: false,
          wicketWidth: null,
          wicketNomenclatureName: null,
          city: 'Москва',
          grandTotal: 165000,
          userId: null,
          user: null,
          sessionId: null,
          ipAddress: null,
          userAgent: null,
          createdAt: new Date('2026-03-15'),
          items: [
            {
              category: 'posts',
              nomenclatureId: 'post1',
              nomenclatureName: 'Столб 60×60×2 мм',
              quantity: 21,
              unit: 'шт',
              pricePerUnit: 1428.57,
              totalPrice: 30000,
              purchasePricePerUnit: 950,
              purchaseTotal: 19950,
              marginRub: 10050,
              marginPercent: 33.5,
            },
          ],
        },
      };

      const { prisma } = require('@/lib/prisma');
      prisma.order.findFirst.mockResolvedValue(mockOrder);

      const result = await ordersService.getOrderFull('order1', 'MANAGER');

      expect(result).not.toBeNull();
      expect(result!.showPurchasePrices).toBe(false);
      expect(result!.estimate).toBeDefined();
      expect(result!.estimate!.purchaseTotal).toBeUndefined();
      expect(result!.estimate!.materialMarginRub).toBeUndefined();
      expect(result!.estimate!.materialMarginPercent).toBeUndefined();
      expect(result!.estimate!.items[0].purchasePricePerUnit).toBeUndefined();
      expect(result!.estimate!.items[0].purchaseTotal).toBeUndefined();
      expect(result!.estimate!.items[0].marginRub).toBeUndefined();
      expect(result!.estimate!.items[0].marginPercent).toBeUndefined();
    });

    it('should include purchase prices for ADMIN', async () => {
      const mockOrder = {
        id: 'order1',
        clientName: 'Иван Иванов',
        phone: '+7 (900) 123-45-67',
        email: 'test@example.com',
        serviceType: 'fence',
        status: 'PRODUCTION',
        calculatedCost: 165000,
        createdAt: new Date('2026-03-15'),
        updatedAt: new Date('2026-03-17'),
        measurementAddress: null,
        measurementDate: null,
        cancellationReason: null,
        completionDate: null,
        assignedTo: null,
        parameters: {},
        statusHistory: [],
        assignedUser: null,
        estimate: {
          id: 'estimate1',
          fenceType: { id: 'type1', name: 'Профнастил' },
          length: 50,
          height: 2,
          lagRows: 2,
          coating: 'POLYMER_SINGLE',
          hasGate: false,
          gateType: null,
          gateLength: null,
          gateNomenclatureName: null,
          hasWicket: false,
          wicketWidth: null,
          wicketNomenclatureName: null,
          city: 'Москва',
          grandTotal: 165000,
          userId: null,
          user: null,
          sessionId: null,
          ipAddress: null,
          userAgent: null,
          createdAt: new Date('2026-03-15'),
          items: [
            {
              category: 'posts',
              nomenclatureId: 'post1',
              nomenclatureName: 'Столб 60×60×2 мм',
              quantity: 21,
              unit: 'шт',
              pricePerUnit: 1428.57,
              totalPrice: 30000,
              purchasePricePerUnit: 950,
              purchaseTotal: 19950,
              marginRub: 10050,
              marginPercent: 33.5,
            },
          ],
        },
      };

      const { prisma } = require('@/lib/prisma');
      prisma.order.findFirst.mockResolvedValue(mockOrder);
      prisma.postType.findUnique.mockResolvedValue({ purchasePricePerUnit: 950 });
      prisma.fenceEstimate.findMany.mockResolvedValue([]);

      const result = await ordersService.getOrderFull('order1', 'ADMIN');

      expect(result).not.toBeNull();
      expect(result!.showPurchasePrices).toBe(true);
      expect(result!.estimate).toBeDefined();
      expect(result!.estimate!.materialMarginRub).toBeDefined();
      expect(result!.estimate!.materialMarginPercent).toBeDefined();
      expect(result!.estimate!.items[0].purchasePricePerUnit).toBe(950);
      expect(result!.estimate!.items[0].purchaseTotal).toBe(19950);
    });

    it('should return null for non-existent order', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.order.findFirst.mockResolvedValue(null);

      const result = await ordersService.getOrderFull('nonexistent', 'ADMIN');

      expect(result).toBeNull();
    });

    it('should return order with parameters for individual request', async () => {
      const mockOrder = {
        id: 'order1',
        clientName: 'Иван Иванов',
        phone: '+7 (900) 123-45-67',
        email: 'test@example.com',
        serviceType: 'INDIVIDUAL_CALCULATION',
        status: 'NEW',
        calculatedCost: 0,
        createdAt: new Date('2026-03-15'),
        updatedAt: new Date('2026-03-17'),
        measurementAddress: null,
        measurementDate: null,
        cancellationReason: null,
        completionDate: null,
        assignedTo: null,
        parameters: {
          fenceTypeId: 'clt123',
          fenceTypeName: 'Профнастил',
          length: 50,
          height: 2.0,
          message: 'Нужен индивидуальный расчёт',
        },
        statusHistory: [],
        assignedUser: null,
        estimate: null,
      };

      const { prisma } = require('@/lib/prisma');
      prisma.order.findFirst.mockResolvedValue(mockOrder);

      const result = await ordersService.getOrderFull('order1', 'ADMIN');

      expect(result).not.toBeNull();
      expect(result!.order.serviceType).toBe('INDIVIDUAL_CALCULATION');
      expect(result!.order.parameters).toEqual(mockOrder.parameters);
      expect(result!.estimate).toBeNull();
    });
  });
});
