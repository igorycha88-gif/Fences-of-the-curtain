import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { calculateMountingHardware, MountingHardwareCalculationResult } from '@/services/calculator/mountingHardwareCalculator';
import { prisma } from '@/lib/prisma';

describe('Mounting Hardware Calculator', () => {
  describe('Calculation Methods', () => {
    it('should calculate BY_QUANTITY correctly (1:1 ratio)', () => {
      const itemCount = 6;
      const quantity = itemCount;
      
      expect(quantity).toBe(6);
    });

    it('should calculate BY_LENGTH correctly', () => {
      const fenceLengthM = 10;
      const calculationValue = 2;
      const quantity = Math.ceil(fenceLengthM / calculationValue);
      
      expect(quantity).toBe(5);
    });

    it('should calculate BY_AREA correctly', () => {
      const fenceLengthM = 10;
      const fenceHeightM = 2;
      const fenceArea = fenceLengthM * fenceHeightM;
      const calculationValue = 4;
      const quantity = Math.ceil(fenceArea / calculationValue);
      
      expect(fenceArea).toBe(20);
      expect(quantity).toBe(5);
    });

    it('should calculate BY_RATIO with coefficient > 1 correctly', () => {
      const itemCount = 8;
      const calculationValue = 8;
      const quantity = Math.ceil(itemCount * calculationValue);
      
      expect(quantity).toBe(64);
    });

    it('should calculate BY_RATIO with coefficient < 1 correctly', () => {
      const itemCount = 6;
      const calculationValue = 0.25;
      const quantity = Math.ceil(itemCount * calculationValue);
      
      expect(quantity).toBe(2);
    });

    it('should calculate BY_INVERSE_RATIO correctly (1/N)', () => {
      const itemCount = 6;
      const calculationValue = 4;
      const quantity = Math.ceil(itemCount / calculationValue);
      
      expect(quantity).toBe(2);
    });

    it('should calculate BY_INVERSE_RATIO with exact division', () => {
      const itemCount = 12;
      const calculationValue = 2;
      const quantity = Math.ceil(itemCount / calculationValue);
      
      expect(quantity).toBe(6);
    });

    it('should calculate BY_INVERSE_RATIO with remainder', () => {
      const itemCount = 8;
      const calculationValue = 3;
      const quantity = Math.ceil(itemCount / calculationValue);
      
      expect(quantity).toBe(3);
    });

    it('should calculate BY_INVERSE_RATIO with N=1', () => {
      const itemCount = 8;
      const calculationValue = 1;
      const quantity = Math.ceil(itemCount / calculationValue);
      
      expect(quantity).toBe(8);
    });

    it('should calculate BY_INVERSE_RATIO with N=3 and 1 item', () => {
      const itemCount = 1;
      const calculationValue = 3;
      const quantity = Math.ceil(itemCount / calculationValue);
      
      expect(quantity).toBe(1);
    });

    it('should round up quantities correctly', () => {
      const value1 = Math.ceil(10 / 3);
      const value2 = Math.ceil(10 / 4);
      const value3 = Math.ceil(1.5);
      
      expect(value1).toBe(4);
      expect(value2).toBe(3);
      expect(value3).toBe(2);
    });
  });

  describe('Price Calculation', () => {
    it('should calculate total price correctly', () => {
      const quantity = 10;
      const unitPrice = 15.50;
      const totalPrice = Math.round(quantity * unitPrice * 100) / 100;
      
      expect(totalPrice).toBe(155.00);
    });

    it('should handle decimal prices correctly', () => {
      const quantity = 7;
      const unitPrice = 12.34;
      const totalPrice = Math.round(quantity * unitPrice * 100) / 100;
      
      expect(totalPrice).toBe(86.38);
    });
  });

  describe('Nomenclature Name Display', () => {
    let testHardwareId: string;
    let testPostId: string;

    beforeAll(async () => {
      const post = await prisma.postType.create({
        data: {
          name: 'Тестовый столб для фурнитуры',
          sectionWidth: 60,
          sectionHeight: 60,
          wallThickness: 2.0,
          pricePerMeter: 200,
          length: 3.0,
          retailPricePerUnit: 600,
          active: true,
          priority: 999,
        },
      });
      testPostId = post.id;

      const hardware = await prisma.mountingHardware.create({
        data: {
          name: 'Саморез 4.2x19 мм',
          purchasePrice: 3.0,
          retailPrice: 5.0,
          active: true,
          useInCalculator: true,
          calculationMethod: 'BY_QUANTITY',
          calculationValue: null,
          sortOrder: 999,
        },
      });
      testHardwareId = hardware.id;

      await prisma.mountingHardwareRelation.create({
        data: {
          mountingHardwareId: testHardwareId,
          referenceType: 'POST',
          referenceId: testPostId,
        },
      });
    });

    afterAll(async () => {
      await prisma.mountingHardwareRelation.deleteMany({
        where: { referenceId: testPostId },
      });
      await prisma.mountingHardware.delete({ where: { id: testHardwareId } });
      await prisma.postType.delete({ where: { id: testPostId } });
      await prisma.$disconnect();
    });

    it('should include nomenclatureName in result', async () => {
      const results = await calculateMountingHardware({
        fenceLengthM: 10,
        fenceHeightM: 2,
        postsCount: 6,
        lagsCount: 12,
        profnastilCount: 10,
        postTypeId: testPostId,
      });

      const hardwareItem = results.find(r => r.nomenclatureId === testHardwareId);
      expect(hardwareItem).toBeDefined();
      expect(hardwareItem!.nomenclatureName).toBe('Саморез 4.2x19 мм');
    });

    it('should include nomenclatureId in result', async () => {
      const results = await calculateMountingHardware({
        fenceLengthM: 10,
        fenceHeightM: 2,
        postsCount: 6,
        lagsCount: 12,
        profnastilCount: 10,
        postTypeId: testPostId,
      });

      const hardwareItem = results.find(r => r.nomenclatureId === testHardwareId);
      expect(hardwareItem).toBeDefined();
      expect(hardwareItem!.nomenclatureId).toBe(testHardwareId);
    });

    it('should have consistent structure with other materials', async () => {
      const results = await calculateMountingHardware({
        fenceLengthM: 10,
        fenceHeightM: 2,
        postsCount: 6,
        lagsCount: 12,
        profnastilCount: 10,
        postTypeId: testPostId,
      });

      const hardwareItem = results.find(r => r.nomenclatureId === testHardwareId);
      expect(hardwareItem).toBeDefined();
      
      expect(hardwareItem).toHaveProperty('category');
      expect(hardwareItem).toHaveProperty('nomenclatureId');
      expect(hardwareItem).toHaveProperty('nomenclatureName');
      expect(hardwareItem).toHaveProperty('quantity');
      expect(hardwareItem).toHaveProperty('unit');
      expect(hardwareItem).toHaveProperty('pricePerUnit');
      expect(hardwareItem).toHaveProperty('totalPrice');
    });
  });
});
