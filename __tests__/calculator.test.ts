import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { calculateFence } from '@/services/calculator/fenceCalculator';
import { calculateCanopy } from '@/services/calculator/canopyCalculator';

describe('Fence Calculator', () => {
  it('should calculate basic fence correctly', async () => {
    const input = {
      fenceType: 'PROFNASTIL',
      length: 50,
      height: 2,
      postType: 'standard',
      lagType: 'standard',
      lagRows: 2,
      hasGate: false,
      hasWicket: false,
      coating: 'GALVANIZED',
      soilType: 'normal',
    };

    const result = await calculateFence(input as any);

    expect(result).toBeDefined();
    expect(result.grandTotal).toBeGreaterThan(0);
    expect(result.materials.length).toBeGreaterThan(0);
    expect(result.works.length).toBeGreaterThan(0);
  });

  it('should apply soil surcharge correctly', async () => {
    const input = {
      fenceType: 'PROFNASTIL',
      length: 50,
      height: 2,
      postType: 'standard',
      lagType: 'standard',
      lagRows: 2,
      hasGate: false,
      hasWicket: false,
      coating: 'GALVANIZED',
      soilType: 'swamp',
    };

    const result = await calculateFence(input as any);

    expect(result.soilSurcharge).toBeGreaterThan(0);
  });
});

describe('Canopy Calculator', () => {
  it('should calculate basic canopy correctly', async () => {
    const input = {
      canopyType: 'single-slope',
      purpose: 'car-2',
      length: 6,
      width: 4,
      height: 2.5,
      frameMaterial: 'profile-60x60',
      roofMaterial: 'polycarbonate-8',
      installationType: 'ground',
      hasWaterSystem: false,
    };

    const result = await calculateCanopy(input as any);

    expect(result).toBeDefined();
    expect(result.grandTotal).toBeGreaterThan(0);
    expect(result.materials.length).toBeGreaterThan(0);
    expect(result.works.length).toBeGreaterThan(0);
  });

  it('should calculate arch canopy with higher area coefficient', async () => {
    const input = {
      canopyType: 'arch',
      purpose: 'car-2',
      length: 6,
      width: 4,
      height: 2.5,
      frameMaterial: 'profile-60x60',
      roofMaterial: 'polycarbonate-8',
      installationType: 'ground',
      hasWaterSystem: false,
    };

    const result = await calculateCanopy(input as any);

    const inputSame = {
      ...input,
      canopyType: 'single-slope',
    };
    const resultSame = await calculateCanopy(inputSame as any);

    expect(result.materialsTotal).toBeGreaterThan(resultSame.materialsTotal);
  });
});
