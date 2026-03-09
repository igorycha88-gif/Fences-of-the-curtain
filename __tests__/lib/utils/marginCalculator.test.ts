import { describe, it, expect } from '@jest/globals';
import { calculateMargin, getMarginColor, getMarginEmoji } from '@/lib/utils/marginCalculator';

describe('Margin Calculator', () => {
  describe('calculateMargin', () => {
    it('should calculate margin correctly', () => {
      const result = calculateMargin(150, 120);
      expect(result).not.toBeNull();
      expect(result!.marginPercent).toBe(20.0);
      expect(result!.marginAbsolute).toBe(30);
    });

    it('should return null when purchase price is null', () => {
      const result = calculateMargin(150, null);
      expect(result).toBeNull();
    });

    it('should return null when purchase price is undefined', () => {
      const result = calculateMargin(150, undefined);
      expect(result).toBeNull();
    });

    it('should return negative margin when purchase > sale', () => {
      const result = calculateMargin(100, 120);
      expect(result).not.toBeNull();
      expect(result!.marginPercent).toBe(-20.0);
      expect(result!.marginAbsolute).toBe(-20);
    });

    it('should return 0 margin when prices are equal', () => {
      const result = calculateMargin(100, 100);
      expect(result).not.toBeNull();
      expect(result!.marginPercent).toBe(0);
      expect(result!.marginAbsolute).toBe(0);
    });

    it('should handle decimal values correctly', () => {
      const result = calculateMargin(149.99, 120.50);
      expect(result).not.toBeNull();
      expect(result!.marginPercent).toBeCloseTo(19.66, 1);
      expect(result!.marginAbsolute).toBeCloseTo(29.49, 1);
    });

    it('should return 0 percent when sale price is 0', () => {
      const result = calculateMargin(0, 100);
      expect(result).not.toBeNull();
      expect(result!.marginPercent).toBe(0);
      expect(result!.marginAbsolute).toBe(-100);
    });

    it('should round results to 2 decimal places', () => {
      const result = calculateMargin(150, 120.123);
      expect(result).not.toBeNull();
      expect(result!.marginAbsolute).toBe(29.88);
    });
  });

  describe('getMarginColor', () => {
    it('should return green for margin >= 30%', () => {
      expect(getMarginColor(30)).toBe('green');
      expect(getMarginColor(35)).toBe('green');
      expect(getMarginColor(100)).toBe('green');
    });

    it('should return yellow for margin between 10-30%', () => {
      expect(getMarginColor(10)).toBe('yellow');
      expect(getMarginColor(15)).toBe('yellow');
      expect(getMarginColor(29.9)).toBe('yellow');
    });

    it('should return red for margin < 10%', () => {
      expect(getMarginColor(9.9)).toBe('red');
      expect(getMarginColor(5)).toBe('red');
      expect(getMarginColor(0)).toBe('red');
      expect(getMarginColor(-10)).toBe('red');
    });

    it('should return gray for null margin', () => {
      expect(getMarginColor(null)).toBe('gray');
    });
  });

  describe('getMarginEmoji', () => {
    it('should return green circle for margin >= 30%', () => {
      expect(getMarginEmoji(30)).toBe('🟢');
      expect(getMarginEmoji(35)).toBe('🟢');
    });

    it('should return yellow circle for margin between 10-30%', () => {
      expect(getMarginEmoji(10)).toBe('🟡');
      expect(getMarginEmoji(20)).toBe('🟡');
    });

    it('should return red circle for margin < 10%', () => {
      expect(getMarginEmoji(5)).toBe('🔴');
      expect(getMarginEmoji(0)).toBe('🔴');
      expect(getMarginEmoji(-10)).toBe('🔴');
    });

    it('should return white circle for null margin', () => {
      expect(getMarginEmoji(null)).toBe('⚪');
    });
  });
});
