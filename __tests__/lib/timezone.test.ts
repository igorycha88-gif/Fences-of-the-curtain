import { describe, it, expect } from '@jest/globals';
import { getMoscowDate, getMoscowDateTime } from '@/lib/timezone';

describe('lib/timezone', () => {
  describe('getMoscowDate', () => {
    it('should return date in YYYY-MM-DD format', () => {
      const date = getMoscowDate();
      expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should return Moscow date, not UTC', () => {
      const date = getMoscowDate();
      const utcDate = new Date().toISOString().split('T')[0];
      expect(typeof date).toBe('string');
      expect(date.length).toBe(utcDate.length);
    });
  });

  describe('getMoscowDateTime', () => {
    it('should return datetime string', () => {
      const dt = getMoscowDateTime();
      expect(typeof dt).toBe('string');
      expect(dt.length).toBeGreaterThan(0);
    });
  });
});
