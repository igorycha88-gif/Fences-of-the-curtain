import { describe, it, expect } from '@jest/globals';
import { 
  calculateMargin, 
  getMarginColor, 
  getMarginEmoji,
  roundToTwo,
  calculateSummary
} from '@/lib/utils/marginCalculator';
import type { ExtendedEstimateItem } from '@/lib/utils/marginCalculator';

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

  describe('roundToTwo', () => {
    it('should round to 2 decimal places', () => {
      expect(roundToTwo(1.234)).toBe(1.23);
      expect(roundToTwo(1.235)).toBe(1.24);
      expect(roundToTwo(1.236)).toBe(1.24);
    });

    it('should handle integers', () => {
      expect(roundToTwo(5)).toBe(5);
      expect(roundToTwo(100)).toBe(100);
    });

    it('should handle already rounded numbers', () => {
      expect(roundToTwo(1.23)).toBe(1.23);
      expect(roundToTwo(100.5)).toBe(100.5);
    });

    it('should handle very small decimals', () => {
      expect(roundToTwo(0.001)).toBe(0);
      expect(roundToTwo(0.005)).toBe(0.01);
      expect(roundToTwo(0.009)).toBe(0.01);
    });
  });

  describe('calculateSummary', () => {
    it('should calculate summary correctly with all items having purchase prices', () => {
      const items: ExtendedEstimateItem[] = [
        {
          category: 'posts',
          nomenclatureId: '1',
          nomenclatureName: 'Столб',
          quantity: 10,
          unit: 'шт',
          pricePerUnit: 1000,
          totalPrice: 10000,
          purchasePricePerUnit: 700,
          purchaseTotal: 7000,
          marginRub: 3000,
          marginPercent: 30
        },
        {
          category: 'lags',
          nomenclatureId: '2',
          nomenclatureName: 'Лага',
          quantity: 20,
          unit: 'шт',
          pricePerUnit: 500,
          totalPrice: 10000,
          purchasePricePerUnit: 350,
          purchaseTotal: 7000,
          marginRub: 3000,
          marginPercent: 30
        }
      ];

      const summary = calculateSummary(items);

      expect(summary.retailTotal).toBe(20000);
      expect(summary.purchaseTotal).toBe(14000);
      expect(summary.marginTotalRub).toBe(6000);
      expect(summary.marginTotalPercent).toBe(30);
    });

    it('should handle items without purchase prices', () => {
      const items: ExtendedEstimateItem[] = [
        {
          category: 'posts',
          nomenclatureId: '1',
          nomenclatureName: 'Столб',
          quantity: 10,
          unit: 'шт',
          pricePerUnit: 1000,
          totalPrice: 10000,
          purchasePricePerUnit: 700,
          purchaseTotal: 7000,
          marginRub: 3000,
          marginPercent: 30
        },
        {
          category: 'mountingHardware',
          nomenclatureId: '2',
          nomenclatureName: 'Саморез',
          quantity: 100,
          unit: 'шт',
          pricePerUnit: 5,
          totalPrice: 500,
          purchasePricePerUnit: null,
          purchaseTotal: null,
          marginRub: null,
          marginPercent: null
        }
      ];

      const summary = calculateSummary(items);

      expect(summary.retailTotal).toBe(10500);
      expect(summary.purchaseTotal).toBe(7000);
      expect(summary.marginTotalRub).toBe(3000);
      expect(summary.marginTotalPercent).toBeCloseTo(28.57, 1);
    });

    it('should handle empty items array', () => {
      const summary = calculateSummary([]);

      expect(summary.retailTotal).toBe(0);
      expect(summary.purchaseTotal).toBe(0);
      expect(summary.marginTotalRub).toBe(0);
      expect(summary.marginTotalPercent).toBe(0);
    });

    it('should calculate correct margin percent', () => {
      const items: ExtendedEstimateItem[] = [
        {
          category: 'posts',
          nomenclatureId: '1',
          nomenclatureName: 'Столб',
          quantity: 10,
          unit: 'шт',
          pricePerUnit: 1000,
          totalPrice: 10000,
          purchasePricePerUnit: 500,
          purchaseTotal: 5000,
          marginRub: 5000,
          marginPercent: 50
        }
      ];

      const summary = calculateSummary(items);

      expect(summary.marginTotalPercent).toBe(50);
    });

    it('should calculate new fields: retailMaterialsTotal, worksTotal, grandTotal', () => {
      const items: ExtendedEstimateItem[] = [
        {
          category: 'posts',
          nomenclatureId: '1',
          nomenclatureName: 'Столб',
          quantity: 10,
          unit: 'шт',
          pricePerUnit: 1000,
          totalPrice: 30000,
          purchasePricePerUnit: 200,
          purchaseTotal: 20000,
          marginRub: 10000,
          marginPercent: 33.33
        },
        {
          category: 'installation',
          nomenclatureId: '2',
          nomenclatureName: 'Монтаж',
          quantity: 100,
          unit: 'м',
          pricePerUnit: 150,
          totalPrice: 15000,
          purchasePricePerUnit: null,
          purchaseTotal: null,
          marginRub: null,
          marginPercent: null
        }
      ];

      const summary = calculateSummary(items);

      expect(summary.retailMaterialsTotal).toBe(30000);
      expect(summary.worksTotal).toBe(15000);
      expect(summary.grandTotal).toBe(45000);
    });

    it('should calculate materialMargin correctly (only materials, not works)', () => {
      const items: ExtendedEstimateItem[] = [
        {
          category: 'posts',
          nomenclatureId: '1',
          nomenclatureName: 'Столб',
          quantity: 10,
          unit: 'шт',
          pricePerUnit: 1000,
          totalPrice: 30000,
          purchasePricePerUnit: 200,
          purchaseTotal: 20000,
          marginRub: 10000,
          marginPercent: 33.33
        },
        {
          category: 'installation',
          nomenclatureId: '2',
          nomenclatureName: 'Монтаж',
          quantity: 100,
          unit: 'м',
          pricePerUnit: 150,
          totalPrice: 15000,
          purchasePricePerUnit: null,
          purchaseTotal: null,
          marginRub: null,
          marginPercent: null
        }
      ];

      const summary = calculateSummary(items);

      expect(summary.purchaseMaterialsTotal).toBe(20000);
      expect(summary.materialMarginRub).toBe(10000);
      expect(summary.materialMarginPercent).toBeCloseTo(33.33, 1);
    });

    it('should return zeros for new fields when empty array', () => {
      const summary = calculateSummary([]);

      expect(summary.retailMaterialsTotal).toBe(0);
      expect(summary.purchaseMaterialsTotal).toBe(0);
      expect(summary.materialMarginRub).toBe(0);
      expect(summary.materialMarginPercent).toBe(0);
      expect(summary.worksTotal).toBe(0);
      expect(summary.grandTotal).toBe(0);
    });

    it('should calculate grandTotal correctly with only materials (no works)', () => {
      const items: ExtendedEstimateItem[] = [
        {
          category: 'posts',
          nomenclatureId: '1',
          nomenclatureName: 'Столб',
          quantity: 10,
          unit: 'шт',
          pricePerUnit: 1000,
          totalPrice: 10000,
          purchasePricePerUnit: 700,
          purchaseTotal: 7000,
          marginRub: 3000,
          marginPercent: 30
        }
      ];

      const summary = calculateSummary(items);

      expect(summary.worksTotal).toBe(0);
      expect(summary.grandTotal).toBe(10000);
    });

    it('should calculate grandTotal correctly with only works (no materials)', () => {
      const items: ExtendedEstimateItem[] = [
        {
          category: 'installation',
          nomenclatureId: '1',
          nomenclatureName: 'Монтаж',
          quantity: 100,
          unit: 'м',
          pricePerUnit: 200,
          totalPrice: 20000,
          purchasePricePerUnit: null,
          purchaseTotal: null,
          marginRub: null,
          marginPercent: null
        }
      ];

      const summary = calculateSummary(items);

      expect(summary.retailMaterialsTotal).toBe(0);
      expect(summary.worksTotal).toBe(20000);
      expect(summary.grandTotal).toBe(20000);
    });
  });
});
