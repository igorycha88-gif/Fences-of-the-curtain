import { describe, it, expect } from '@jest/globals';

describe('sitemap — Wordstat-посадочные (ЧТЗ_SEO_расширение_Wordstat)', () => {
  it('содержит все 5 новых URL с корректным приоритетом', async () => {
    const sitemapModule = await import('../../src/app/sitemap');
    const result = await sitemapModule.default();

    const expected = [
      { path: '/otkatnye-vorota', priority: 0.9 },
      { path: '/zabor-zhalyuzi', priority: 0.8 },
      { path: '/zabory-pod-klyuch', priority: 0.9 },
      { path: '/navesy/arochnye', priority: 0.8 },
      { path: '/navesy/dvuskatnye', priority: 0.8 },
    ];

    for (const { path, priority } of expected) {
      const entry = result.find((item: any) => item.url === `https://zabor-i-naves.ru${path}`);
      expect(entry).toBeDefined();
      expect(entry.priority).toBe(priority);
      expect(entry.changeFrequency).toBe('weekly');
    }
  });
});
