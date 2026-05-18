import { describe, it, expect } from '@jest/globals';
import { gateEstimateSchema } from '@/lib/validators/gateEstimate';

describe('gateEstimateSchema', () => {
  it('should validate valid input with one gate', () => {
    const validInput = {
      height: 2.0,
      needsInstallation: true,
      gates: [{ gateType: 'SWING', gateWidth: 4.0, hasAutomation: false }],
      wickets: [],
    };

    const result = gateEstimateSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('should validate valid input with one wicket', () => {
    const validInput = {
      height: 2.0,
      needsInstallation: false,
      gates: [],
      wickets: [{ wicketWidth: 1.0 }],
    };

    const result = gateEstimateSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('should validate valid input with 2 gates and 2 wickets', () => {
    const validInput = {
      height: 2.0,
      needsInstallation: true,
      gates: [
        { gateType: 'SWING', gateWidth: 4.0, hasAutomation: false },
        { gateType: 'SLIDING', gateWidth: 5.0, hasAutomation: true, automationId: 'clx123' },
      ],
      wickets: [
        { wicketWidth: 1.0 },
        { wicketWidth: 1.2 },
      ],
    };

    const result = gateEstimateSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('should reject empty gates and wickets', () => {
    const invalidInput = {
      height: 2.0,
      needsInstallation: true,
      gates: [],
      wickets: [],
    };

    const result = gateEstimateSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it('should reject height below minimum', () => {
    const invalidInput = {
      height: 1.0,
      needsInstallation: true,
      gates: [{ gateType: 'SWING', gateWidth: 4.0, hasAutomation: false }],
      wickets: [],
    };

    const result = gateEstimateSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it('should reject height above maximum', () => {
    const invalidInput = {
      height: 4.0,
      needsInstallation: true,
      gates: [{ gateType: 'SWING', gateWidth: 4.0, hasAutomation: false }],
      wickets: [],
    };

    const result = gateEstimateSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it('should reject more than 2 gates', () => {
    const invalidInput = {
      height: 2.0,
      needsInstallation: true,
      gates: [
        { gateType: 'SWING', gateWidth: 4.0, hasAutomation: false },
        { gateType: 'SWING', gateWidth: 3.0, hasAutomation: false },
        { gateType: 'SLIDING', gateWidth: 5.0, hasAutomation: false },
      ],
      wickets: [],
    };

    const result = gateEstimateSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it('should reject more than 2 wickets', () => {
    const invalidInput = {
      height: 2.0,
      needsInstallation: true,
      gates: [],
      wickets: [
        { wicketWidth: 1.0 },
        { wicketWidth: 1.1 },
        { wicketWidth: 1.2 },
      ],
    };

    const result = gateEstimateSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it('should reject automation without automationId', () => {
    const invalidInput = {
      height: 2.0,
      needsInstallation: true,
      gates: [{ gateType: 'SLIDING', gateWidth: 5.0, hasAutomation: true }],
      wickets: [],
    };

    const result = gateEstimateSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it('should reject automation for SWING gates', () => {
    const invalidInput = {
      height: 2.0,
      needsInstallation: true,
      gates: [{ gateType: 'SWING', gateWidth: 4.0, hasAutomation: true, automationId: 'clx123' }],
      wickets: [],
    };

    const result = gateEstimateSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it('should reject gate width below minimum', () => {
    const invalidInput = {
      height: 2.0,
      needsInstallation: true,
      gates: [{ gateType: 'SWING', gateWidth: 1.0, hasAutomation: false }],
      wickets: [],
    };

    const result = gateEstimateSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it('should reject wicket width above maximum', () => {
    const invalidInput = {
      height: 2.0,
      needsInstallation: true,
      gates: [{ gateType: 'SWING', gateWidth: 4.0, hasAutomation: false }],
      wickets: [{ wicketWidth: 2.0 }],
    };

    const result = gateEstimateSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it('should default needsInstallation to true when omitted', () => {
    const input = {
      height: 2.0,
      gates: [{ gateType: 'SWING', gateWidth: 4.0, hasAutomation: false }],
      wickets: [],
    };

    const result = gateEstimateSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.needsInstallation).toBe(true);
    }
  });

  it('should default gates to empty array when omitted', () => {
    const input = {
      height: 2.0,
      wickets: [{ wicketWidth: 1.0 }],
    };

    const result = gateEstimateSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.gates).toEqual([]);
    }
  });
});
