import { describe, it, expect } from '@jest/globals';
import {
  trussCalculationRequestSchema,
  saveTrussCalculationSchema,
  trussProfileCreateSchema,
  trussRoofCoveringCreateSchema,
} from '@/lib/validators/trussCalculator';

describe('TrussCalculator Validators', () => {
  describe('trussCalculationRequestSchema', () => {
    const validInput = {
      canopyType: 'SINGLE_SLOPE',
      width: 6000,
      length: 8000,
      ridgeHeight: 3500,
      wallHeight: 2500,
      trussSpacing: 2000,
      roofCoveringId: 'rc-1',
      postProfileId: 'pp-1',
      crossbeamProfileId: 'cp-1',
      strutProfileId: 'sp-1',
    };

    it('should validate valid input', () => {
      const result = trussCalculationRequestSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should validate DOUBLE_SLOPE without wallHeight', () => {
      const data = { ...validInput, canopyType: 'DOUBLE_SLOPE' };
      delete (data as any).wallHeight;
      const result = trussCalculationRequestSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject wallHeight >= ridgeHeight for SINGLE_SLOPE', () => {
      const result = trussCalculationRequestSchema.safeParse({
        ...validInput,
        wallHeight: 3500,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('коньке');
      }
    });

    it('should accept wallHeight < ridgeHeight for SINGLE_SLOPE', () => {
      const result = trussCalculationRequestSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should allow wallHeight >= ridgeHeight for DOUBLE_SLOPE', () => {
      const result = trussCalculationRequestSchema.safeParse({
        ...validInput,
        canopyType: 'DOUBLE_SLOPE',
        wallHeight: 4000,
        ridgeHeight: 3000,
      });
      expect(result.success).toBe(true);
    });

    it('should allow wallHeight >= ridgeHeight for ARCH', () => {
      const result = trussCalculationRequestSchema.safeParse({
        ...validInput,
        canopyType: 'ARCH',
        wallHeight: 4000,
        ridgeHeight: 3000,
      });
      expect(result.success).toBe(true);
    });

    it('should reject width below 2000', () => {
      const result = trussCalculationRequestSchema.safeParse({ ...validInput, width: 1999 });
      expect(result.success).toBe(false);
    });

    it('should reject width above 12000', () => {
      const result = trussCalculationRequestSchema.safeParse({ ...validInput, width: 12001 });
      expect(result.success).toBe(false);
    });

    it('should reject invalid canopyType', () => {
      const result = trussCalculationRequestSchema.safeParse({ ...validInput, canopyType: 'INVALID' });
      expect(result.success).toBe(false);
    });

    it('should accept empty string for topChordProfileId', () => {
      const result = trussCalculationRequestSchema.safeParse({
        ...validInput,
        topChordProfileId: '',
      });
      expect(result.success).toBe(true);
    });

    it('should accept empty string for archProfileId', () => {
      const result = trussCalculationRequestSchema.safeParse({
        ...validInput,
        archProfileId: '',
      });
      expect(result.success).toBe(true);
    });

    it('should reject wallHeight >= ridgeHeight for SINGLE_SLOPE_CURVED', () => {
      const result = trussCalculationRequestSchema.safeParse({
        ...validInput,
        canopyType: 'SINGLE_SLOPE_CURVED',
        wallHeight: 4000,
        ridgeHeight: 3000,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('saveTrussCalculationSchema', () => {
    const validInput = {
      canopyType: 'DOUBLE_SLOPE',
      width: 6000,
      length: 8000,
      ridgeHeight: 3500,
      trussSpacing: 2000,
      roofCoveringId: 'rc-1',
      postProfileId: 'pp-1',
      crossbeamProfileId: 'cp-1',
      strutProfileId: 'sp-1',
      name: 'Мой навес',
    };

    it('should validate valid input', () => {
      const result = saveTrussCalculationSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should validate without name', () => {
      const data = { ...validInput };
      delete (data as any).name;
      const result = saveTrussCalculationSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject name over 200 chars', () => {
      const result = saveTrussCalculationSchema.safeParse({
        ...validInput,
        name: 'А'.repeat(201),
      });
      expect(result.success).toBe(false);
    });

    it('should validate wallHeight refinement for SINGLE_SLOPE', () => {
      const result = saveTrussCalculationSchema.safeParse({
        ...validInput,
        canopyType: 'SINGLE_SLOPE',
        wallHeight: 4000,
        ridgeHeight: 3000,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('trussProfileCreateSchema', () => {
    const validInput = {
      name: 'Профиль 60x40x3',
      category: 'POST',
      sectionWidth: 60,
      sectionHeight: 40,
      wallThickness: 3,
      sectionArea: 5.51,
      momentOfInertiaX: 18.5,
      momentOfInertiaY: 10.2,
      sectionModulusX: 9.25,
      sectionModulusY: 5.1,
      radiusOfGyrationX: 18.3,
      radiusOfGyrationY: 13.6,
      weightPerMeter: 4.33,
    };

    it('should validate valid input', () => {
      const result = trussProfileCreateSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should apply default values', () => {
      const result = trussProfileCreateSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.length).toBe(6.0);
        expect(result.data.steelGrade).toBe('S235');
        expect(result.data.yieldStrength).toBe(235);
        expect(result.data.isActive).toBe(true);
        expect(result.data.priority).toBe(0);
        expect(result.data.retailPricePerMeter).toBe(0);
        expect(result.data.retailPricePerUnit).toBe(0);
      }
    });

    it('should reject empty name', () => {
      const result = trussProfileCreateSchema.safeParse({ ...validInput, name: '' });
      expect(result.success).toBe(false);
    });

    it('should reject name over 100 chars', () => {
      const result = trussProfileCreateSchema.safeParse({ ...validInput, name: 'А'.repeat(101) });
      expect(result.success).toBe(false);
    });

    it('should reject invalid category', () => {
      const result = trussProfileCreateSchema.safeParse({ ...validInput, category: 'INVALID' });
      expect(result.success).toBe(false);
    });

    it('should reject negative sectionWidth', () => {
      const result = trussProfileCreateSchema.safeParse({ ...validInput, sectionWidth: -1 });
      expect(result.success).toBe(false);
    });

    it('should accept all valid categories', () => {
      for (const cat of ['POST', 'CROSSBEAM', 'STRUT', 'ARCH']) {
        const result = trussProfileCreateSchema.safeParse({ ...validInput, category: cat });
        expect(result.success).toBe(true);
      }
    });
  });

  describe('trussRoofCoveringCreateSchema', () => {
    const validInput = {
      name: 'Профнастил С-21',
      weightPerSqm: 5.5,
      retailPricePerSqm: 350,
    };

    it('should validate valid input', () => {
      const result = trussRoofCoveringCreateSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should apply default values', () => {
      const result = trussRoofCoveringCreateSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isActive).toBe(true);
        expect(result.data.priority).toBe(0);
      }
    });

    it('should reject empty name', () => {
      const result = trussRoofCoveringCreateSchema.safeParse({ ...validInput, name: '' });
      expect(result.success).toBe(false);
    });

    it('should reject name over 200 chars', () => {
      const result = trussRoofCoveringCreateSchema.safeParse({ ...validInput, name: 'А'.repeat(201) });
      expect(result.success).toBe(false);
    });

    it('should reject non-positive weightPerSqm', () => {
      const result = trussRoofCoveringCreateSchema.safeParse({ ...validInput, weightPerSqm: 0 });
      expect(result.success).toBe(false);
    });

    it('should reject non-positive retailPricePerSqm', () => {
      const result = trussRoofCoveringCreateSchema.safeParse({ ...validInput, retailPricePerSqm: 0 });
      expect(result.success).toBe(false);
    });

    it('should validate with all optional fields', () => {
      const data = {
        ...validInput,
        description: 'Описание',
        thickness: 0.5,
        width: 1000,
        usefulWidth: 900,
        standardLength: 2000,
        coating: 'Полимерное',
        coatingType: 'PUR',
        color: 'RR 23',
        purchasePricePerSqm: 250,
        image: '/img.png',
      };
      const result = trussRoofCoveringCreateSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });
});
