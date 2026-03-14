import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { calculateFenceEstimate, getFenceEstimateById } from '@/services/calculator/fenceEstimateService';
import { prisma } from '@/lib/prisma';

describe('fenceEstimateService', () => {
  let testFenceTypeId: string;
  let testPostTypeId: string;
  let testLagTypeId: string;
  let testProfnastilTypeId: string;
  let testGateTypeId: string;

  beforeAll(async () => {
    const fenceType = await prisma.fenceType.create({
      data: {
        name: 'Профнастил',
        postSpacing: 2500,
        active: true,
        priority: 1,
      },
    });
    testFenceTypeId = fenceType.id;

    const postType = await prisma.postType.create({
      data: {
        name: 'Тестовый столб 60x60x2.5',
        sectionWidth: 60,
        sectionHeight: 60,
        wallThickness: 2.5,
        pricePerMeter: 200,
        length: 3.5,
        retailPricePerUnit: 700,
        active: true,
        priority: 1,
      },
    });
    testPostTypeId = postType.id;

    const lagType = await prisma.lagType.create({
      data: {
        name: 'Тестовая лага 40x20x2.0',
        width: 40,
        height: 20,
        metalThickness: 2.0,
        retailPricePerUnit: 125,
        length: 3000,
        active: true,
        priority: 0,
      },
    });
    testLagTypeId = lagType.id;

    const profnastilType = await prisma.profnastilType.create({
      data: {
        name: 'Тестовый профнастил С8 0.5мм 2000мм',
        metalThickness: 0.5,
        fullWidth: 1200,
        usefulWidth: 1150,
        length: 2000,
        coating: 'POLYMER',
        retailPricePerUnit: 550,
        active: true,
        priority: 0,
      },
    });
    testProfnastilTypeId = profnastilType.id;

    const gateType = await prisma.gateType.create({
      data: {
        name: 'Тестовые ворота 4000мм',
        type: 'Распашные',
        gateLength: 4000,
        gateHeight: 2000,
        metalThickness: 2.0,
        sectionWidth: 2000,
        sectionHeight: 2000,
        retailPrice: 45000,
        active: true,
        priority: 0,
      },
    });
    testGateTypeId = gateType.id;
  });

  afterAll(async () => {
    await prisma.fenceEstimate.deleteMany({
      where: { fenceTypeId: testFenceTypeId },
    });
    await prisma.gateType.delete({ where: { id: testGateTypeId } });
    await prisma.profnastilType.delete({ where: { id: testProfnastilTypeId } });
    await prisma.lagType.delete({ where: { id: testLagTypeId } });
    await prisma.postType.delete({ where: { id: testPostTypeId } });
    await prisma.fenceType.delete({ where: { id: testFenceTypeId } });
    await prisma.$disconnect();
  });

  it('should calculate fence estimate correctly', async () => {
    const input = {
      fenceTypeId: testFenceTypeId,
      length: 50,
      height: 2.0,
      lagRows: 2 as const,
    };

    const result = await calculateFenceEstimate(input);

    expect(result).toBeDefined();
    expect(result.estimateId).toBeDefined();
    expect(result.items).toHaveLength(5);
    expect(result.totals.grandTotal).toBeGreaterThan(0);
    expect(result.totals.materials).toBeGreaterThan(0);
    expect(result.totals.installation).toBe(60000);
    expect(result.parameters.fenceTypeId).toBe(testFenceTypeId);
    expect(result.parameters.length).toBe(50);
    expect(result.parameters.height).toBe(2.0);
    expect(result.parameters.lagRows).toBe(2);
  });

  it('should calculate posts correctly', async () => {
    const input = {
      fenceTypeId: testFenceTypeId,
      length: 50,
      height: 2.0,
      lagRows: 2 as const,
    };

    const result = await calculateFenceEstimate(input);

    const postsItem = result.items.find(item => item.category === 'posts');
    expect(postsItem).toBeDefined();
    expect(postsItem!.quantity).toBe(22);
    expect(postsItem!.unit).toBe('шт');
  });

  it('should calculate lags correctly for 2 rows', async () => {
    const input = {
      fenceTypeId: testFenceTypeId,
      length: 50,
      height: 2.0,
      lagRows: 2 as const,
    };

    const result = await calculateFenceEstimate(input);

    const lagsItem = result.items.find(item => item.category === 'lags');
    expect(lagsItem).toBeDefined();
    expect(lagsItem!.quantity).toBe(36);
    expect(lagsItem!.unit).toBe('шт');
  });

  it('should calculate lags correctly for 3 rows', async () => {
    const input = {
      fenceTypeId: testFenceTypeId,
      length: 50,
      height: 2.0,
      lagRows: 3 as const,
    };

    const result = await calculateFenceEstimate(input);

    const lagsItem = result.items.find(item => item.category === 'lags');
    expect(lagsItem).toBeDefined();
    expect(lagsItem!.quantity).toBe(53);
  });

  it('should calculate profnastil correctly', async () => {
    const input = {
      fenceTypeId: testFenceTypeId,
      length: 50,
      height: 2.0,
      lagRows: 2 as const,
    };

    const result = await calculateFenceEstimate(input);

    const profnastilItem = result.items.find(item => item.category === 'profnastil');
    expect(profnastilItem).toBeDefined();
    expect(profnastilItem!.quantity).toBe(46);
    expect(profnastilItem!.unit).toBe('шт');
  });

  it('should calculate installation correctly', async () => {
    const input = {
      fenceTypeId: testFenceTypeId,
      length: 50,
      height: 2.0,
      lagRows: 2 as const,
    };

    const result = await calculateFenceEstimate(input);

    const installationItem = result.items.find(item => item.category === 'installation');
    expect(installationItem).toBeDefined();
    expect(installationItem!.quantity).toBe(50);
    expect(installationItem!.pricePerUnit).toBe(1200);
    expect(installationItem!.totalPrice).toBe(60000);
  });

  it('should throw error for non-existent fence type', async () => {
    const input = {
      fenceTypeId: 'nonexistent',
      length: 50,
      height: 2.0,
      lagRows: 2 as const,
    };

    await expect(calculateFenceEstimate(input)).rejects.toEqual({
      error: 'NO_FENCE_TYPE',
      message: 'Тип забора не найден',
    });
  });

  it('should save estimate to database', async () => {
    const input = {
      fenceTypeId: testFenceTypeId,
      length: 50,
      height: 2.0,
      lagRows: 2 as const,
    };

    const result = await calculateFenceEstimate(input);

    const dbEstimate = await prisma.fenceEstimate.findUnique({
      where: { id: result.estimateId },
    });

    expect(dbEstimate).toBeDefined();
    expect(dbEstimate!.length).toBe(50);
    expect(dbEstimate!.height).toBe(2.0);
    expect(dbEstimate!.lagRows).toBe(2);
    expect(dbEstimate!.grandTotal).toBe(result.totals.grandTotal);
  });

  it('should get estimate by id', async () => {
    const input = {
      fenceTypeId: testFenceTypeId,
      length: 50,
      height: 2.0,
      lagRows: 2 as const,
    };

    const created = await calculateFenceEstimate(input);
    const result = await getFenceEstimateById(created.estimateId);

    expect(result).toBeDefined();
    expect(result!.estimateId).toBe(created.estimateId);
    expect(result!.parameters.fenceTypeName).toBe('Профнастил');
  });

  it('should return null for non-existent estimate', async () => {
    const result = await getFenceEstimateById('nonexistent');
    expect(result).toBeNull();
  });

  it('should calculate profnastil on full length when gate is present', async () => {
    const fenceLength = 10;
    const gateWidth = 4;
    
    const input = {
      fenceTypeId: testFenceTypeId,
      length: fenceLength,
      height: 2.0,
      lagRows: 2 as const,
      coating: 'GALVANIZED' as const,
      hasGate: true,
      gateType: 'SWING' as const,
      gateWidth: gateWidth,
    };

    const result = await calculateFenceEstimate(input);

    const profnastilItem = result.items.find(item => item.category === 'profnastil');
    expect(profnastilItem).toBeDefined();
    
    const usefulWidth = 1150;
    const fullLengthSheets = Math.ceil(fenceLength * 1000 / usefulWidth) + 2;
    const correctedLengthSheets = Math.ceil((fenceLength - gateWidth) * 1000 / usefulWidth) + 2;
    
    expect(profnastilItem!.quantity).toBe(fullLengthSheets);
    expect(profnastilItem!.quantity).not.toBe(correctedLengthSheets);
  });

  it('should calculate posts and lags on corrected length when gate is present', async () => {
    const fenceLength = 10;
    const gateWidth = 4;
    const postSpacing = 2.5;
    
    const input = {
      fenceTypeId: testFenceTypeId,
      length: fenceLength,
      height: 2.0,
      lagRows: 2 as const,
      coating: 'GALVANIZED' as const,
      hasGate: true,
      gateType: 'SWING' as const,
      gateWidth: gateWidth,
    };

    const result = await calculateFenceEstimate(input);

    const postsItem = result.items.find(item => item.category === 'posts');
    const lagsItem = result.items.find(item => item.category === 'lags');
    
    const correctedLength = fenceLength - gateWidth;
    const expectedPosts = Math.ceil(correctedLength / postSpacing) + 2;
    const lagLength = 3000;
    const expectedLags = Math.ceil(correctedLength * 1000 / lagLength) * 2 + 2;
    
    expect(postsItem!.quantity).toBe(expectedPosts);
    expect(lagsItem!.quantity).toBe(expectedLags);
  });
});
