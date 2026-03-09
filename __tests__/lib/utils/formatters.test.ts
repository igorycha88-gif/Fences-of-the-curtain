import { describe, it, expect } from '@jest/globals';
import { formatDimension, formatPrice, formatSection, formatInteger } from '@/lib/utils/formatters';

describe('Formatters', () => {
  describe('formatDimension', () => {
    it('should format number with 1 decimal place', () => {
      expect(formatDimension(2.5)).toBe('2.5');
      expect(formatDimension(2.0)).toBe('2.0');
      expect(formatDimension(3.14159)).toBe('3.1');
    });

    it('should return "-" for null', () => {
      expect(formatDimension(null)).toBe('-');
    });

    it('should return "-" for undefined', () => {
      expect(formatDimension(undefined)).toBe('-');
    });
  });

  describe('formatPrice', () => {
    it('should format integer price without decimals', () => {
      expect(formatPrice(150)).toBe('150');
      expect(formatPrice(1000)).toBe('1000');
    });

    it('should format decimal price with 2 decimal places', () => {
      expect(formatPrice(150.50)).toBe('150.50');
      expect(formatPrice(99.99)).toBe('99.99');
    });

    it('should return "-" for null', () => {
      expect(formatPrice(null)).toBe('-');
    });

    it('should return "-" for undefined', () => {
      expect(formatPrice(undefined)).toBe('-');
    });
  });

  describe('formatSection', () => {
    it('should format section as "width x height"', () => {
      expect(formatSection(40, 20)).toBe('40x20');
      expect(formatSection(60, 60)).toBe('60x60');
    });

    it('should return "-" when width is null', () => {
      expect(formatSection(null, 20)).toBe('-');
    });

    it('should return "-" when height is null', () => {
      expect(formatSection(40, null)).toBe('-');
    });

    it('should return "-" when width is undefined', () => {
      expect(formatSection(undefined, 20)).toBe('-');
    });

    it('should return "-" when height is undefined', () => {
      expect(formatSection(40, undefined)).toBe('-');
    });
  });

  describe('formatInteger', () => {
    it('should format number as integer', () => {
      expect(formatInteger(60)).toBe('60');
      expect(formatInteger(60.7)).toBe('61');
    });

    it('should return "-" for null', () => {
      expect(formatInteger(null)).toBe('-');
    });

    it('should return "-" for undefined', () => {
      expect(formatInteger(undefined)).toBe('-');
    });
  });
});
