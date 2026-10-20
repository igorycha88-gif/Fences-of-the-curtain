import { describe, it, expect } from '@jest/globals';
import { PAGE_METADATA, SEO_CONFIG } from '../src/lib/seo/constants';
import { GEO_CITIES, GEO_HUBS } from '../src/lib/geo/cities';
import {
  generateCityTitle,
  generateCityDescription,
  generateCityFaq,
  generateCityPriceTable,
  generateHubTitle,
  generateHubDescription,
} from '../src/lib/geo/content';

/**
 * ЧТЗ_SEO_Фиксы_по_книгам (TASK-TST-001):
 * метатеги в лимитах, честный lastmod, robots /api, уникальность и
 * детерминированность гео-контента.
 */

describe('TASK-BCK-001: лимиты метатегов', () => {
  const entries = Object.entries(PAGE_METADATA);

  it('все title в пределах TITLE_MAX_LENGTH (74)', () => {
    const violations = entries.filter(
      ([, page]) => page.title.length > SEO_CONFIG.TITLE_MAX_LENGTH
    );
    expect(violations.map(([key]) => key)).toEqual([]);
  });

  it('все description в пределах DESCRIPTION_MAX_LENGTH (160)', () => {
    const violations = entries.filter(
      ([, page]) => page.description.length > SEO_CONFIG.DESCRIPTION_MAX_LENGTH
    );
    expect(violations.map(([key]) => key)).toEqual([]);
  });

  it('дефолтные title/description сайта в лимитах', () => {
    expect(SEO_CONFIG.DEFAULT_TITLE.length).toBeLessThanOrEqual(
      SEO_CONFIG.TITLE_MAX_LENGTH
    );
    expect(SEO_CONFIG.DEFAULT_DESCRIPTION.length).toBeLessThanOrEqual(
      SEO_CONFIG.DESCRIPTION_MAX_LENGTH
    );
  });
});

describe('TASK-BCK-002: честный lastmod и robots', () => {
  it('CONTENT_LAST_UPDATED — валидная ISO-дата', () => {
    expect(SEO_CONFIG.CONTENT_LAST_UPDATED).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(new Date(SEO_CONFIG.CONTENT_LAST_UPDATED).toString()).not.toBe(
      'Invalid Date'
    );
  });

  it('sitemap не вычисляет lastmod через new Date() (фиктивный lastmod запрещён)', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const sitemapSource = fs.readFileSync(
      path.resolve(__dirname, '../src/app/sitemap.ts'),
      'utf-8'
    );
    expect(sitemapSource).not.toContain('new Date()');
    expect(sitemapSource).toContain('CONTENT_LAST_UPDATED');
  });

  it('robots закрывает /api целиком', async () => {
    const robotsModule = await import('../src/app/robots');
    const result = await robotsModule.default();

    result.rules.forEach((rule: { disallow?: string[] }) => {
      expect(rule.disallow).toContain('/api');
    });
  });
});

describe('TASK-FRT-002: уникальность гео-контента', () => {
  it('title всех городов уникальны и в лимите 74', () => {
    const titles = GEO_CITIES.map((c) => generateCityTitle(c));
    expect(new Set(titles).size).toBe(GEO_CITIES.length);
    titles.forEach((t) => expect(t.length).toBeLessThanOrEqual(74));
  });

  it('description всех городов уникальны и в лимите 160', () => {
    const descriptions = GEO_CITIES.map((c) => generateCityDescription(c));
    expect(new Set(descriptions).size).toBe(GEO_CITIES.length);
    descriptions.forEach((d) => expect(d.length).toBeLessThanOrEqual(160));
  });

  it('FAQ всех городов уникальны (нет страниц-близнецов)', () => {
    const faqs = GEO_CITIES.map((c) => JSON.stringify(generateCityFaq(c)));
    expect(new Set(faqs).size).toBe(GEO_CITIES.length);
  });

  it('у пар городов одного направления различается минимум 2 элемента FAQ', () => {
    const directions = [...new Set(GEO_CITIES.map((c) => c.direction))];
    expect(directions.length).toBeGreaterThan(0);

    for (const direction of directions) {
      const cities = GEO_CITIES.filter((c) => c.direction === direction);
      for (let i = 0; i < Math.min(cities.length, 4); i++) {
        const a = generateCityFaq(cities[i]);
        const b = generateCityFaq(cities[(i + 1) % cities.length]);
        const overlap = Math.min(a.length, b.length);
        let diffs = 0;
        for (let idx = 0; idx < overlap; idx++) {
          if (a[idx].question !== b[idx].question) diffs++;
          else if (a[idx].answer !== b[idx].answer) diffs++;
        }
        expect(diffs).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it('прайс-таблица содержит строку доставки с удалённостью города', () => {
    for (const city of GEO_CITIES) {
      const rows = generateCityPriceTable(city);
      const delivery = rows.find((r) => r.material === 'Доставка материалов');
      expect(delivery).toBeDefined();
      expect(delivery?.note).toContain(`${city.distanceKm} км от МКАД`);
    }
  });

  it('генераторы детерминированы (ISR-safe, без Math.random)', () => {
    for (const city of GEO_CITIES.slice(0, 8)) {
      expect(generateCityTitle(city)).toBe(generateCityTitle(city));
      expect(generateCityDescription(city)).toBe(generateCityDescription(city));
      expect(JSON.stringify(generateCityFaq(city))).toBe(
        JSON.stringify(generateCityFaq(city))
      );
    }
  });

  it('description и title хабов в лимитах 160/74', () => {
    for (const hub of GEO_HUBS) {
      expect(generateHubDescription(hub).length).toBeLessThanOrEqual(160);
      expect(generateHubTitle(hub).length).toBeLessThanOrEqual(74);
    }
  });
});
