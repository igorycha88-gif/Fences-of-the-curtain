import { describe, it, expect } from '@jest/globals';
import { normalizeImageUrl, getThumbnailUrl } from '@/lib/utils/imageUrl';

describe('ImageUrl Utilities', () => {
  describe('normalizeImageUrl', () => {
    it('should add leading slash when missing', () => {
      expect(normalizeImageUrl('uploads/img.jpg')).toBe('/uploads/img.jpg');
    });

    it('should keep leading slash when present', () => {
      expect(normalizeImageUrl('/uploads/img.jpg')).toBe('/uploads/img.jpg');
    });

    it('should return empty string for empty input', () => {
      expect(normalizeImageUrl('')).toBe('');
    });

    it('should handle nested paths', () => {
      expect(normalizeImageUrl('uploads/2026/04/photo.png')).toBe('/uploads/2026/04/photo.png');
    });

    it('should not double-slash', () => {
      expect(normalizeImageUrl('/already/slashed.jpg')).toBe('/already/slashed.jpg');
    });
  });

  describe('getThumbnailUrl', () => {
    it('should generate thumb path with extension', () => {
      expect(getThumbnailUrl('uploads/img.jpg')).toBe('/uploads/img_thumb.jpg');
    });

    it('should generate thumb path with leading slash', () => {
      expect(getThumbnailUrl('/uploads/img.png')).toBe('/uploads/img_thumb.png');
    });

    it('should return empty string for empty input', () => {
      expect(getThumbnailUrl('')).toBe('');
    });

    it('should handle webp extension', () => {
      expect(getThumbnailUrl('/photos/test.webp')).toBe('/photos/test_thumb.webp');
    });

    it('should handle multi-dot filenames', () => {
      expect(getThumbnailUrl('/my.image.file.jpg')).toBe('/my.image.file_thumb.jpg');
    });
  });
});
