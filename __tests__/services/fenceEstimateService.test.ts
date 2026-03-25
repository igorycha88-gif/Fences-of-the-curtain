import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { calculateFenceEstimate, getFenceEstimateById } from '@/services/calculator/fenceEstimateService';
import { prisma } from '@/lib/prisma';

describe('fenceEstimateService', () => {
  let testFenceTypeId: string;
  let testPostTypeId: string;
  let testLagTypeId: string;
  let testProfnastilTypeId: string;
  let testGateTypeId: string;
  let testWicketTypeId: string;
  let testMountingHardwareId1: string;
  let testMountingHardwareId2: string;
  let testWorkIdMP: string;
  let testWorkIdFIXED: string;
  let testWorkIdPCS: string;

  beforeAll(async () => {
    const fenceType = await prisma.fenceType.create({
      data: {
        id: 'test-fence-type-1',
        name: 'Профнастил',
        postSpacing: 2500,
        active: true,
        priority: 1,
        updatedAt: new Date(),
      },
    });
    testFenceTypeId = fenceType.id;

    const postType = await prisma.postType.create({
      data: {
        id: 'test-post-type-1',
        name: 'Тестовый столб 60x60x2.5',
        sectionWidth: 60,
        sectionHeight: 60,
        wallThickness: 2.5,
        pricePerMeter: 200,
        length: 3.5,
        retailPricePerUnit: 700,
        active: true,
        priority: 1,
        updatedAt: new Date(),
      },
    });
    testPostTypeId = postType.id;

    const lagType = await prisma.lagType.create({
      data: {
        id: 'test-lag-type-1',
        name: 'Тестовая лага 40x20x2.0',
        width: 40,
        height: 20,
        metalThickness: 2.0,
        retailPricePerUnit: 125,
        length: 3000,
        active: true,
        priority: 0,
        updatedAt: new Date(),
      },
    });
    testLagTypeId = lagType.id;

    const profnastilType = await prisma.profnastilType.create({
      data: {
        id: 'test-profnastil-type-1',
        name: 'Тестовый профнастил С8 0.5мм 2000мм',
        metalThickness: 0.5,
        fullWidth: 1200,
        usefulWidth: 1150,
        length: 2000,
        coating: 'Полимерное (одностороннее)',
        retailPricePerUnit: 550,
        active: true,
        priority: 0,
        updatedAt: new Date(),
      },
    });
    testProfnastilTypeId = profnastilType.id;

    const gateType = await prisma.gateType.create({
      data: {
        id: 'test-gate-type-1',
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
        updatedAt: new Date(),
      },
    });
    testGateTypeId = gateType.id;

    const wicketType = await prisma.wicketType.create({
      data: {
        id: 'test-wicket-type-1',
        name: 'Тестовая калитка 1000x2000',
        wicketLength: 1000,
        wicketHeight: 2000,
        metalThickness: 2.0,
        sectionWidth: 1000,
        sectionHeight: 2000,
        retailPrice: 15000,
        active: true,
        priority: 0,
        updatedAt: new Date(),
      },
    });
    testWicketTypeId = wicketType.id;

    const mountingHardware1 = await prisma.mountingHardware.create({
      data: {
        id: 'test-mounting-hardware-1',
        name: 'Саморезы',
        retailPrice: 2.5,
        calculationMethod: 'BY_LENGTH',
        calculationValue: 0.5,
        active: true,
        useInCalculator: true,
        updatedAt: new Date(),
      },
    });
    testMountingHardwareId1 = mountingHardware1.id;

    const mountingHardware2 = await prisma.mountingHardware.create({
      data: {
        id: 'test-mounting-hardware-2',
        name: 'Заклепки',
        retailPrice: 1.0,
        calculationMethod: 'BY_QUANTITY',
        active: true,
        useInCalculator: true,
        updatedAt: new Date(),
      },
    });
    testMountingHardwareId2 = mountingHardware2.id;

    const workMP = await prisma.work.create({
      data: {
        id: 'test-work-mp-1',
        name: 'Монтаж забора (метр погонный)',
        description: 'Монтаж забора за метр погонный',
        category: 'MOUNTING',
        unit: 'MP',
        price: 1500,
        useInCalculator: true,
        active: true,
        sortOrder: 0,
        updatedAt: new Date(),
      },
    });
    testWorkIdMP = workMP.id;

    await prisma.workRelation.create({
      data: {
        workId: testWorkIdMP,
        fenceType: 'PROFNASTIL',
      },
    });

    const workFIXED = await prisma.work.create({
      data: {
        id: 'test-work-fixed-1',
        name: 'Дополнительные работы',
        description: 'Фиксированная стоимость',
        category: 'MOUNTING',
        unit: 'FIXED',
        price: 5000,
        useInCalculator: true,
        active: true,
        sortOrder: 1,
        updatedAt: new Date(),
      },
    });
    testWorkIdFIXED = workFIXED.id;

    await prisma.workRelation.create({
      data: {
        workId: testWorkIdFIXED,
        fenceType: 'PROFNASTIL',
      },
    });

    const workPCS = await prisma.work.create({
      data: {
        id: 'test-work-pcs-1',
        name: 'Монтаж одной секции',
        description: 'Монтаж одной секции забора',
        category: 'MOUNTING',
        unit: 'PCS',
        price: 2000,
        useInCalculator: true,
        active: true,
        sortOrder: 2,
        updatedAt: new Date(),
      },
    });
    testWorkIdPCS = workPCS.id;

    await prisma.work.deleteMany({
      where: {
        name: 'Монтаж забора из профнастила',
      },
    });

    const { cache } = await import('@/lib/cache');
    await cache.delPattern('calculator:works:');

    await prisma.workRelation.create({
      data: {
        workId: testWorkIdPCS,
        fenceType: 'PROFNASTIL',
      },
    });

    await prisma.mountingHardwareRelation.createMany({
      data: [
        {
          mountingHardwareId: testMountingHardwareId1,
          referenceType: 'POST',
          referenceId: testPostTypeId,
        },
        {
          mountingHardwareId: testMountingHardwareId1,
          referenceType: 'LAG',
          referenceId: testLagTypeId,
        },
        {
          mountingHardwareId: testMountingHardwareId1,
          referenceType: 'PROFNASTIL',
          referenceId: testProfnastilTypeId,
        },
        {
          mountingHardwareId: testMountingHardwareId2,
          referenceType: 'PROFNASTIL',
          referenceId: testProfnastilTypeId,
        },
      ],
    });
  });

  afterAll(async () => {
    await prisma.fenceEstimate.deleteMany({
      where: { fenceTypeId: testFenceTypeId },
    });
    await prisma.mountingHardwareRelation.deleteMany({
      where: {
        OR: [
          { mountingHardwareId: testMountingHardwareId1 },
          { mountingHardwareId: testMountingHardwareId2 },
        ],
      },
    });
    await prisma.mountingHardware.deleteMany({
      where: {
        OR: [
          { id: testMountingHardwareId1 },
          { id: testMountingHardwareId2 },
        ],
      },
    });
    await prisma.gateType.delete({ where: { id: testGateTypeId } });
    await prisma.wicketType.delete({ where: { id: testWicketTypeId } });
    await prisma.profnastilType.delete({ where: { id: testProfnastilTypeId } });
    await prisma.lagType.delete({ where: { id: testLagTypeId } });
    await prisma.postType.delete({ where: { id: testPostTypeId } });
    await prisma.fenceType.delete({ where: { id: testFenceTypeId } });

    await prisma.workRelation.deleteMany({
      where: {
        OR: [
          { workId: testWorkIdMP },
          { workId: testWorkIdFIXED },
          { workId: testWorkIdPCS },
        ],
      },
    });
    await prisma.work.deleteMany({
      where: {
        OR: [
          { id: testWorkIdMP },
          { id: testWorkIdFIXED },
          { id: testWorkIdPCS },
        ],
      },
    });

    await prisma.$disconnect();
  });

  it('should calculate fence estimate correctly', async () => {
    const input = {
      fenceTypeId: testFenceTypeId,
      length: 50,
      height: 2.0,
      lagRows: 2 as const,
      coating: 'POLYMER_SINGLE' as const,
      hasGate: false,
      hasWicket: false,
    };

    const result = await calculateFenceEstimate(input);

    expect(result).toBeDefined();
    expect(result.estimateId).toBeDefined();
    expect(result.items).toHaveLength(10);
    expect(result.totals.grandTotal).toBeGreaterThan(0);
    expect(result.totals.materials).toBeGreaterThan(0);
    expect(result.totals.installation).toBe(82000);
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
      coating: 'POLYMER_SINGLE' as const,
      hasGate: false,
      hasWicket: false,
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
      coating: 'POLYMER_SINGLE' as const,
      hasGate: false,
      hasWicket: false,
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
      coating: 'POLYMER_SINGLE' as const,
      hasGate: false,
      hasWicket: false,
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
      coating: 'POLYMER_SINGLE' as const,
      hasGate: false,
      hasWicket: false,
    };

    const result = await calculateFenceEstimate(input);

    const profnastilItem = result.items.find(item => item.category === 'profnastil');
    expect(profnastilItem).toBeDefined();
    expect(profnastilItem!.quantity).toBe(46);
    expect(profnastilItem!.unit).toBe('шт');
  });

  it('should throw error for non-existent fence type', async () => {
    const input = {
      fenceTypeId: 'nonexistent',
      length: 50,
      height: 2.0,
      lagRows: 2 as const,
      coating: 'POLYMER_SINGLE' as const,
      hasGate: false,
      hasWicket: false,
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
      coating: 'POLYMER_SINGLE' as const,
      hasGate: false,
      hasWicket: false,
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
      coating: 'POLYMER_SINGLE' as const,
      hasGate: false,
      hasWicket: false,
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
      coating: 'POLYMER_SINGLE' as const,
      hasGate: true,
      hasWicket: false,
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
      coating: 'POLYMER_SINGLE' as const,
      hasGate: true,
      hasWicket: false,
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

  it('should add wicket to estimate when hasWicket is true', async () => {
    const input = {
      fenceTypeId: testFenceTypeId,
      length: 50,
      height: 2.0,
      lagRows: 2 as const,
      coating: 'POLYMER_SINGLE' as const,
      hasGate: false,
      hasWicket: true,
      wicketWidth: 1.0,
    };

    const result = await calculateFenceEstimate(input);

    const wicketItem = result.items.find(item => item.category === 'wickets');
    expect(wicketItem).toBeDefined();
    expect(wicketItem!.quantity).toBe(1);
    expect(wicketItem!.totalPrice).toBe(15000);
  });

  it('should adjust fence length when wicket is present', async () => {
    const fenceLength = 10;
    const wicketWidth = 1.0;
    
    const input = {
      fenceTypeId: testFenceTypeId,
      length: fenceLength,
      height: 2.0,
      lagRows: 2 as const,
      coating: 'POLYMER_SINGLE' as const,
      hasGate: false,
      hasWicket: true,
      wicketWidth: wicketWidth,
    };

    const result = await calculateFenceEstimate(input);

    const postsItem = result.items.find(item => item.category === 'posts');
    const profnastilItem = result.items.find(item => item.category === 'profnastil');
    
    const correctedLength = fenceLength - wicketWidth;
    const postSpacing = 2.5;
    const expectedPosts = Math.ceil(correctedLength / postSpacing) + 2;
    
    expect(postsItem!.quantity).toBe(expectedPosts);
    expect(result.parameters.length).toBe(fenceLength);
  });

  it('should calculate fence with both gate and wicket', async () => {
    const fenceLength = 20;
    const gateWidth = 4;
    const wicketWidth = 1.0;
    
    const input = {
      fenceTypeId: testFenceTypeId,
      length: fenceLength,
      height: 2.0,
      lagRows: 2 as const,
      coating: 'POLYMER_SINGLE' as const,
      hasGate: true,
      gateType: 'SWING' as const,
      gateWidth: gateWidth,
      hasWicket: true,
      wicketWidth: wicketWidth,
    };

    const result = await calculateFenceEstimate(input);

    const gateItem = result.items.find(item => item.category === 'gates');
    const wicketItem = result.items.find(item => item.category === 'wickets');
    
    expect(gateItem).toBeDefined();
    expect(wicketItem).toBeDefined();
    expect(gateItem!.totalPrice).toBe(45000);
    expect(wicketItem!.totalPrice).toBe(15000);
    
    const postsItem = result.items.find(item => item.category === 'posts');
    const postSpacing = 2.5;
    const correctedLength = fenceLength - gateWidth - wicketWidth;
    const expectedPosts = Math.ceil(correctedLength / postSpacing) + 2;
    
    expect(postsItem!.quantity).toBe(expectedPosts);
  });

  it('should save wicket data to database', async () => {
    const input = {
      fenceTypeId: testFenceTypeId,
      length: 50,
      height: 2.0,
      lagRows: 2 as const,
      coating: 'POLYMER_SINGLE' as const,
      hasGate: false,
      hasWicket: true,
      wicketWidth: 1.0,
    };

    const result = await calculateFenceEstimate(input);

    const dbEstimate = await prisma.fenceEstimate.findUnique({
      where: { id: result.estimateId },
    });

    expect(dbEstimate).toBeDefined();
    expect(dbEstimate!.hasWicket).toBe(true);
    expect(dbEstimate!.wicketWidth).toBe(1000);
    expect(dbEstimate!.wicketTotal).toBe(15000);
  });

  it('should throw error when wicket not found in catalog', async () => {
    const input = {
      fenceTypeId: testFenceTypeId,
      length: 5,
      height: 2.0,
      lagRows: 2 as const,
      coating: 'POLYMER_SINGLE' as const,
      hasGate: false,
      hasWicket: true,
      wicketWidth: 5.0,
    };

    await expect(calculateFenceEstimate(input)).rejects.toMatchObject({
      error: 'NO_WICKET_FOUND',
      message: 'Не найдена калитка с указанными параметрами',
    });
  });

  describe('Transaction', () => {
    it('should create estimate within transaction', async () => {
      const input = {
        fenceTypeId: testFenceTypeId,
        length: 10,
        height: 2.0,
        lagRows: 2 as const,
        coating: 'POLYMER_SINGLE' as const,
        hasGate: false,
        hasWicket: false,
      };

      const result = await calculateFenceEstimate(input);

      expect(result.estimateId).toBeDefined();
      expect(result.totals.grandTotal).toBeGreaterThan(0);

      const dbEstimate = await prisma.fenceEstimate.findUnique({
        where: { id: result.estimateId },
      });

      expect(dbEstimate).toBeDefined();
      expect(dbEstimate!.grandTotal).toBe(result.totals.grandTotal);
    });

    it('should rollback transaction on database error', async () => {
      jest.spyOn(prisma, '$transaction').mockRejectedValueOnce(
        new Error('Database connection error')
      );

      const input = {
        fenceTypeId: testFenceTypeId,
        length: 10,
        height: 2.0,
        lagRows: 2 as const,
        coating: 'POLYMER_SINGLE' as const,
        hasGate: false,
        hasWicket: false,
      };

      await expect(calculateFenceEstimate(input)).rejects.toThrow(
        'Database connection error'
      );

      jest.restoreAllMocks();
    });

    it('should handle concurrent estimate creation', async () => {
      const input = {
        fenceTypeId: testFenceTypeId,
        length: 10,
        height: 2.0,
        lagRows: 2 as const,
        coating: 'POLYMER_SINGLE' as const,
        hasGate: false,
        hasWicket: false,
      };

      const results = await Promise.all([
        calculateFenceEstimate(input),
        calculateFenceEstimate(input),
        calculateFenceEstimate(input),
      ]);

      expect(results).toHaveLength(3);
      const uniqueIds = new Set(results.map(r => r.estimateId));
      expect(uniqueIds.size).toBe(3);

      for (const result of results) {
        const dbEstimate = await prisma.fenceEstimate.findUnique({
          where: { id: result.estimateId },
        });

        expect(dbEstimate).toBeDefined();
        expect(dbEstimate!.grandTotal).toBe(result.totals.grandTotal);
      }
    });

    it('should update city asynchronously without blocking transaction', async () => {
      const input = {
        fenceTypeId: testFenceTypeId,
        length: 10,
        height: 2.0,
        lagRows: 2 as const,
        coating: 'POLYMER_SINGLE' as const,
        hasGate: false,
        hasWicket: false,
      };

      const startTime = Date.now();
      const result = await calculateFenceEstimate(input, {
        ipAddress: '8.8.8.8',
      });
      const endTime = Date.now();

      expect(result.estimateId).toBeDefined();

      const dbEstimate = await prisma.fenceEstimate.findUnique({
        where: { id: result.estimateId },
      });

      expect(dbEstimate).toBeDefined();
      expect(dbEstimate!.ipAddress).toBe('8.8.8.8');

      const transactionTime = endTime - startTime;
      expect(transactionTime).toBeLessThan(5000);
    });
  });

  describe('Fence Type Works (Mounting)', () => {
    it('should calculate work with MP unit (meter price)', async () => {
      const input = {
        fenceTypeId: testFenceTypeId,
        length: 50,
        height: 2.0,
        lagRows: 2 as const,
        coating: 'POLYMER_SINGLE' as const,
        hasGate: false,
        hasWicket: false,
      };

      const result = await calculateFenceEstimate(input);

      const workMPItem = result.items.find(item => item.category === 'installation' && item.nomenclatureId === testWorkIdMP);
      expect(workMPItem).toBeDefined();
      expect(workMPItem!.quantity).toBe(50);
      expect(workMPItem!.unit).toBe('м.п.');
      expect(workMPItem!.pricePerUnit).toBe(1500);
      expect(workMPItem!.totalPrice).toBe(75000);
    });

    it('should calculate work with FIXED unit', async () => {
      const input = {
        fenceTypeId: testFenceTypeId,
        length: 50,
        height: 2.0,
        lagRows: 2 as const,
        coating: 'POLYMER_SINGLE' as const,
        hasGate: false,
        hasWicket: false,
      };

      const result = await calculateFenceEstimate(input);

      const workFIXEDItem = result.items.find(item => item.category === 'installation' && item.nomenclatureId === testWorkIdFIXED);
      expect(workFIXEDItem).toBeDefined();
      expect(workFIXEDItem!.quantity).toBe(1);
      expect(workFIXEDItem!.totalPrice).toBe(5000);
    });

    it('should calculate work with PCS unit', async () => {
      const input = {
        fenceTypeId: testFenceTypeId,
        length: 50,
        height: 2.0,
        lagRows: 2 as const,
        coating: 'POLYMER_SINGLE' as const,
        hasGate: false,
        hasWicket: false,
      };

      const result = await calculateFenceEstimate(input);

      const workPCSItem = result.items.find(item => item.category === 'installation' && item.nomenclatureId === testWorkIdPCS);
      expect(workPCSItem).toBeDefined();
      expect(workPCSItem!.quantity).toBe(1);
      expect(workPCSItem!.totalPrice).toBe(2000);
    });

    it('should include fence type works in installation total', async () => {
      const input = {
        fenceTypeId: testFenceTypeId,
        length: 50,
        height: 2.0,
        lagRows: 2 as const,
        coating: 'POLYMER_SINGLE' as const,
        hasGate: false,
        hasWicket: false,
      };

      const result = await calculateFenceEstimate(input);

      const expectedMPWorkTotal = 50 * 1500;
      const expectedFIXEDWorkTotal = 5000;
      const expectedPCSWorkTotal = 2000;
      const expectedFenceTypeWorksTotal = expectedMPWorkTotal + expectedFIXEDWorkTotal + expectedPCSWorkTotal;

      const installationItems = result.items.filter(item => item.category === 'installation');
      const installationTotal = result.totals.installation;

      expect(installationTotal).toBe(expectedFenceTypeWorksTotal);
    });

    it('should not include works with useInCalculator=false', async () => {
      const inactiveWork = await prisma.work.create({
        data: {
          id: 'test-work-inactive-1',
          name: 'Неактивная работа',
          category: 'MOUNTING',
          unit: 'MP',
          price: 1000,
          useInCalculator: false,
          active: true,
          sortOrder: 0,
          updatedAt: new Date(),
        },
      });

      await prisma.workRelation.create({
        data: {
          workId: inactiveWork.id,
          fenceType: 'PROFNASTIL',
        },
      });

      const input = {
        fenceTypeId: testFenceTypeId,
        length: 50,
        height: 2.0,
        lagRows: 2 as const,
        coating: 'POLYMER_SINGLE' as const,
        hasGate: false,
        hasWicket: false,
      };

      const result = await calculateFenceEstimate(input);

      const inactiveWorkItem = result.items.find(item => item.nomenclatureId === inactiveWork.id);
      expect(inactiveWorkItem).toBeUndefined();

      await prisma.workRelation.deleteMany({ where: { workId: inactiveWork.id } });
      await prisma.work.delete({ where: { id: inactiveWork.id } });
    });
  });
});
