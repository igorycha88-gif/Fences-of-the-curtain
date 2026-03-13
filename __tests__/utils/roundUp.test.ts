import { describe, it, expect } from '@jest/globals';
import { roundUp } from '@/lib/utils/roundUp';

describe('roundUp', () => {
  it('should round up decimal numbers', () => {
    expect(roundUp(1.1)).toBe(2);
    expect(roundUp(1.5)).toBe(2);
    expect(roundUp(1.9)).toBe(2);
    expect(roundUp(0.1)).toBe(1);
  });

  it('should not change whole numbers', () => {
    expect(roundUp(1)).toBe(1);
    expect(roundUp(10)).toBe(10);
    expect(roundUp(100)).toBe(100);
  });

  it('should handle zero', () => {
    expect(roundUp(0)).toBe(0);
  });

  it('should handle large numbers', () => {
    expect(roundUp(16.6666666667)).toBe(17);
    expect(roundUp(43.4782608696)).toBe(44);
  });
});
