import { describe, it, expect } from '@jest/globals';
import { BUSINESS_INFO } from '@/lib/seo/constants';
import { generateOrganizationJsonLd } from '@/lib/seo/jsonld';

describe('areaServedCities target zone (US-5)', () => {
  it('excludes out-of-zone cities (north/west of Moscow region)', () => {
    for (const outOfZone of ['Мытищи', 'Химки', 'Одинцово', 'Красногорск']) {
      expect(BUSINESS_INFO.areaServedCities).not.toContain(outOfZone);
    }
  });

  it('includes priority wave-1 cities of east/southeast/south', () => {
    for (const expected of [
      'Балашиха',
      'Люберцы',
      'Подольск',
      'Электросталь',
      'Коломна',
      'Серпухов',
      'Раменское',
      'Домодедово',
      'Щёлково',
    ]) {
      expect(BUSINESS_INFO.areaServedCities).toContain(expected);
    }
  });

  it('keeps the list compact (max 10 cities for JSON-LD)', () => {
    expect(BUSINESS_INFO.areaServedCities.length).toBeLessThanOrEqual(10);
  });

  it('propagates target-zone cities into LocalBusiness areaServed', () => {
    const jsonLd = generateOrganizationJsonLd();
    const names = (jsonLd.areaServed as { name: string }[]).map((a) => a.name);
    expect(names).toContain('Электросталь');
    expect(names).toContain('Раменское');
    expect(names).not.toContain('Мытищи');
  });
});
