import { describe, it, expect } from '@jest/globals';

const nextConfig = require('../next.config');

describe('next.config images (фикс AVIF-таймаутов портфолио)', () => {
  it('formats содержит только webp (без avif)', () => {
    expect(nextConfig.images.formats).toEqual(['image/webp']);
  });

  it('minimumCacheTTL установлен', () => {
    expect(nextConfig.images.minimumCacheTTL).toBeGreaterThan(0);
  });
});
