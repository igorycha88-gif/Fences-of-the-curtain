import { describe, it, expect, beforeEach } from '@jest/globals';
import { normalizePath, recordTiming, formatHistogramOutput, getTimingData } from '@/lib/http-metrics';

describe('http-metrics', () => {
  beforeEach(() => {
    getTimingData().clear();
  });

  describe('normalizePath', () => {
    it('should normalize /_next paths', () => {
      expect(normalizePath('/_next/static/chunk.js')).toBe('/_next');
    });

    it('should normalize /api/analytics paths', () => {
      expect(normalizePath('/api/analytics/events')).toBe('/api/analytics');
    });

    it('should normalize /api/metrics path', () => {
      expect(normalizePath('/api/metrics')).toBe('/api/metrics');
    });

    it('should normalize /api/health path', () => {
      expect(normalizePath('/api/health')).toBe('/api/health');
    });

    it('should normalize /api/leads/:id paths', () => {
      expect(normalizePath('/api/leads/123')).toBe('/api/leads/:id');
    });

    it('should normalize /api/estimates/:id paths', () => {
      expect(normalizePath('/api/estimates/abc-123')).toBe('/api/estimates/:id');
    });

    it('should normalize /api/contact path', () => {
      expect(normalizePath('/api/contact')).toBe('/api/contact');
    });

    it('should normalize /api/auth paths', () => {
      expect(normalizePath('/api/auth/callback')).toBe('/api/auth/:action');
    });

    it('should normalize /uploads paths', () => {
      expect(normalizePath('/uploads/image.jpg')).toBe('/uploads');
    });

    it('should normalize /go/:source paths', () => {
      expect(normalizePath('/go/telegram')).toBe('/go/:source');
    });

    it('should normalize /calculator/:type paths', () => {
      expect(normalizePath('/calculator/fence')).toBe('/calculator/:type');
    });

    it('should normalize /portfolio/:id paths', () => {
      expect(normalizePath('/portfolio/abc123')).toBe('/portfolio/:id');
    });

    it('should normalize /services/:slug paths', () => {
      expect(normalizePath('/services/fence')).toBe('/services/:slug');
    });

    it('should normalize /blog/:slug paths', () => {
      expect(normalizePath('/blog/post-1')).toBe('/blog/:slug');
    });

    it('should replace numeric segments with :id', () => {
      expect(normalizePath('/users/123/profile')).toBe('/users/:id/profile');
    });

    it('should replace special characters with underscore', () => {
      expect(normalizePath('/path/with spaces')).toBe('/path/with_spaces');
    });

    it('should return :other when max paths exceeded', () => {
      getTimingData().clear();
      for (let i = 0; i < 50; i++) {
        recordTiming(`/unique-path-${i}`, 100);
      }
      expect(normalizePath('/one-more-unique-path')).toBe(':other');
      getTimingData().clear();
    });

    it('should return / for empty path', () => {
      expect(normalizePath('')).toBe('/');
    });
  });

  describe('recordTiming', () => {
    it('should record timing entry', () => {
      recordTiming('/api/test', 100);

      const data = getTimingData();
      const normalized = normalizePath('/api/test');
      const entry = data.get(normalized);

      expect(entry).toBeDefined();
      expect(entry!.count).toBe(1);
      expect(entry!.sum).toBe(0.1);
    });

    it('should accumulate multiple timings', () => {
      recordTiming('/api/test', 100);
      recordTiming('/api/test', 200);

      const data = getTimingData();
      const normalized = normalizePath('/api/test');
      const entry = data.get(normalized);

      expect(entry!.count).toBe(2);
      expect(entry!.sum).toBeCloseTo(0.3, 5);
    });

    it('should populate histogram buckets', () => {
      recordTiming('/api/test', 50);
      recordTiming('/api/test', 500);

      const data = getTimingData();
      const normalized = normalizePath('/api/test');
      const entry = data.get(normalized);

      expect(entry!.buckets['0.05']).toBe(1);
      expect(entry!.buckets['0.5']).toBe(2);
      expect(entry!.buckets['+Inf']).toBe(2);
    });
  });

  describe('formatHistogramOutput', () => {
    it('should return empty string when no data', () => {
      expect(formatHistogramOutput()).toBe('');
    });

    it('should format histogram in Prometheus format', () => {
      recordTiming('/api/health', 100);

      const output = formatHistogramOutput();

      expect(output).toContain('# HELP http_request_duration_seconds');
      expect(output).toContain('# TYPE http_request_duration_seconds histogram');
      expect(output).toContain('http_request_duration_seconds_bucket');
      expect(output).toContain('http_request_duration_seconds_sum');
      expect(output).toContain('http_request_duration_seconds_count');
    });

    it('should escape special characters in path', () => {
      recordTiming('/path/with"quote', 100);

      const output = formatHistogramOutput();

      expect(output).toMatch(/with.*quote/);
      expect(output).not.toContain('with"quote');
    });

    it('should skip entries with zero count', () => {
      const data = getTimingData();
      data.set('/empty', { count: 0, sum: 0, buckets: {} });

      const output = formatHistogramOutput();

      expect(output).not.toContain('/empty');
    });
  });
});
