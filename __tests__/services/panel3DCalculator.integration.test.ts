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
    const existingPanels = await prisma.panel3D.findMany({
      orderBy: [{ priority: 'asc' }, { panelHeight: 'asc' }],
    });

    const panels2000 = existingPanels.filter(p => p.panelHeight === 2000);
    testPanel2000LowPriorityId = panels2000.find(p => p.priority === 10)?.id || '';
    testPanel2000HighPriorityId = panels2000.find(p => p.priority === 0)?.id || '';
    testPanel2000Id = panels2000.length > 0 ? panels2000[0].id : '';

    testPanel2500Id = existingPanels.find(p => p.panelHeight === 2500)?.id || '';
    testPanel3000Id = existingPanels.find(p => p.panelHeight === 3000)?.id || '';

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
      const result = await calculatePanel3D(50, 2.0);

      console.log('TC-LKP-001:', {
        testPanel2000Id,
        resultId: result.nomenclatureId,
        expectedId: testPanel2000Id,
        match: result.nomenclatureId === testPanel2000Id,
        panelHeight: result.panelHeight,
        panelWidth: result.panelWidth
      });

      if (testPanel2000Id) {
        expect(result.nomenclatureId).toBe(testPanel2000Id);
        expect(result.panelHeight).toBe(2000);
        expect(result.panelWidth).toBe(2500);
      }
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
      const result = await calculatePanel3D(50, 2.0);

      console.log('TC-CAL-001:', {
        quantity: result.quantity,
        panelWidth: result.panelWidth,
        expected: 20
      });

      expect(result.quantity).toBe(20);
      expect(result.panelWidth).toBe(2500);
    });
  });

  describe('TC-CAL-002: Округление вверх', () => {
    it('should round up panel count', async () => {
      const result = await calculatePanel3D(45.5, 2.0);

      expect(result.quantity).toBe(19);
    });
  });

  describe('TC-CAL-003: Расчёт стоимости', () => {
    it('should calculate total price correctly', async () => {
      const result = await calculatePanel3D(50, 2.0);

      expect(result.panelHeight).toBe(2000);
      expect(result.panelWidth).toBe(2500);
      expect(result.quantity).toBe(20);
      expect(result.totalPrice).toBe(result.quantity * result.pricePerUnit);
    });
  });

  describe('TC-CAL-004: Возврат спецификаций', () => {
    it('should return panel specifications', async () => {
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
      await prisma.panel3D.update({
        where: { id: testPanel2000Id },
        data: { active: false },
      });

      const result = await calculatePanel3D(50, 2.0);

      expect(result.nomenclatureId).not.toBe(testPanel2000Id);

      await prisma.panel3D.update({
        where: { id: testPanel2000Id },
        data: { active: true },
      });
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
      const expiredDate = new Date();
      expiredDate.setFullYear(expiredDate.getFullYear() - 1);

      await prisma.panel3D.update({
        where: { id: testPanel2000Id },
        data: { validUntil: expiredDate },
      });

      const result = await calculatePanel3D(50, 2.0);

      expect(result.nomenclatureId).not.toBe(testPanel2000Id);
      expect(result.panelHeight).toBeGreaterThanOrEqual(2000);
    });
  });
});
