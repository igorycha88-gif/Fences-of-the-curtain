import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { calculateFence } from '@/services/calculator/fenceCalculator';
import { calculateCanopy } from '@/services/calculator/canopyCalculator';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    trussProfileType: {
      findUnique: jest.fn(),
    },
    trussRoofCovering: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('@/lib/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

import { prisma } from '@/lib/prisma';

const mockPrisma = prisma as any;

const mockPost = {
  id: 'post-1',
  name: 'Профиль 80x80x3',
  retailPricePerMeter: 1200,
  retailPricePerUnit: 5000,
};

const mockRoofCovering = {
  id: 'covering-1',
  name: 'Поликарбонат 8мм',
  retailPricePerSqm: 800,
  thickness: 8,
};

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
    };

    const result = await calculateFence(input as any);

    expect(result).toBeDefined();
    expect(result.grandTotal).toBeGreaterThan(0);
    expect(result.materials.length).toBeGreaterThan(0);
    expect(result.works.length).toBeGreaterThan(0);
  });

  it('should calculate fence with gate correctly', async () => {
    const input = {
      fenceType: 'PROFNASTIL',
      length: 50,
      height: 2,
      postType: 'standard',
      lagType: 'standard',
      lagRows: 2,
      hasGate: true,
      gateType: 'SWING',
      gateWidth: 4,
      hasWicket: false,
      coating: 'GALVANIZED',
    };

    const result = await calculateFence(input as any);

    expect(result).toBeDefined();
    expect(result.grandTotal).toBeGreaterThan(0);
  });
});

describe('Canopy Calculator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.trussProfileType.findUnique.mockResolvedValue(mockPost);
    mockPrisma.trussRoofCovering.findUnique.mockResolvedValue(mockRoofCovering);
  });

  it('should calculate basic canopy correctly', async () => {
    const input = {
      canopyType: 'SINGLE_SLOPE',
      purpose: 'car-2',
      postTypeId: 'post-1',
      length: 6,
      width: 4,
      height: 2.5,
      roofCoveringId: 'covering-1',
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
      canopyType: 'ARCH',
      purpose: 'car-2',
      postTypeId: 'post-1',
      length: 6,
      width: 4,
      height: 2.5,
      roofCoveringId: 'covering-1',
      installationType: 'ground',
      hasWaterSystem: false,
    };

    const result = await calculateCanopy(input as any);

    const inputSame = {
      ...input,
      canopyType: 'SINGLE_SLOPE',
    };
    const resultSame = await calculateCanopy(inputSame as any);

    expect(result.materialsTotal).toBeGreaterThan(resultSame.materialsTotal);
  });
});
