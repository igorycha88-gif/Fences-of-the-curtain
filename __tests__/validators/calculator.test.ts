import { describe, it, expect } from '@jest/globals';
import {
  fenceCalculatorSchema,
  canopyCalculatorSchema,
  orderSchema,
  contactFormSchema,
  validateLength,
  validateHeight,
} from '@/lib/validators/calculator';

describe('Calculator Validators', () => {
  describe('fenceCalculatorSchema', () => {
    const validInput = {
      fenceTypeId: 'fence-1',
      length: 50,
      height: 2.0,
      postType: 'post-1',
      lagType: 'lag-1',
      lagRows: 2,
      hasGate: false,
      hasWicket: false,
      coating: 'POLYMER_SINGLE',
    };

    it('should validate valid input', () => {
      const result = fenceCalculatorSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should reject length below 10', () => {
      const result = fenceCalculatorSchema.safeParse({ ...validInput, length: 9 });
      expect(result.success).toBe(false);
    });

    it('should reject length above 1000', () => {
      const result = fenceCalculatorSchema.safeParse({ ...validInput, length: 1001 });
      expect(result.success).toBe(false);
    });

    it('should reject height below 1.5', () => {
      const result = fenceCalculatorSchema.safeParse({ ...validInput, height: 1.4 });
      expect(result.success).toBe(false);
    });

    it('should reject height above 3.5', () => {
      const result = fenceCalculatorSchema.safeParse({ ...validInput, height: 3.6 });
      expect(result.success).toBe(false);
    });

    it('should reject invalid lagRows', () => {
      const result = fenceCalculatorSchema.safeParse({ ...validInput, lagRows: 4 });
      expect(result.success).toBe(false);
    });

    it('should accept lagRows 2 and 3', () => {
      expect(fenceCalculatorSchema.safeParse({ ...validInput, lagRows: 2 }).success).toBe(true);
      expect(fenceCalculatorSchema.safeParse({ ...validInput, lagRows: 3 }).success).toBe(true);
    });

    it('should require gateType and gateWidth when hasGate is true', () => {
      const result = fenceCalculatorSchema.safeParse({
        ...validInput,
        hasGate: true,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('ворот');
      }
    });

    it('should pass when hasGate true with gateType and gateWidth', () => {
      const result = fenceCalculatorSchema.safeParse({
        ...validInput,
        hasGate: true,
        gateType: 'SWING',
        gateWidth: 3.5,
      });
      expect(result.success).toBe(true);
    });

    it('should require wicketWidth when hasWicket is true', () => {
      const result = fenceCalculatorSchema.safeParse({
        ...validInput,
        hasWicket: true,
      });
      expect(result.success).toBe(false);
    });

    it('should pass when hasWicket true with wicketWidth', () => {
      const result = fenceCalculatorSchema.safeParse({
        ...validInput,
        hasWicket: true,
        wicketWidth: 1.0,
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid coating', () => {
      const result = fenceCalculatorSchema.safeParse({ ...validInput, coating: 'INVALID' });
      expect(result.success).toBe(false);
    });

    it('should reject missing required fields', () => {
      const result = fenceCalculatorSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('canopyCalculatorSchema', () => {
    const validInput = {
      canopyType: 'single-slope',
      purpose: 'car-1',
      length: 6,
      width: 3,
      height: 3,
      frameMaterial: 'steel',
      roofMaterial: 'profnastil',
      installationType: 'ground',
      hasWaterSystem: false,
    };

    it('should validate valid input', () => {
      const result = canopyCalculatorSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should reject invalid canopyType', () => {
      const result = canopyCalculatorSchema.safeParse({ ...validInput, canopyType: 'invalid' });
      expect(result.success).toBe(false);
    });

    it('should reject invalid purpose', () => {
      const result = canopyCalculatorSchema.safeParse({ ...validInput, purpose: 'invalid' });
      expect(result.success).toBe(false);
    });

    it('should reject length below 3', () => {
      const result = canopyCalculatorSchema.safeParse({ ...validInput, length: 2 });
      expect(result.success).toBe(false);
    });

    it('should reject length above 50', () => {
      const result = canopyCalculatorSchema.safeParse({ ...validInput, length: 51 });
      expect(result.success).toBe(false);
    });

    it('should reject width below 2', () => {
      const result = canopyCalculatorSchema.safeParse({ ...validInput, width: 1 });
      expect(result.success).toBe(false);
    });

    it('should reject height above 6', () => {
      const result = canopyCalculatorSchema.safeParse({ ...validInput, height: 7 });
      expect(result.success).toBe(false);
    });

    it('should reject invalid installationType', () => {
      const result = canopyCalculatorSchema.safeParse({ ...validInput, installationType: 'roof' });
      expect(result.success).toBe(false);
    });

    it('should accept all valid canopy types', () => {
      for (const type of ['single-slope', 'double-slope', 'arch']) {
        const result = canopyCalculatorSchema.safeParse({ ...validInput, canopyType: type });
        expect(result.success).toBe(true);
      }
    });
  });

  describe('orderSchema', () => {
    it('should validate valid order', () => {
      const data = {
        clientName: 'Иван',
        phone: '+79991234567',
        serviceType: 'fence',
        parameters: {},
        calculatedCost: 100000,
      };
      const result = orderSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should validate order with canopy serviceType', () => {
      const data = {
        clientName: 'Иван',
        phone: '+79991234567',
        serviceType: 'canopy',
        parameters: {},
        calculatedCost: 50000,
      };
      const result = orderSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject invalid phone format', () => {
      const data = {
        clientName: 'Иван',
        phone: '89991234567',
        serviceType: 'fence',
        parameters: {},
        calculatedCost: 100000,
      };
      const result = orderSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject invalid serviceType', () => {
      const data = {
        clientName: 'Иван',
        phone: '+79991234567',
        serviceType: 'invalid',
        parameters: {},
        calculatedCost: 100000,
      };
      const result = orderSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject negative calculatedCost', () => {
      const data = {
        clientName: 'Иван',
        phone: '+79991234567',
        serviceType: 'fence',
        parameters: {},
        calculatedCost: -1,
      };
      const result = orderSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should accept empty email', () => {
      const data = {
        clientName: 'Иван',
        phone: '+79991234567',
        email: '',
        serviceType: 'fence',
        parameters: {},
        calculatedCost: 100000,
      };
      const result = orderSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject clientName shorter than 2 chars', () => {
      const data = {
        clientName: 'А',
        phone: '+79991234567',
        serviceType: 'fence',
        parameters: {},
        calculatedCost: 100000,
      };
      const result = orderSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('contactFormSchema', () => {
    it('should validate valid form', () => {
      const data = {
        name: 'Иван',
        phone: '+79991234567',
        message: 'Хочу заказать забор',
      };
      const result = contactFormSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject name shorter than 2', () => {
      const data = { name: 'А', phone: '+79991234567', message: 'Сообщение' };
      const result = contactFormSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject message shorter than 5', () => {
      const data = { name: 'Иван', phone: '+79991234567', message: 'Прив' };
      const result = contactFormSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject message longer than 1000', () => {
      const data = { name: 'Иван', phone: '+79991234567', message: 'А'.repeat(1001) };
      const result = contactFormSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject invalid phone format', () => {
      const data = { name: 'Иван', phone: '12345', message: 'Сообщение' };
      const result = contactFormSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should accept valid email', () => {
      const data = {
        name: 'Иван',
        phone: '+79991234567',
        email: 'ivan@test.com',
        message: 'Сообщение',
      };
      const result = contactFormSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept empty email', () => {
      const data = {
        name: 'Иван',
        phone: '+79991234567',
        email: '',
        message: 'Сообщение',
      };
      const result = contactFormSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe('validateLength', () => {
    it('should return error for empty string', () => {
      expect(validateLength('')).toBe('Укажите длину забора в метрах');
    });

    it('should return error for value below 10', () => {
      expect(validateLength(5)).toBe('Минимальная длина — 10 м');
    });

    it('should return error for value above 1000', () => {
      expect(validateLength(1001)).toBe('Максимальная длина — 1 000 м');
    });

    it('should return null for valid value', () => {
      expect(validateLength(50)).toBeNull();
    });

    it('should return error for NaN', () => {
      expect(validateLength(Number('abc'))).toBe('Введите числовое значение');
    });
  });

  describe('validateHeight', () => {
    it('should return error for empty string', () => {
      expect(validateHeight('')).toBe('Укажите высоту забора в метрах');
    });

    it('should return error for value below 1.5', () => {
      expect(validateHeight(1.0)).toBe('Минимальная высота — 1.5 м');
    });

    it('should return error for value above 3.5', () => {
      expect(validateHeight(4.0)).toBe('Максимальная высота — 3.5 м');
    });

    it('should return null for valid value', () => {
      expect(validateHeight(2.0)).toBeNull();
    });
  });
});
