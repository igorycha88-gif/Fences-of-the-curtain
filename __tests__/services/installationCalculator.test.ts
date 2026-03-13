import { describe, it, expect } from '@jest/globals';
import { calculateInstallation } from '@/services/calculator/installationCalculator';

describe('installationCalculator', () => {
  it('should calculate installation cost correctly', () => {
    const result = calculateInstallation(50);

    expect(result.category).toBe('installation');
    expect(result.nomenclatureId).toBeNull();
    expect(result.nomenclatureName).toBe('Монтаж забора');
    expect(result.quantity).toBe(50);
    expect(result.unit).toBe('м.п.');
    expect(result.pricePerUnit).toBe(1200);
    expect(result.totalPrice).toBe(60000);
  });

  it('should calculate for 100 meters', () => {
    const result = calculateInstallation(100);

    expect(result.quantity).toBe(100);
    expect(result.totalPrice).toBe(120000);
  });

  it('should calculate for 1 meter', () => {
    const result = calculateInstallation(1);

    expect(result.quantity).toBe(1);
    expect(result.totalPrice).toBe(1200);
  });
});
