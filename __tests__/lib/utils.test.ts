import { describe, it, expect } from '@jest/globals';
import { cn, formatCurrency, formatPhoneNumber, getClientIPFromHeaders } from '@/lib/utils';

describe('utils', () => {
  describe('cn', () => {
    it('should merge class names', () => {
      expect(cn('foo', 'bar')).toBe('foo bar');
    });

    it('should handle conditional classes', () => {
      expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
    });

    it('should merge tailwind classes correctly', () => {
      expect(cn('px-4 py-2', 'px-6')).toBe('py-2 px-6');
    });

    it('should handle undefined and null', () => {
      expect(cn('foo', undefined, null, 'bar')).toBe('foo bar');
    });
  });

  describe('formatCurrency', () => {
    it('should format number as RUB currency', () => {
      const result = formatCurrency(100000);
      expect(result).toContain('100');
    });

    it('should format zero', () => {
      const result = formatCurrency(0);
      expect(result).toContain('0');
    });

    it('should not show decimal places', () => {
      const result = formatCurrency(1000.99);
      expect(result).not.toContain('.99');
    });
  });

  describe('formatPhoneNumber', () => {
    it('should format 11-digit phone number', () => {
      expect(formatPhoneNumber('79001234567')).toBe('+7 (900) 123-45-67');
    });

    it('should format phone with + prefix', () => {
      expect(formatPhoneNumber('+79001234567')).toBe('+7 (900) 123-45-67');
    });

    it('should format phone with spaces and dashes', () => {
      expect(formatPhoneNumber('7-900-123-45-67')).toBe('+7 (900) 123-45-67');
    });

    it('should return original for non-11-digit number', () => {
      expect(formatPhoneNumber('12345')).toBe('12345');
    });

    it('should return original for 10-digit number', () => {
      expect(formatPhoneNumber('9001234567')).toBe('9001234567');
    });
  });

  describe('getClientIPFromHeaders', () => {
    it('should return Cloudflare connecting IP first', () => {
      const headers = new Headers({
        'cf-connecting-ip': '1.2.3.4',
        'x-forwarded-for': '5.6.7.8',
        'x-real-ip': '9.10.11.12',
      });

      expect(getClientIPFromHeaders(headers)).toBe('1.2.3.4');
    });

    it('should return x-forwarded-for when no CF IP', () => {
      const headers = new Headers({
        'x-forwarded-for': '5.6.7.8, 9.10.11.12',
        'x-real-ip': '10.11.12.13',
      });

      expect(getClientIPFromHeaders(headers)).toBe('5.6.7.8');
    });

    it('should return x-real-ip when no others', () => {
      const headers = new Headers({
        'x-real-ip': '10.11.12.13',
      });

      expect(getClientIPFromHeaders(headers)).toBe('10.11.12.13');
    });

    it('should return undefined when no IP headers', () => {
      const headers = new Headers();
      expect(getClientIPFromHeaders(headers)).toBeUndefined();
    });

    it('should trim whitespace from IP', () => {
      const headers = new Headers({
        'cf-connecting-ip': '  1.2.3.4  ',
      });

      expect(getClientIPFromHeaders(headers)).toBe('1.2.3.4');
    });
  });
});
