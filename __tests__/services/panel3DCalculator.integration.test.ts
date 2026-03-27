import { describe, it, expect, beforeAll, beforeEach, afterEach } from '@jest/globals';
import { prisma } from '@/lib/prisma';
import { calculatePanel3D } from '@/services/calculator/panel3DCalculator';
import { cache } from '@/lib/cache';
import { CACHE_KEYS } from '@/lib/cache-keys';

describe('panel3DCalculator - Integration Tests', () => {
  let testPanel2000Id: string;
  let testPanel2000HighPriorityId: string;
  let testPanel2000LowPriorityId: string;
  let testPanel2500Id: string;
  let testPanel3000Id: string;
  let originalValidUntil: Date | null;

  beforeAll(async () => {
    await prisma.panel3D.deleteMany({ where: { id: { startsWith: 'test-panel3d-' } } });

    const existingPanels = await prisma.panel3D.findMany({
      orderBy: [{ priority: 'asc' }, { panelHeight: 'asc' }],
    });

    const panels2000 = existingPanels.filter(p => p.panelHeight === 2000);
    if (panels2000.length === 0) {
      const p1 = await prisma.panel3D.create({
        data: {
          id: 'test-panel3d-2000-hi',
          name: 'Панель 3D 2000x2500 (приоритетная)',
          panelHeight: 2000,
          panelWidth: 2500,
          panelArea: 5.0,
          rodDiameter: 4,
          cellWidth: 200,
          cellHeight: 50,
          retailPricePerUnit: 1200,
          active: true,
          priority: 0,
        },
      });
      testPanel2000HighPriorityId = p1.id;

      const p2 = await prisma.panel3D.create({
        data: {
          id: 'test-panel3d-2000-lo',
          name: 'Панель 3D 2000x2500 (низкий приоритет)',
          panelHeight: 2000,
          panelWidth: 2500,
          panelArea: 5.0,
          rodDiameter: 4,
          cellWidth: 200,
          cellHeight: 50,
          retailPricePerUnit: 1300,
          active: true,
          priority: 10,
        },
      });
      testPanel2000LowPriorityId = p2.id;

      testPanel2000Id = testPanel2000HighPriorityId;
    } else {
      testPanel2000LowPriorityId = panels2000.find(p => p.priority === 10)?.id || '';
      testPanel2000HighPriorityId = panels2000.find(p => p.priority === 0)?.id || '';
      testPanel2000Id = panels2000.length > 0 ? panels2000[0].id : '';
    }

    if (!existingPanels.find(p => p.panelHeight === 2500)) {
      const p = await prisma.panel3D.create({
        data: {
          id: 'test-panel3d-2500',
          name: 'Панель 3D 2500x2500',
          panelHeight: 2500,
          panelWidth: 2500,
          panelArea: 6.25,
          rodDiameter: 4,
          cellWidth: 200,
          cellHeight: 50,
          retailPricePerUnit: 1500,
          active: true,
          priority: 0,
        },
      });
      testPanel2500Id = p.id;
    } else {
      testPanel2500Id = existingPanels.find(p => p.panelHeight === 2500)?.id || '';
    }

    if (!existingPanels.find(p => p.panelHeight === 3000)) {
      const p = await prisma.panel3D.create({
        data: {
          id: 'test-panel3d-3000',
          name: 'Панель 3D 3000x2500',
          panelHeight: 3000,
          panelWidth: 2500,
          panelArea: 7.5,
          rodDiameter: 5,
          cellWidth: 250,
          cellHeight: 50,
          retailPricePerUnit: 2000,
          active: true,
          priority: 0,
        },
      });
      testPanel3000Id = p.id;
    } else {
      testPanel3000Id = existingPanels.find(p => p.panelHeight === 3000)?.id || '';
    }

    const panel2000 = existingPanels.find(p => p.id === testPanel2000Id);
    originalValidUntil = panel2000?.validUntil || null;
  });

  beforeEach(async () => {
    await cache.delPattern(CACHE_KEYS.PANEL_3D_ACTIVE);

    if (testPanel2000Id) {
      await prisma.panel3D.update({
        where: { id: testPanel2000Id },
        data: { validUntil: null },
      });
    }
  });

  afterEach(async () => {
    await cache.delPattern(CACHE_KEYS.PANEL_3D_ACTIVE);

    if (testPanel2000Id) {
      await prisma.panel3D.update({
        where: { id: testPanel2000Id },
        data: { validUntil: originalValidUntil },
      });
    }
  });



  describe('TC-LKP-001: Поиск панели с точным совпадением высоты', () => {
    it('should select 2000mm panel for 2000mm fence', async () => {
      if (!testPanel2000Id) {
        console.log('Skipping - no 2000mm panel in DB');
        return;
      }

      const result = await calculatePanel3D(50, 2.0);

      expect(result.nomenclatureId).toBe(testPanel2000Id);
      expect(result.panelHeight).toBe(2000);
      expect(result.panelWidth).toBe(2500);
    });

    it('should select higher priority panel among exact matches', async () => {
      const result = await calculatePanel3D(50, 2.0);

      if (testPanel2000HighPriorityId && testPanel2000LowPriorityId) {
        expect(result.nomenclatureId).toBe(testPanel2000HighPriorityId);
        expect(result.panelHeight).toBe(2000);
      } else {
        console.log('Skipping test - no panels with different priorities for 2000mm height');
      }
    });
  });

  describe('TC-CAL-001: Расчёт количества панелей', () => {
    it('should calculate 20 panels for 50m fence with 2500mm width', async () => {
      if (!testPanel2000Id) {
        console.log('Skipping - no 2000mm panel in DB');
        return;
      }

      const result = await calculatePanel3D(50, 2.0);

      expect(result.quantity).toBe(20);
      expect(result.panelWidth).toBe(2500);
    });
  });

  describe('TC-CAL-002: Округление вверх', () => {
    it('should round up panel count', async () => {
      if (!testPanel2000Id) {
        console.log('Skipping - no 2000mm panel in DB');
        return;
      }

      const result = await calculatePanel3D(45.5, 2.0);

      expect(result.quantity).toBe(19);
    });
  });

  describe('TC-CAL-003: Расчёт стоимости', () => {
    it('should calculate total price correctly', async () => {
      if (!testPanel2000Id) {
        console.log('Skipping - no 2000mm panel in DB');
        return;
      }

      const result = await calculatePanel3D(50, 2.0);

      expect(result.panelHeight).toBe(2000);
      expect(result.panelWidth).toBe(2500);
      expect(result.quantity).toBe(20);
      expect(result.totalPrice).toBe(result.quantity * result.pricePerUnit);
    });
  });

  describe('TC-CAL-004: Возврат спецификаций', () => {
    it('should return panel specifications', async () => {
      if (!testPanel2000Id) {
        console.log('Skipping - no 2000mm panel in DB');
        return;
      }

      const result = await calculatePanel3D(50, 2.0);

      expect(result.panelHeight).toBe(2000);
      expect(result.panelWidth).toBe(2500);
      expect(result.category).toBe('panel3d');
      expect(result.unit).toBe('шт');
    });
  });

  describe('TC-LKP-004: Панель не найдена', () => {
    it('should throw error when no panel found', async () => {
      await expect(calculatePanel3D(50, 10.0)).rejects.toMatchObject({
        error: 'NO_PANEL_3D_FOUND',
        message: 'Не найдена 3D-панель требуемой высоты',
      });
    });
  });

  describe('Только активные панели', () => {
    it('should not select inactive panels', async () => {
      if (!testPanel2000Id) {
        console.log('Skipping test - no panel with 2000mm height');
        return;
      }

      await prisma.panel3D.update({
        where: { id: testPanel2000Id },
        data: { active: false },
      });

      await cache.delPattern(CACHE_KEYS.PANEL_3D_ACTIVE);

      const result = await calculatePanel3D(50, 2.0);

      expect(result.nomenclatureId).not.toBe(testPanel2000Id);

      await prisma.panel3D.update({
        where: { id: testPanel2000Id },
        data: { active: true },
      });

      await cache.delPattern(CACHE_KEYS.PANEL_3D_ACTIVE);
    });

    it('should select exact match even if lower priority panel is inactive', async () => {
      if (!testPanel2000LowPriorityId || !testPanel2000HighPriorityId) {
        console.log('Skipping test - no panels with 2000mm height');
        return;
      }

      await prisma.panel3D.update({
        where: { id: testPanel2000LowPriorityId },
        data: { active: false },
      });

      const result = await calculatePanel3D(50, 2.0);

      expect(result.nomenclatureId).toBe(testPanel2000HighPriorityId);
      expect(result.panelHeight).toBe(2000);

      await prisma.panel3D.update({
        where: { id: testPanel2000LowPriorityId },
        data: { active: true },
      });
    });
  });

  describe('Учёт validUntil', () => {
    it('should not select expired panels', async () => {
      if (!testPanel2000Id) {
        console.log('Skipping test - no panel with 2000mm height');
        return;
      }

      const expiredDate = new Date();
      expiredDate.setFullYear(expiredDate.getFullYear() - 1);

      await prisma.panel3D.update({
        where: { id: testPanel2000Id },
        data: { validUntil: expiredDate },
      });

      await cache.delPattern(CACHE_KEYS.PANEL_3D_ACTIVE);

      const result = await calculatePanel3D(50, 2.0);

      expect(result.nomenclatureId).not.toBe(testPanel2000Id);
      expect(result.panelHeight).toBeGreaterThanOrEqual(2000);

      await cache.delPattern(CACHE_KEYS.PANEL_3D_ACTIVE);
    });
  });
});
