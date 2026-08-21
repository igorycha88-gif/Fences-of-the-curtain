import { describe, it, expect } from '@jest/globals';

describe('robots', () => {
  it('should NOT contain crawlDelay for Yandex (slows down YandexBot crawling)', async () => {
    const robotsModule = await import('../src/app/robots');
    const result = await robotsModule.default();

    result.rules.forEach((rule: any) => {
      expect(rule.crawlDelay).toBeUndefined();
    });
  });

  it('should have rules for Yandex and *', async () => {
    const robotsModule = await import('../src/app/robots');
    const result = await robotsModule.default();

    const agents = result.rules.map((rule: any) => rule.userAgent);
    expect(agents).toContain('Yandex');
    expect(agents).toContain('*');
  });

  it('should disallow admin and private API paths', async () => {
    const robotsModule = await import('../src/app/robots');
    const result = await robotsModule.default();

    result.rules.forEach((rule: any) => {
      expect(rule.disallow).toContain('/admin');
      expect(rule.disallow).toContain('/api/auth');
      expect(rule.disallow).toContain('/api/admin');
      expect(rule.disallow).toContain('/api/analytics');
      expect(rule.allow).toContain('/');
    });
  });

  it('should point to sitemap', async () => {
    const robotsModule = await import('../src/app/robots');
    const result = await robotsModule.default();

    expect(result.sitemap).toBe('https://zabor-i-naves.ru/sitemap.xml');
  });
});
