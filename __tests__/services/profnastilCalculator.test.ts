import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { prisma } from '@/lib/prisma';
import { calculateProfnastil, ProfnastilCalculationError } from '@/services/calculator/profnastilCalculator';

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
      priority: 1,
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
      priority: 2,
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
      priority: 3,
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
      priority: 1,
      updatedAt: new Date(),
    },
  ];

  beforeAll(async () => {
    await prisma.profnastilType.createMany({
      data: testProfnastils,
      skipDuplicates: true,
    });
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
    expect(result.nomenclatureName).toContain('Полимерное');
    expect(result.pricePerUnit).toBe(1100);
    expect(result.quantity).toBeGreaterThan(0);
    expect(result.totalPrice).toBe(result.quantity * result.pricePerUnit);
  });

  it('should filter by coating GALVANIZED', async () => {
    const result = await calculateProfnastil(50, 2.0, 'GALVANIZED');

    expect(result.coating).toBe('Оцинковка');
    expect(result.nomenclatureName).toContain('Оцинковка');
    expect(result.pricePerUnit).toBe(900);
  });

  it('should filter by coating POLYMER_DOUBLE', async () => {
    const result = await calculateProfnastil(50, 2.0, 'POLYMER_DOUBLE');

    expect(result.coating).toBe('Полимерное (двустороннее)');
    expect(result.nomenclatureName).toContain('двустороннее');
  });

  it('should select profnastil with correct height', async () => {
    const result = await calculateProfnastil(50, 2.3, 'POLYMER_SINGLE');

    expect(result.coating).toBe('Полимерное (одностороннее)');
    expect(result.nomenclatureName).toContain('2500мм');
    expect(result.pricePerUnit).toBe(1400);
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

    expect(result.pricePerUnit).toBe(1100);
  });
});
