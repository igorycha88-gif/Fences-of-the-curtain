import { describe, it, expect } from '@jest/globals';
import {
  isApiError,
  handleApiListResponse,
} from '@/lib/utils/apiResponse';

describe('ApiResponse Utilities', () => {
  describe('isApiError', () => {
    it('should return true for error response with string error', () => {
      expect(isApiError({ error: 'Something went wrong' })).toBe(true);
    });

    it('should return true for error response with array error', () => {
      expect(isApiError({ error: ['Error 1', 'Error 2'] })).toBe(true);
    });

    it('should return false for normal response without error', () => {
      expect(isApiError({ items: [], total: 0 })).toBe(false);
    });

    it('should return falsy for null', () => {
      expect(isApiError(null)).toBeFalsy();
    });

    it('should return falsy for undefined', () => {
      expect(isApiError(undefined)).toBeFalsy();
    });

    it('should return false for string', () => {
      expect(isApiError('error')).toBe(false);
    });

    it('should return false for empty object without error key', () => {
      expect(isApiError({})).toBe(false);
    });
  });

  describe('handleApiListResponse', () => {
    it('should handle normal response with items', () => {
      const response = {
        items: [{ id: '1', name: 'Test' }],
        total: 1,
        page: 1,
        pageSize: 20,
      };
      const result = handleApiListResponse(response);
      expect(result.items).toEqual([{ id: '1', name: 'Test' }]);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);
    });

    it('should handle error response', () => {
      const response = { error: 'Server error' };
      const result = handleApiListResponse(response);
      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should handle error response with custom default items', () => {
      const response = { error: 'Not found' };
      const defaults = [{ id: 'default', name: 'Default' }];
      const result = handleApiListResponse(response, defaults);
      expect(result.items).toEqual(defaults);
    });

    it('should handle response with panel3d key', () => {
      const response = {
        panel3d: [{ id: '1', name: 'Panel' }],
        total: 1,
      };
      const result = handleApiListResponse(response);
      expect(result.items).toEqual([{ id: '1', name: 'Panel' }]);
    });

    it('should use default values when response has no pagination', () => {
      const response = {
        items: [{ id: '1' }],
      };
      const result = handleApiListResponse(response);
      expect(result.total).toBe(0);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);
    });

    it('should fallback to defaultItems when no items or panel3d', () => {
      const response = { total: 0 };
      const defaults = [{ id: 'fallback' }];
      const result = handleApiListResponse(response, defaults);
      expect(result.items).toEqual(defaults);
    });

    it('should prefer items over panel3d', () => {
      const response = {
        items: [{ id: 'from-items' }],
        panel3d: [{ id: 'from-panel3d' }],
      };
      const result = handleApiListResponse(response);
      expect(result.items).toEqual([{ id: 'from-items' }]);
    });
  });
});
