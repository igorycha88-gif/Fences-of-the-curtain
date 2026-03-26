import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { calculatePanel3D } from '@/services/calculator/panel3DCalculator';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    panel3D: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock('@/lib/cache', () => ({
  cache: {
    get: (jest.fn as any)().mockResolvedValue(null),
    set: (jest.fn as any)().mockResolvedValue(undefined),
    del: (jest.fn as any)().mockResolvedValue(undefined),
    delPattern: (jest.fn as any)().mockResolvedValue(undefined),
    getOrSet: (jest.fn as any)().mockImplementation(async (key: string, factory: () => Promise<any>, ttl: number) => {
      return await factory();
    }),
    healthCheck: (jest.fn as any)().mockResolvedValue({ redis: false, memory: true }),
  },
}));

const mockPrisma = prisma as any;
const mockCache = require('@/lib/cache').cache as any;

describe('panel3DCalculator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculatePanel3D', () => {
    it('TC-CAL-001: should calculate panel count correctly for standard dimensions', async () => {
      const mockPanel = {
        id: 'panel1',
        name: '3D-панель 2000x2500',
        panelHeight: 2000,
        panelWidth: 2500,
        rodDiameter: 4.0,
        cellWidth: 50,
        cellHeight: 200,
        retailPricePerUnit: 5000,
      };

      mockPrisma.panel3D.findMany.mockResolvedValue([mockPanel] as any);

      const result = await calculatePanel3D(50, 2.0);

      expect(result.quantity).toBe(20);
      expect(result.totalPrice).toBe(100000);
      expect(result.category).toBe('panel3d');
    });

    it('TC-CAL-002: should round up panel count correctly', async () => {
      const mockPanel = {
        id: 'panel1',
        name: '3D-панель 2000x2500',
        panelHeight: 2000,
        panelWidth: 2500,
        rodDiameter: 4.0,
        cellWidth: 50,
        cellHeight: 200,
        retailPricePerUnit: 5000,
      };

      mockPrisma.panel3D.findMany.mockResolvedValue([mockPanel] as any);

      const result = await calculatePanel3D(45.5, 2.0);

      expect(result.quantity).toBe(19); 
    });

    it('TC-CAL-003: should calculate total price correctly', async () => {
      const mockPanel = {
        id: 'panel1',
        name: '3D-панель 2000x2500',
        panelHeight: 2000,
        panelWidth: 2500,
        rodDiameter: 4.0,
        cellWidth: 50,
        cellHeight: 200,
        retailPricePerUnit: 5000,
      };

      mockPrisma.panel3D.findMany.mockResolvedValue([mockPanel] as any);

      const result = await calculatePanel3D(50, 2.0);

      expect(result.totalPrice).toBe(100000);
      expect(result.pricePerUnit).toBe(5000);
    });

    it('TC-CAL-004: should return panel specifications', async () => {
      const mockPanel = {
        id: 'panel1',
        name: '3D-панель 2000x2500',
        panelHeight: 2000,
        panelWidth: 2500,
        rodDiameter: 4.0,
        cellWidth: 50,
        cellHeight: 200,
        retailPricePerUnit: 5000,
      };

      mockPrisma.panel3D.findMany.mockResolvedValue([mockPanel] as any);

      const result = await calculatePanel3D(50, 2.0);

      expect(result.panelHeight).toBe(2000);
      expect(result.panelWidth).toBe(2500);
    });

    it('should handle fence length correctly in mm', async () => {
      const mockPanel = {
        id: 'panel1',
        name: '3D-панель 2000x2500',
        panelHeight: 2000,
        panelWidth: 2500,
        rodDiameter: 4.0,
        cellWidth: 50,
        cellHeight: 200,
        retailPricePerUnit: 5000,
      };

      mockPrisma.panel3D.findMany.mockResolvedValue([mockPanel] as any);

      const result = await calculatePanel3D(100, 2.0);

      expect(result.quantity).toBe(40);
    });

    it('should select panel with smallest height >= required height', async () => {
      const mockPanels = [
        {
          id: 'panel1',
          name: '3D-панель 2000x2500',
          panelHeight: 2000,
          panelWidth: 2500,
          retailPricePerUnit: 5000,
          priority: 0,
        },
        {
          id: 'panel2',
          name: '3D-панель 2500x2500',
          panelHeight: 2500,
          panelWidth: 2500,
          retailPricePerUnit: 6000,
          priority: 0,
        },
      ];

      mockPrisma.panel3D.findMany.mockResolvedValue(mockPanels as any);

      const result = await calculatePanel3D(50, 2.2);

      expect(result.nomenclatureId).toBe('panel2');
      expect(result.nomenclatureName).toBe('3D-панель 2500x2500');
    });

    it('should select panel with higher priority (lower priority value)', async () => {
      const mockPanels = [
        {
          id: 'panel1',
          name: '3D-панель 2500x2500',
          panelHeight: 2500,
          panelWidth: 2500,
          retailPricePerUnit: 6000,
          priority: 0,
        },
        {
          id: 'panel2',
          name: '3D-панель 3000x2500',
          panelHeight: 3000,
          panelWidth: 2500,
          retailPricePerUnit: 7000,
          priority: 10,
        },
      ];

      mockPrisma.panel3D.findMany.mockResolvedValue(mockPanels as any);

      const result = await calculatePanel3D(50, 2.2);

      expect(result.nomenclatureId).toBe('panel1');
      expect(result.nomenclatureName).toBe('3D-панель 2500x2500');
    });

    it('TC-NEG-011: should throw error when no panel found', async () => {
      mockPrisma.panel3D.findMany.mockResolvedValue([]);

      await expect(calculatePanel3D(50, 10.0)).rejects.toEqual({
        error: 'NO_PANEL_3D_FOUND',
        message: 'Не найдена 3D-панель требуемой высоты',
        details: {
          requiredHeight: 10000,
          requiredWidth: 50000,
          suggestion: 'Попробуйте выбрать другую высоту забора или свяжитесь с нами',
        },
      });
    });

    it('should only select active panels', async () => {
      const mockPanels = [
        {
          id: 'panel1',
          name: '3D-панель 2000x2500',
          panelHeight: 2000,
          panelWidth: 2500,
          retailPricePerUnit: 5000,
          active: true,
        },
        {
          id: 'panel2',
          name: '3D-панель 2000x2500 (inactive)',
          panelHeight: 2000,
          panelWidth: 2500,
          retailPricePerUnit: 5000,
          active: false,
        },
      ];

      mockPrisma.panel3D.findMany.mockResolvedValue(mockPanels as any);

      const result = await calculatePanel3D(50, 2.0);

      expect(result.nomenclatureId).toBe('panel1');
    });

    it('should respect validUntil date', async () => {
      const mockPanels = [
        {
          id: 'panel1',
          name: '3D-панель 2000x2500',
          panelHeight: 2000,
          panelWidth: 2500,
          retailPricePerUnit: 5000,
          validUntil: new Date('2026-01-01'),
        },
      ];

      mockPrisma.panel3D.findMany.mockResolvedValue([]);

      await expect(calculatePanel3D(50, 2.0)).rejects.toEqual({
        error: 'NO_PANEL_3D_FOUND',
        message: 'Не найдена 3D-панель требуемой высоты',
        details: {
          requiredHeight: 2000,
          requiredWidth: 50000,
          suggestion: 'Попробуйте выбрать другую высоту забора или свяжитесь с нами',
        },
      });
    });

    it('should select exact match when available', async () => {
      const mockPanels = [
        {
          id: 'panel1',
          name: '3D-панель 2000x2500',
          panelHeight: 2000,
          panelWidth: 2500,
          retailPricePerUnit: 5000,
          priority: 0,
        },
        {
          id: 'panel2',
          name: '3D-панель 2500x2500',
          panelHeight: 2500,
          panelWidth: 2500,
          retailPricePerUnit: 6000,
          priority: 0,
        },
      ];

      mockPrisma.panel3D.findMany.mockResolvedValue(mockPanels as any);

      const result = await calculatePanel3D(50, 2.0);

      expect(result.nomenclatureId).toBe('panel1');
      expect(result.nomenclatureName).toBe('3D-панель 2000x2500');
    });

    it('should select higher panel when exact match not available', async () => {
      const mockPanels = [
        {
          id: 'panel1',
          name: '3D-панель 2500x2500',
          panelHeight: 2500,
          panelWidth: 2500,
          retailPricePerUnit: 6000,
          priority: 0,
        },
        {
          id: 'panel2',
          name: '3D-панель 3000x2500',
          panelHeight: 3000,
          panelWidth: 2500,
          retailPricePerUnit: 7000,
          priority: 10,
        },
      ];

      mockPrisma.panel3D.findMany.mockResolvedValue(mockPanels as any);

      const result = await calculatePanel3D(50, 2.2);

      expect(result.nomenclatureId).toBe('panel1');
      expect(result.nomenclatureName).toBe('3D-панель 2500x2500');
    });

    it('should select panel with higher priority (lower value) among exact matches', async () => {
      const mockPanels = [
        {
          id: 'panel1',
          name: '3D-панель 2000x2500 low priority',
          panelHeight: 2000,
          panelWidth: 2500,
          retailPricePerUnit: 5000,
          priority: 10,
        },
        {
          id: 'panel2',
          name: '3D-панель 2000x2500 high priority',
          panelHeight: 2000,
          panelWidth: 2500,
          retailPricePerUnit: 5000,
          priority: 0,
        },
      ];

      mockPrisma.panel3D.findMany.mockResolvedValue(mockPanels as any);

      const result = await calculatePanel3D(50, 2.0);

      expect(result.nomenclatureId).toBe('panel2');
      expect(result.nomenclatureName).toBe('3D-панель 2000x2500 high priority');
    });

    it('should select panel with higher priority among higher panels', async () => {
      const mockPanels = [
        {
          id: 'panel1',
          name: '3D-панель 2500x2500 low priority',
          panelHeight: 2500,
          panelWidth: 2500,
          retailPricePerUnit: 6000,
          priority: 10,
        },
        {
          id: 'panel2',
          name: '3D-панель 3000x2500 high priority',
          panelHeight: 3000,
          panelWidth: 2500,
          retailPricePerUnit: 7000,
          priority: 0,
        },
      ];

      mockPrisma.panel3D.findMany.mockResolvedValue(mockPanels as any);

      const result = await calculatePanel3D(50, 2.2);

      expect(result.nomenclatureId).toBe('panel2');
      expect(result.nomenclatureName).toBe('3D-панель 3000x2500 high priority');
    });
  });
});
