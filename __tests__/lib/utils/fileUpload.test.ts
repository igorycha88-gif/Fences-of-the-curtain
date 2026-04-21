import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import {
  validateImageFile,
  sanitizeFilename,
  generateUniqueFilename,
  getUploadPath,
} from '@/lib/utils/fileUpload';

describe('FileUpload Utilities', () => {
  describe('validateImageFile', () => {
    it('should validate a valid JPEG file', () => {
      const file = new File(['content'], 'photo.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 1024 * 1024 });
      const result = validateImageFile(file);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should validate PNG file', () => {
      const file = new File(['content'], 'photo.png', { type: 'image/png' });
      Object.defineProperty(file, 'size', { value: 500000 });
      const result = validateImageFile(file);
      expect(result.valid).toBe(true);
    });

    it('should validate WebP file', () => {
      const file = new File(['content'], 'photo.webp', { type: 'image/webp' });
      Object.defineProperty(file, 'size', { value: 500000 });
      const result = validateImageFile(file);
      expect(result.valid).toBe(true);
    });

    it('should validate GIF file', () => {
      const file = new File(['content'], 'photo.gif', { type: 'image/gif' });
      Object.defineProperty(file, 'size', { value: 500000 });
      const result = validateImageFile(file);
      expect(result.valid).toBe(true);
    });

    it('should reject invalid MIME type', () => {
      const file = new File(['content'], 'doc.pdf', { type: 'application/pdf' });
      Object.defineProperty(file, 'size', { value: 500000 });
      const result = validateImageFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('JPEG');
    });

    it('should reject file exceeding 5MB', () => {
      const file = new File(['content'], 'photo.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 6 * 1024 * 1024 });
      const result = validateImageFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('5 MB');
    });

    it('should accept file exactly at 5MB limit', () => {
      const file = new File(['content'], 'photo.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 5 * 1024 * 1024 });
      const result = validateImageFile(file);
      expect(result.valid).toBe(true);
    });
  });

  describe('sanitizeFilename', () => {
    it('should remove special characters', () => {
      expect(sanitizeFilename('my file@name.jpg')).not.toContain('@');
    });

    it('should replace special chars with dashes', () => {
      const result = sanitizeFilename('my file name.jpg');
      expect(result).toContain('-');
    });

    it('should keep extension', () => {
      expect(sanitizeFilename('photo.png')).toMatch(/\.png$/);
    });

    it('should handle unicode characters', () => {
      const result = sanitizeFilename('Фото забора.jpg');
      expect(result).toContain('.jpg');
    });

    it('should truncate long names to 50 chars plus extension', () => {
      const longName = 'А'.repeat(100) + '.jpg';
      const result = sanitizeFilename(longName);
      const namePart = result.replace('.jpg', '');
      expect(namePart.length).toBeLessThanOrEqual(50);
    });

    it('should collapse multiple dashes', () => {
      const result = sanitizeFilename('a   b.jpg');
      expect(result).not.toContain('---');
    });
  });

  describe('generateUniqueFilename', () => {
    it('should generate filename with UUID', () => {
      const result = generateUniqueFilename('.jpg');
      expect(result).toMatch(/^[0-9a-f-]{36}\.jpg$/);
    });

    it('should preserve extension', () => {
      expect(generateUniqueFilename('.png')).toMatch(/\.png$/);
      expect(generateUniqueFilename('.webp')).toMatch(/\.webp$/);
    });

    it('should generate unique filenames', () => {
      const a = generateUniqueFilename('.jpg');
      const b = generateUniqueFilename('.jpg');
      expect(a).not.toBe(b);
    });
  });

  describe('getUploadPath', () => {
    it('should return path with current year and month', () => {
      const result = getUploadPath();
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      expect(result).toContain(String(year));
      expect(result).toContain(month);
    });

    it('should be inside public/uploads/portfolio', () => {
      const result = getUploadPath();
      expect(result).toContain('public');
      expect(result).toContain('uploads');
      expect(result).toContain('portfolio');
    });

    it('should have month zero-padded', () => {
      const result = getUploadPath();
      const parts = result.split('/');
      const monthPart = parts[parts.length - 1];
      expect(monthPart).toMatch(/^\d{2}$/);
    });
  });
});
