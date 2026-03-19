import { safeParseInt, safeParseIntWithMax } from '@/lib/parse-params'

describe('safeParseInt', () => {
  it('should parse valid positive integers', () => {
    expect(safeParseInt('42', 1)).toBe(42)
    expect(safeParseInt('1', 1)).toBe(1)
    expect(safeParseInt('100', 1)).toBe(100)
  })

  it('should return fallback for null', () => {
    expect(safeParseInt(null, 5)).toBe(5)
  })

  it('should return fallback for NaN strings', () => {
    expect(safeParseInt('abc', 10)).toBe(10)
    expect(safeParseInt('', 10)).toBe(10)
  })

  it('should return fallback for negative numbers', () => {
    expect(safeParseInt('-1', 1)).toBe(1)
    expect(safeParseInt('-100', 1)).toBe(1)
  })

  it('should accept zero as valid', () => {
    expect(safeParseInt('0', 1)).toBe(0)
  })

  it('should parse float strings as integers', () => {
    expect(safeParseInt('3.14', 1)).toBe(3)
  })

  it('should handle strings with spaces', () => {
    expect(safeParseInt(' 42 ', 1)).toBe(42)
  })

  it('should parse mixed strings (numbers at start)', () => {
    expect(safeParseInt('42abc', 1)).toBe(42)
  })

  it('should handle very large numbers', () => {
    expect(safeParseInt('999999999999', 1)).toBe(999999999999)
  })

  it('should return fallback for undefined-like values', () => {
    expect(safeParseInt(null, 20)).toBe(20)
  })
})

describe('safeParseIntWithMax', () => {
  it('should return value when within max', () => {
    expect(safeParseIntWithMax('50', 20, 100)).toBe(50)
  })

  it('should limit value to max when exceeds', () => {
    expect(safeParseIntWithMax('150', 20, 100)).toBe(100)
  })

  it('should return fallback for negative values', () => {
    expect(safeParseIntWithMax('-5', 20, 100)).toBe(20)
  })

  it('should return fallback for null', () => {
    expect(safeParseIntWithMax(null, 20, 100)).toBe(20)
  })

  it('should return fallback for NaN strings', () => {
    expect(safeParseIntWithMax('abc', 20, 100)).toBe(20)
  })

  it('should accept zero as valid', () => {
    expect(safeParseIntWithMax('0', 20, 100)).toBe(0)
  })

  it('should limit large values to max', () => {
    expect(safeParseIntWithMax('1000', 20, 100)).toBe(100)
  })
})
