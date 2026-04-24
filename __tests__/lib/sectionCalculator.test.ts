import { describe, it, expect } from '@jest/globals';
import { calculateSectionProperties } from '@/lib/sectionCalculator';

describe('SectionCalculator', () => {
  describe('calculateSectionProperties', () => {
    it('should calculate properties for standard rectangular profile 60x40x3', () => {
      const result = calculateSectionProperties(60, 40, 3);

      expect(result.sectionArea).toBeGreaterThan(0);
      expect(result.momentOfInertiaX).toBeGreaterThan(0);
      expect(result.momentOfInertiaY).toBeGreaterThan(0);
      expect(result.sectionModulusX).toBeGreaterThan(0);
      expect(result.sectionModulusY).toBeGreaterThan(0);
      expect(result.radiusOfGyrationX).toBeGreaterThan(0);
      expect(result.radiusOfGyrationY).toBeGreaterThan(0);
      expect(result.weightPerMeter).toBeGreaterThan(0);
    });

    it('should calculate section area correctly for 60x40x3', () => {
      const result = calculateSectionProperties(60, 40, 3);
      const W = 60, H = 40, t = 3;
      const expectedArea = 2 * (W + H - 2 * t) * t / 100;
      expect(result.sectionArea).toBeCloseTo(expectedArea, 1);
    });

    it('should calculate moment of inertia X correctly', () => {
      const W = 60, H = 40, t = 3;
      const result = calculateSectionProperties(W, H, t);
      const Wi = W - 2 * t;
      const Hi = H - 2 * t;
      const expectedIx = Math.max(0, (Math.pow(H, 3) * W - Math.pow(Hi, 3) * Wi) / 12 / 10000);
      expect(result.momentOfInertiaX).toBeCloseTo(expectedIx, 1);
    });

    it('should calculate moment of inertia Y correctly', () => {
      const W = 60, H = 40, t = 3;
      const result = calculateSectionProperties(W, H, t);
      const Wi = W - 2 * t;
      const Hi = H - 2 * t;
      const expectedIy = Math.max(0, (Math.pow(W, 3) * H - Math.pow(Wi, 3) * Hi) / 12 / 10000);
      expect(result.momentOfInertiaY).toBeCloseTo(expectedIy, 1);
    });

    it('should calculate section modulus X correctly', () => {
      const W = 60, H = 40, t = 3;
      const result = calculateSectionProperties(W, H, t);
      const Wi = W - 2 * t;
      const Hi = H - 2 * t;
      const Ix = (Math.pow(H, 3) * W - Math.pow(Hi, 3) * Wi) / 12 / 10000;
      const expectedWx = Ix / (H / 200);
      expect(result.sectionModulusX).toBeCloseTo(expectedWx, 1);
    });

    it('should calculate section modulus Y correctly', () => {
      const W = 60, H = 40, t = 3;
      const result = calculateSectionProperties(W, H, t);
      const Wi = W - 2 * t;
      const Hi = H - 2 * t;
      const Iy = (Math.pow(W, 3) * H - Math.pow(Wi, 3) * Hi) / 12 / 10000;
      const expectedWy = Iy / (W / 200);
      expect(result.sectionModulusY).toBeCloseTo(expectedWy, 1);
    });

    it('should calculate radius of gyration X correctly', () => {
      const W = 60, H = 40, t = 3;
      const result = calculateSectionProperties(W, H, t);
      expect(result.radiusOfGyrationX).toBeGreaterThan(0);
      expect(result.radiusOfGyrationX).toBeLessThan(H);
    });

    it('should calculate radius of gyration Y correctly', () => {
      const W = 60, H = 40, t = 3;
      const result = calculateSectionProperties(W, H, t);
      expect(result.radiusOfGyrationY).toBeGreaterThan(0);
      expect(result.radiusOfGyrationY).toBeLessThan(W);
    });

    it('should calculate weight per meter correctly', () => {
      const result = calculateSectionProperties(60, 40, 3);
      const expectedWeight = result.sectionArea * 100 * 7.85 / 100;
      expect(result.weightPerMeter).toBeCloseTo(expectedWeight, 1);
    });

    it('should return rounded values to 2 decimal places', () => {
      const result = calculateSectionProperties(60, 40, 3);
      for (const val of Object.values(result)) {
        const rounded = Math.round(val * 100) / 100;
        expect(val).toBe(rounded);
      }
    });

    it('should handle square profile 80x80x4', () => {
      const result = calculateSectionProperties(80, 80, 4);
      expect(result.momentOfInertiaX).toBeCloseTo(result.momentOfInertiaY, 1);
      expect(result.sectionModulusX).toBeCloseTo(result.sectionModulusY, 1);
      expect(result.radiusOfGyrationX).toBeCloseTo(result.radiusOfGyrationY, 1);
    });

    it('should handle very thin walls', () => {
      const result = calculateSectionProperties(100, 100, 0.5);
      expect(result.sectionArea).toBeGreaterThan(0);
      expect(result.momentOfInertiaX).toBeGreaterThan(0);
      expect(result.weightPerMeter).toBeGreaterThan(0);
    });

    it('should handle larger profile 120x80x5', () => {
      const result = calculateSectionProperties(120, 80, 5);
      expect(result.sectionArea).toBeGreaterThan(0);
      expect(result.weightPerMeter).toBeGreaterThan(0);
    });
  });
});
