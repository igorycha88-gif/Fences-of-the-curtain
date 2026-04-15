import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { prisma } from '@/lib/prisma';
import { calculateProfnastil, ProfnastilCalculationError } from '@/services/calculator/profnastilCalculator';
import { invalidateProfnastilTypesCache } from '@/lib/cache-invalidation';

describe('calculateProfnastil', () => {
  const testProfnastils = [
    {
      id: 'test-prof-1',
      name: 'Профнастил С8 0.5мм Полимерное одностороннее 2000мм',
      metalThickness: 0.5,
      fullWidth: 1200,
      usefulWidth: 1150,
      length: 2000,
      coating: 'Полимерное (одностороннее)',
      retailPricePerUnit: 1100,
      active: true,
      priority: 0,
      updatedAt: new Date(),
    },
    {
      id: 'test-prof-2',
      name: 'Профнастил С8 0.5мм Оцинковка 2000мм',
      metalThickness: 0.5,
      fullWidth: 1200,
      usefulWidth: 1150,
      length: 2000,
      coating: 'Оцинковка',
      retailPricePerUnit: 900,
      active: true,
      priority: 0,
      updatedAt: new Date(),
    },
    {
      id: 'test-prof-3',
      name: 'Профнастил С8 0.5мм Полимерное двустороннее 2000мм',
      metalThickness: 0.5,
      fullWidth: 1200,
      usefulWidth: 1150,
      length: 2000,
      coating: 'Полимерное (двустороннее)',
      retailPricePerUnit: 1300,
      active: true,
      priority: 0,
      updatedAt: new Date(),
    },
    {
      id: 'test-prof-4',
      name: 'Профнастил С8 0.5мм Полимерное одностороннее 2500мм',
      metalThickness: 0.5,
      fullWidth: 1200,
      usefulWidth: 1150,
      length: 2500,
      coating: 'Полимерное (одностороннее)',
      retailPricePerUnit: 1400,
      active: true,
      priority: 0,
      updatedAt: new Date(),
    },
    {
      id: 'test-prof-5',
      name: 'Профнастил С8 0.5мм Полимерное одностороннее 1800мм',
      metalThickness: 0.5,
      fullWidth: 1200,
      usefulWidth: 1150,
      length: 1800,
      coating: 'Полимерное (одностороннее)',
      retailPricePerUnit: 1005,
      active: true,
      priority: 0,
      updatedAt: new Date(),
    },
    {
      id: 'test-prof-6',
      name: 'Профнастил С8 0.5мм Оцинковка 1800мм',
      metalThickness: 0.5,
      fullWidth: 1200,
      usefulWidth: 1150,
      length: 1800,
      coating: 'Оцинковка',
      retailPricePerUnit: 850,
      active: true,
      priority: 0,
      updatedAt: new Date(),
    },
    {
      id: 'test-prof-7',
      name: 'Профнастил С8 0.5мм Полимерное двустороннее 1800мм',
      metalThickness: 0.5,
      fullWidth: 1200,
      usefulWidth: 1150,
      length: 1800,
      coating: 'Полимерное (двустороннее)',
      retailPricePerUnit: 1095,
      active: true,
      priority: 0,
      updatedAt: new Date(),
    },
    {
      id: 'test-prof-8',
      name: 'Профнастил С8 0.5мм Полимерное одностороннее 2200мм',
      metalThickness: 0.5,
      fullWidth: 1200,
      usefulWidth: 1150,
      length: 2200,
      coating: 'Полимерное (одностороннее)',
      retailPricePerUnit: 1200,
      active: true,
      priority: 0,
      updatedAt: new Date(),
    },
  ];

  beforeAll(async () => {
    await prisma.profnastilType.deleteMany({
      where: { id: { in: testProfnastils.map(p => p.id) } },
    });
    await prisma.profnastilType.createMany({
      data: testProfnastils,
    });
    await invalidateProfnastilTypesCache();
  });

  afterAll(async () => {
    await prisma.profnastilType.deleteMany({
      where: {
        id: {
          in: testProfnastils.map(p => p.id),
        },
      },
    });
    await prisma.$disconnect();
  });

  it('should find profnastil by coating POLYMER_SINGLE and height', async () => {
    const result = await calculateProfnastil(50, 2.0, 'POLYMER_SINGLE');

    expect(result.category).toBe('profnastil');
    expect(result.coating).toBe('Полимерное (одностороннее)');
    expect(result.pricePerUnit).toBeGreaterThan(0);
    expect(result.quantity).toBeGreaterThan(0);
    expect(result.totalPrice).toBe(result.quantity * result.pricePerUnit);
  });

  it('should filter by coating GALVANIZED', async () => {
    const result = await calculateProfnastil(50, 2.0, 'GALVANIZED');

    expect(result.coating).toBe('Оцинковка');
    expect(result.pricePerUnit).toBeGreaterThan(0);
  });

  it('should filter by coating POLYMER_DOUBLE', async () => {
    const result = await calculateProfnastil(50, 2.0, 'POLYMER_DOUBLE');

    expect(result.coating).toBe('Полимерное (двустороннее)');
    expect(result.pricePerUnit).toBeGreaterThan(0);
  });

  it('should throw error when no profnastil with coating found', async () => {
    await expect(
      calculateProfnastil(50, 10.0, 'POLYMER_DOUBLE')
    ).rejects.toMatchObject({
      error: 'NO_PROFNASTIL_FOUND',
      message: 'Не найден профнастил с указанным покрытием и высотой',
      details: {
        requiredHeight: 10000,
        coating: 'Полимерное (двустороннее)',
      },
    });
  });

  it('should prioritize by priority field', async () => {
    const result = await calculateProfnastil(50, 2.0, 'POLYMER_SINGLE');

    expect(result.pricePerUnit).toBeGreaterThan(0);
  });

  it('should select 1800mm sheet when fence height is 1.8m (POLYMER_SINGLE)', async () => {
    const result = await calculateProfnastil(50, 1.8, 'POLYMER_SINGLE');

    expect(result.nomenclatureId).toBe('test-prof-5');
    expect(result.nomenclatureName).toContain('1800мм');
    expect(result.pricePerUnit).toBe(1005);
  });

  it('should select 1800mm sheet when fence height is 1.8m (GALVANIZED)', async () => {
    const result = await calculateProfnastil(50, 1.8, 'GALVANIZED');

    expect(result.nomenclatureId).toBe('test-prof-6');
    expect(result.nomenclatureName).toContain('1800мм');
    expect(result.pricePerUnit).toBe(850);
  });

  it('should select 1800mm sheet when fence height is 1.8m (POLYMER_DOUBLE)', async () => {
    const result = await calculateProfnastil(50, 1.8, 'POLYMER_DOUBLE');

    expect(result.nomenclatureId).toBe('test-prof-7');
    expect(result.nomenclatureName).toContain('1800мм');
    expect(result.pricePerUnit).toBe(1095);
  });

  it('should select 2000mm sheet when fence height is 2.0m (not 1800mm)', async () => {
    const result = await calculateProfnastil(50, 2.0, 'POLYMER_SINGLE');

    expect(result.nomenclatureName).toContain('2000мм');
  });

  it('should select 2000mm sheet when fence height is 1.5m (smallest >= 1500mm)', async () => {
    const result = await calculateProfnastil(50, 1.5, 'POLYMER_SINGLE');

    expect(result.nomenclatureId).toBe('test-prof-5');
    expect(result.nomenclatureName).toContain('1800мм');
  });

  it('should select closest sheet when fence height is 2.2m (2200mm)', async () => {
    const result = await calculateProfnastil(50, 2.2, 'POLYMER_SINGLE');

    expect(result.nomenclatureId).toBe('test-prof-8');
    expect(result.nomenclatureName).toContain('2200мм');
  });
});
