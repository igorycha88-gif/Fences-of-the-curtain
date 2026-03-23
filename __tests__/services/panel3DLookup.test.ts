import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { findPanel3DByHeight } from '@/services/calculator/panel3DLookup';

jest.mock('@/services/calculator/panel3DLookup');

describe('panel3DLookup', () => {
  const mockFindPanel3DByHeight = findPanel3DByHeight as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('findPanel3DByHeight', () => {
    it('should call findPanel3DByHeight with correct parameters', async () => {
      mockFindPanel3DByHeight.mockResolvedValue({
        id: 'panel1',
        name: '3D-панель 2000x2500',
        height: 2000,
        width: 2500,
        rodDiameter: 4.0,
        cellWidth: 50,
        cellHeight: 200,
        retailPricePerUnit: 5000,
      });

      const result = await findPanel3DByHeight(2000);

      expect(mockFindPanel3DByHeight).toHaveBeenCalledWith(2000);
      expect(result).toEqual({
        id: 'panel1',
        name: '3D-панель 2000x2500',
        height: 2000,
        width: 2500,
        rodDiameter: 4.0,
        cellWidth: 50,
        cellHeight: 200,
        retailPricePerUnit: 5000,
      });
    });

    it('should throw error when no panel found', async () => {
      const mockError = {
        error: 'NO_PANEL_3D_FOUND',
        message: 'Не найдена 3D-панель с указанной высотой',
        details: {
          requiredHeight: 2000,
          suggestion: 'Попробуйте выбрать другую высоту или свяжитесь с нами',
        },
      };

      mockFindPanel3DByHeight.mockRejectedValue(mockError);

      await expect(findPanel3DByHeight(2000)).rejects.toEqual(mockError);
    });
  });
});
