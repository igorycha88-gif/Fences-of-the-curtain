import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import { prisma } from '@/lib/prisma';
import { calculatePanel3D } from '@/services/calculator/panel3DCalculator';
import { calculateMountingHardware } from '@/services/calculator/mountingHardwareCalculator';
import { workService } from '@/services/admin/workService';

describe('Integration: Panel3D Calculator with Related Items', () => {
  let testPanel3dId: string;
  let testMountingHardwareId: string;
  let testWorkId: string;

  beforeAll(async () => {
    jest.clearAllMocks();
    jest.clearAllTimers();

    await prisma.panel3D.deleteMany({ where: { id: { startsWith: 'test-panel3d-related-' } } });

    let existingPanel = await prisma.panel3D.findFirst({
      where: { id: { startsWith: 'test-panel3d-related-' } },
    });

    if (!existingPanel) {
      existingPanel = await prisma.panel3D.create({
        data: {
          id: 'test-panel3d-related-2000',
          name: 'Тестовая панель 3D 2000x2500 для интеграции',
          panelHeight: 2000,
          panelWidth: 2500,
          panelArea: 5.0,
          rodDiameter: 4,
          cellWidth: 200,
          cellHeight: 50,
          retailPricePerUnit: 1500,
          active: true,
          priority: 0,
        },
      });
    }

    testPanel3dId = existingPanel.id;

    const mountingHardware = await prisma.mountingHardware.create({
      data: {
        name: 'Test Саморезы',
        description: 'Test mounting hardware',
        purchasePrice: 5,
        retailPrice: 10,
        calculationMethod: 'BY_QUANTITY',
        calculationValue: 1,
        useInCalculator: true,
        active: true,
        sortOrder: 1,
      },
    });

    testMountingHardwareId = mountingHardware.id;

    await prisma.mountingHardwareRelation.create({
      data: {
        mountingHardwareId: testMountingHardwareId,
        referenceType: 'PANEL_3D',
        referenceId: testPanel3dId,
      },
    });

    const work = await prisma.work.create({
      data: {
        name: 'Монтаж 3D-панели',
        description: 'Test work for Panel3D',
        category: 'INSTALLATION',
        unit: 'шт',
        price: 1500,
        useInCalculator: true,
        active: true,
        sortOrder: 1,
      },
    });

    testWorkId = work.id;

    await prisma.workRelation.create({
      data: {
        workId: testWorkId,
        referenceType: 'PANEL_3D',
        referenceId: testPanel3dId,
      },
    });
  });

  afterAll(async () => {
    await prisma.workRelation.deleteMany({
      where: { referenceId: testPanel3dId },
    });

    await prisma.work.delete({
      where: { id: testWorkId },
    });

    await prisma.mountingHardwareRelation.deleteMany({
      where: { referenceId: testPanel3dId },
    });

    await prisma.mountingHardware.delete({
      where: { id: testMountingHardwareId },
    });

    await prisma.panel3D.delete({
      where: { id: testPanel3dId },
    });
  });

  it('should calculate panel3D with mounting hardware', async () => {
    const result = await calculatePanel3D(10, 2);

    expect(result.category).toBe('panel3d');
    expect(result.panelHeight).toBe(2000);
    expect(result.quantity).toBeGreaterThan(0);
    expect(result.pricePerUnit).toBeGreaterThan(0);
    expect(result.totalPrice).toBeGreaterThan(0);
  });

  it('should calculate related mounting hardware for Panel3D', async () => {
    const hardwareResult = await calculateMountingHardware({
      fenceLengthM: 10,
      fenceHeightM: 2,
      postsCount: 5,
      lagsCount: 10,
      panel3dId: testPanel3dId,
      panel3dCount: 4,
    });

    expect(hardwareResult.length).toBeGreaterThan(0);
    const hw = hardwareResult.find(h => h.nomenclatureId === testMountingHardwareId);
    expect(hw).toBeDefined();
    expect(hw!.totalPrice).toBeGreaterThan(0);
  });

  it('should get works for Panel3D reference', async () => {
    const works = await workService.getWorksForCalculatorByReference('PANEL_3D', testPanel3dId);

    expect(works).toHaveLength(1);
    expect(works[0].id).toBe(testWorkId);
    expect(works[0].name).toBe('Монтаж 3D-панели');
    expect(works[0].price).toBe(1500);
  });
});
