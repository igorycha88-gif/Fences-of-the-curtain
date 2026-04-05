import { describe, it, expect } from '@jest/globals';
import { multiFenceEstimateSchema } from '@/lib/validators/multiFenceEstimate';

describe('multiFenceEstimateSchema', () => {
  const validEstimate = {
    fenceTypeId: 'clm123456789',
    length: 50,
    height: 2.0,
    lagRows: 2,
    coating: 'POLYMER_SINGLE',
  };

  it('should validate single estimate', () => {
    const validInput = {
      estimates: [validEstimate],
    };

    const result = multiFenceEstimateSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('should validate multiple estimates', () => {
    const validInput = {
      estimates: [
        validEstimate,
        { ...validEstimate, fenceTypeId: 'clm987654321', length: 30, height: 1.8 },
        { ...validEstimate, fenceTypeId: 'clm555555555', length: 20, height: 2.5 },
      ],
    };

    const result = multiFenceEstimateSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('should reject empty estimates array', () => {
    const invalidInput = {
      estimates: [],
    };

    const result = multiFenceEstimateSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it('should reject more than 10 estimates', () => {
    const estimates = Array(11).fill(validEstimate);
    const invalidInput = { estimates };

    const result = multiFenceEstimateSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it('should validate estimates with gates', () => {
    const validInput = {
      estimates: [
        {
          ...validEstimate,
          hasGate: true,
          gateType: 'SWING' as const,
          gateWidth: 4.0,
        },
      ],
    };

    const result = multiFenceEstimateSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('should reject gate without type and width', () => {
    const invalidInput = {
      estimates: [
        {
          ...validEstimate,
          hasGate: true,
        },
      ],
    };

    const result = multiFenceEstimateSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it('should validate estimates with wickets', () => {
    const validInput = {
      estimates: [
        {
          ...validEstimate,
          hasWicket: true,
          wicketWidth: 1.0,
        },
      ],
    };

    const result = multiFenceEstimateSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('should validate estimates with picket parameters', () => {
    const validInput = {
      estimates: [
        {
          ...validEstimate,
          picketProfileType: 'П-образный',
          picketCoating: 'Полимерное',
          picketStep: 5,
          picketMountingType: 'SINGLE' as const,
        },
      ],
    };

    const result = multiFenceEstimateSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('should reject estimates with invalid fenceTypeId', () => {
    const invalidInput = {
      estimates: [
        {
          ...validEstimate,
          fenceTypeId: '',
        },
      ],
    };

    const result = multiFenceEstimateSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it('should reject estimates with invalid length', () => {
    const invalidInput = {
      estimates: [
        {
          ...validEstimate,
          length: 1500,
        },
      ],
    };

    const result = multiFenceEstimateSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it('should reject estimates with invalid height', () => {
    const invalidInput = {
      estimates: [
        {
          ...validEstimate,
          height: 5.0,
        },
      ],
    };

    const result = multiFenceEstimateSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });
});
