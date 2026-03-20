// Mock DOMPurify for Node.js environment
jest.mock('isomorphic-dompurify', () => ({
  sanitize: (input: string) => {
    // Simple mock implementation that removes HTML tags but keeps content
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<\/?[^>]+(>|$)/g, '');
  },
}));

import { sanitizeHtml, sanitizeObject } from '@/lib/sanitize';

describe('Sanitization Utils', () => {
  describe('sanitizeHtml', () => {
    it('should remove script tags', () => {
      const input = '<script>alert(1)</script>';
      const result = sanitizeHtml(input);
      expect(result).toBe('');
    });

    it('should remove script tags from mixed content', () => {
      const input = 'Hello <script>alert(1)</script> World';
      const result = sanitizeHtml(input);
      expect(result).toBe('Hello  World');
      expect(result).not.toContain('<script>');
    });

    it('should remove event handlers', () => {
      const input = '<img src=x onerror=alert(1)>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('onerror');
      expect(result).not.toContain('alert');
    });

    it('should remove all HTML tags', () => {
      const input = '<b>Bold</b> <i>Italic</i> <u>Underline</u>';
      const result = sanitizeHtml(input);
      expect(result).toBe('Bold Italic Underline');
    });

    it('should preserve plain text', () => {
      const input = 'Just plain text without HTML';
      const result = sanitizeHtml(input);
      expect(result).toBe('Just plain text without HTML');
    });

    it('should handle nested script tags', () => {
      const input = '<script><script>alert(1)</script></script>';
      const result = sanitizeHtml(input);
      expect(result).toBe('');
    });

    it('should handle javascript: protocol', () => {
      const input = '<a href="javascript:alert(1)">Click</a>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('javascript:');
    });

    it('should handle data: URIs', () => {
      const input = '<img src="data:text/html,<script>alert(1)</script>">';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('data:');
    });

    it('should handle SVG with script', () => {
      const input = '<svg onload=alert(1)>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('onload');
    });

    it('should handle special characters', () => {
      const input = 'Test &amp; <>&"\'';
      const result = sanitizeHtml(input);
      expect(result).toBeTruthy();
    });
  });

  describe('sanitizeObject', () => {
    it('should sanitize all string fields in object', () => {
      const input = {
        name: '<script>alert(1)</script>',
        email: 'test@test.com',
        message: 'Hello <b>world</b>!',
      };
      
      const result = sanitizeObject(input);
      
      expect(result.name).toBe('');
      expect(result.email).toBe('test@test.com');
      expect(result.message).toBe('Hello world!');
    });

    it('should handle nested objects', () => {
      const input = {
        user: {
          name: '<script>bad</script>User',
          profile: {
            bio: 'Bio<script>xss</script>',
          },
        },
      };
      
      const result = sanitizeObject(input) as any;
      
      expect(result.user.name).toBe('User');
      expect(result.user.profile.bio).toBe('Bio');
    });

    it('should handle arrays', () => {
      const input = {
        items: ['<script>1</script>', 'normal', '<b>bold</b>'],
      };
      
      const result = sanitizeObject(input) as any;
      
      // Мок полностью удаляет теги вместе с содержимым
      expect(result.items[0]).toBe('');  // <script>1</script> -> ''
      expect(result.items[1]).toBe('normal');
      expect(result.items[2]).toBe('bold');  // <b>bold</b> -> 'bold'
    });

    it('should preserve non-string values', () => {
      const input = {
        name: 'Test',
        age: 25,
        active: true,
        data: null,
      };
      
      const result = sanitizeObject(input);
      
      expect(result.name).toBe('Test');
      expect(result.age).toBe(25);
      expect(result.active).toBe(true);
      expect(result.data).toBeNull();
    });

    it('should handle empty object', () => {
      const input = {};
      const result = sanitizeObject(input);
      expect(result).toEqual({});
    });
  });
});
