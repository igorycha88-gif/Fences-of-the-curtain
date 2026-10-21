import { describe, it, expect } from '@jest/globals';

const nextConfig = require('../next.config');

describe('next.config images', () => {
  // ЧТЗ SEO P2 3.2 (включить AVIF) ОТКЛОНЕНО владельцем 2026-10-21:
  // AVIF уже отключали из-за таймаутов фото на проде (коммит 8d2e7b0) — webp-only остаётся
  it('formats содержит только webp (без avif)', () => {
    expect(nextConfig.images.formats).toEqual(['image/webp']);
  });

  it('minimumCacheTTL установлен', () => {
    expect(nextConfig.images.minimumCacheTTL).toBeGreaterThan(0);
  });
});
