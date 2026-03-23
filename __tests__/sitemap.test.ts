import { describe, it, expect } from '@jest/globals';

describe('sitemap', () => {
  it('should generate sitemap with all required pages', async () => {
    const sitemapModule = await import('../src/app/sitemap');
    const result = sitemapModule.default();

    expect(result).toHaveLength(6);

    const paths = result.map((item: any) => item.url.replace('https://zabor-i-naves.ru', ''));
    expect(paths).toContain('/');
    expect(paths).toContain('/services');
    expect(paths).toContain('/calculator/fence');
    expect(paths).toContain('/calculator/canopy');
    expect(paths).toContain('/portfolio');
    expect(paths).toContain('/contacts');
  });

  it('should have correct sitemap structure', async () => {
    const sitemapModule = await import('../src/app/sitemap');
    const result = sitemapModule.default();

    result.forEach((item: any) => {
      expect(item).toHaveProperty('url');
      expect(item).toHaveProperty('lastModified');
      expect(item).toHaveProperty('changeFrequency');
      expect(item).toHaveProperty('priority');
    });
  });

  it('should have valid priorities (0-1)', async () => {
    const sitemapModule = await import('../src/app/sitemap');
    const result = sitemapModule.default();

    result.forEach((item: any) => {
      expect(item.priority).toBeGreaterThanOrEqual(0);
      expect(item.priority).toBeLessThanOrEqual(1);
    });
  });

  it('should have valid change frequencies', async () => {
    const sitemapModule = await import('../src/app/sitemap');
    const result = sitemapModule.default();
    const validFrequencies = ['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'];

    result.forEach((item: any) => {
      expect(validFrequencies).toContain(item.changeFrequency);
    });
  });

  it('should have highest priority for home page', async () => {
    const sitemapModule = await import('../src/app/sitemap');
    const result = sitemapModule.default();
    const homePage = result.find((item: any) => item.url === 'https://zabor-i-naves.ru/');

    expect(homePage).toBeDefined();
    expect(homePage?.priority).toBe(1.0);
  });

  it('should have ISO date format for lastModified', async () => {
    const sitemapModule = await import('../src/app/sitemap');
    const result = sitemapModule.default();
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;

    result.forEach((item: any) => {
      expect(item.lastModified).toMatch(isoDateRegex);
    });
  });
});
