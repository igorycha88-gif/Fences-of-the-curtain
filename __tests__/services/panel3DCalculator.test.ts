import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { calculatePanel3D } from '@/services/calculator/panel3DCalculator';
import { prisma } from '@/lib/prisma';
import { findPanel3DByHeight } from '@/services/calculator/panel3DLookup';

jest.mock('@/lib/prisma');
jest.mock('@/services/calculator/panel3DLookup');

describe('panel3DCalculator', () => {
  const mockPrisma = prisma as any;
  const mockFindPanel3DByHeight = findPanel3DByHeight as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('calculatePanel3D', () => {
    it('should calculate panel count correctly for standard dimensions', async () => {
      const mockPanel = {
        id: 'panel1',
        name: '3D-панель 2000x2500',
        height: 2000,
        width: 2500,
        rodDiameter: 4.0,
        cellWidth: 50,
        cellHeight: 200,
        retailPricePerUnit: 5000,
      };

      mockFindPanel3DByHeight.mockResolvedValue(mockPanel);

      const result = await calculatePanel3D(50, 2.0);

      expect(mockFindPanel3DByHeight).toHaveBeenCalledWith(2000);
      expect(result).toEqual({
        category: 'panels3d',
        nomenclatureId: 'panel1',
        nomenclatureName: '3D-панель 2000x2500',
        quantity: 20,
        unit: 'шт',
        pricePerUnit: 5000,
        totalPrice: 100000,
        specifications: {
          height: 2000,
          width: 2500,
          rodDiameter: 4.0,
          cellWidth: 50,
          cellHeight: 200,
        },
      });
    });

    it('should round up panel count correctly', async () => {
      const mockPanel = {
        id: 'panel1',
        name: '3D-панель 2000x2500',
        height: 2000,
        width: 2500,
        rodDiameter: 4.0,
        cellWidth: 50,
        cellHeight: 200,
        retailPricePerUnit: 5000,
      };

      mockFindPanel3DByHeight.mockResolvedValue(mockPanel);

      const result = await calculatePanel3D(45.5, 2.0);

      expect(result.quantity).toBe(19);
    });

    it('should calculate total price correctly', async () => {
      const mockPanel = {
        id: 'panel1',
        name: '3D-панель 2000x2500',
        height: 2000,
        width: 2500,
        rodDiameter: 4.0,
        cellWidth: 50,
        cellHeight: 200,
        retailPricePerUnit: 5000,
      };

      mockFindPanel3DByHeight.mockResolvedValue(mockPanel);

      const result = await calculatePanel3D(50, 2.0);

      expect(result.totalPrice).toBe(100000);
      expect(result.pricePerUnit).toBe(5000);
    });

    it('should include panel specifications in result', async () => {
      const mockPanel = {
        id: 'panel1',
        name: '3D-панель 2000x2500',
        height: 2000,
        width: 2500,
        rodDiameter: 4.0,
        cellWidth: 50,
        cellHeight: 200,
        retailPricePerUnit: 5000,
      };

      mockFindPanel3DByHeight.mockResolvedValue(mockPanel);

      const result = await calculatePanel3D(50, 2.0);

      expect(result.specifications).toEqual({
        height: 2000,
        width: 2500,
        rodDiameter: 4.0,
        cellWidth: 50,
        cellHeight: 200,
      });
    });

    it('should handle different fence heights', async () => {
      const mockPanel2500 = {
        id: 'panel1',
        name: '3D-панель 2500x2500',
        height: 2500,
        width: 2500,
        rodDiameter: 4.0,
        cellWidth: 50,
        cellHeight: 200,
        retailPricePerUnit: 6000,
      };

      mockFindPanel3DByHeight.mockResolvedValue(mockPanel2500);

      const result = await calculatePanel3D(50, 2.5);

      expect(mockFindPanel3DByHeight).toHaveBeenCalledWith(2500);
      expect(result.nomenclatureId).toBe('panel1');
      expect(result.nomenclatureName).toBe('3D-панель 2500x2500');
    });

    it('should throw error when panel lookup fails', async () => {
      const mockError = {
        error: 'NO_PANEL_3D_FOUND',
        message: 'Не найдена 3D-панель с указанной высотой',
        details: {
          requiredHeight: 2000,
          suggestion: 'Попробуйте выбрать другую высоту или свяжитесь с нами',
        },
      };

      mockFindPanel3DByHeight.mockRejectedValue(mockError);

      await expect(calculatePanel3D(50, 2.0)).rejects.toEqual(mockError);
    });

    it('should handle fence length correctly in mm', async () => {
      const mockPanel = {
        id: 'panel1',
        name: '3D-панель 2000x2500',
        height: 2000,
        width: 2500,
        rodDiameter: 4.0,
        cellWidth: 50,
        cellHeight: 200,
        retailPricePerUnit: 5000,
      };

      mockFindPanel3DByHeight.mockResolvedValue(mockPanel);

      const result = await calculatePanel3D(100, 2.0);

      expect(result.quantity).toBe(40);
    });
  });
});
