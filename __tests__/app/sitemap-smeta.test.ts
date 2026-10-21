import { describe, it, expect } from '@jest/globals';

describe('sitemap — посадочная «Смета на забор» (ЧТЗ_SEO_Смета_на_Забор)', () => {
  it('содержит /smeta-na-zabor с priority 0.8 и monthly', async () => {
    const sitemapModule = await import('../../src/app/sitemap');
    const result = await sitemapModule.default();

    const entry = result.find((item: any) => item.url === 'https://zabor-i-naves.ru/smeta-na-zabor');
    expect(entry).toBeDefined();
    expect(entry.priority).toBe(0.8);
    expect(entry.changeFrequency).toBe('monthly');
  });
});
