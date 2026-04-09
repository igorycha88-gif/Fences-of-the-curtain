import { describe, it, expect } from '@jest/globals';
import { validateLength } from '@/lib/validators/calculator';

describe('validateLength', () => {
  it('should return error for empty string', () => {
    expect(validateLength('')).toBe('Укажите длину забора в метрах');
  });

  it('should return error for value less than 10', () => {
    expect(validateLength(5)).toBe('Минимальная длина — 10 м');
    expect(validateLength(9)).toBe('Минимальная длина — 10 м');
    expect(validateLength(0)).toBe('Минимальная длина — 10 м');
    expect(validateLength(-5)).toBe('Минимальная длина — 10 м');
  });

  it('should return error for value greater than 1000', () => {
    expect(validateLength(1001)).toBe('Максимальная длина — 1 000 м');
    expect(validateLength(5000)).toBe('Максимальная длина — 1 000 м');
  });

  it('should return error for NaN', () => {
    expect(validateLength(Number('abc'))).toBe('Введите числовое значение');
    expect(validateLength(Number(undefined))).toBe('Введите числовое значение');
  });

  it('should return null for valid values', () => {
    expect(validateLength(10)).toBeNull();
    expect(validateLength(50)).toBeNull();
    expect(validateLength(100)).toBeNull();
    expect(validateLength(500)).toBeNull();
    expect(validateLength(1000)).toBeNull();
  });

  it('should return null for boundary values', () => {
    expect(validateLength(10)).toBeNull();
    expect(validateLength(1000)).toBeNull();
  });
});
