import { describe, it, expect } from '@jest/globals';
import { fenceEstimateSchema } from '@/lib/validators/fenceEstimate';

describe('fenceEstimateSchema', () => {
  it('should validate valid input', () => {
    const validInput = {
      fenceTypeId: 'clm123456789',
      length: 50,
      height: 2.0,
      lagRows: 2,
      coating: 'POLYMER_SINGLE',
    };

    const result = fenceEstimateSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('should validate with 3 lag rows', () => {
    const validInput = {
      fenceTypeId: 'clm123456789',
      length: 50,
      height: 2.0,
      lagRows: 3,
      coating: 'POLYMER_SINGLE',
    };

    const result = fenceEstimateSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('should reject invalid lagRows', () => {
    const invalidInput = {
      fenceTypeId: 'clm123456789',
      length: 50,
      height: 2.0,
      lagRows: 4,
      coating: 'POLYMER_SINGLE',
    };

    const result = fenceEstimateSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it('should reject length below minimum', () => {
    const invalidInput = {
      fenceTypeId: 'clm123456789',
      length: 0.5,
      height: 2.0,
      lagRows: 2,
      coating: 'POLYMER_SINGLE',
    };

    const result = fenceEstimateSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it('should reject length above maximum', () => {
    const invalidInput = {
      fenceTypeId: 'clm123456789',
      length: 1500,
      height: 2.0,
      lagRows: 2,
      coating: 'POLYMER_SINGLE',
    };

    const result = fenceEstimateSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it('should reject height below minimum', () => {
    const invalidInput = {
      fenceTypeId: 'clm123456789',
      length: 50,
      height: 1.0,
      lagRows: 2,
      coating: 'POLYMER_SINGLE',
    };

    const result = fenceEstimateSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it('should reject height above maximum', () => {
    const invalidInput = {
      fenceTypeId: 'clm123456789',
      length: 50,
      height: 4.0,
      lagRows: 2,
      coating: 'POLYMER_SINGLE',
    };

    const result = fenceEstimateSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it('should reject empty fenceTypeId', () => {
    const invalidInput = {
      fenceTypeId: '',
      length: 50,
      height: 2.0,
      lagRows: 2,
      coating: 'POLYMER_SINGLE',
    };

    const result = fenceEstimateSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it('should validate with wicket', () => {
    const validInput = {
      fenceTypeId: 'clm123456789',
      length: 50,
      height: 2.0,
      lagRows: 2,
      coating: 'POLYMER_SINGLE',
      hasWicket: true,
      wicketWidth: 1.0,
    };

    const result = fenceEstimateSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('should reject wicket without width', () => {
    const invalidInput = {
      fenceTypeId: 'clm123456789',
      length: 50,
      height: 2.0,
      lagRows: 2,
      coating: 'POLYMER_SINGLE',
      hasWicket: true,
    };

    const result = fenceEstimateSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });
});
