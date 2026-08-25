import { describe, it, expect } from '@jest/globals';
import { generateGeoServiceJsonLd } from '@/lib/seo/jsonld';
import { getCityBySlug } from '@/lib/geo/cities';
import type { JsonLdService } from '@/lib/seo/types';

describe('generateGeoServiceJsonLd', () => {
  it('builds Service schema with city areaServed and price offer', () => {
    const balashiha = getCityBySlug('balashiha')!;
    const jsonLd = generateGeoServiceJsonLd(balashiha) as JsonLdService & {
      areaServed: { '@type': string; name: string }[];
      offers: { price: string; priceCurrency: string; priceRange: string };
    };

    expect(jsonLd['@type']).toBe('Service');
    expect(jsonLd.name).toContain('Балашихе');
    expect(jsonLd.areaServed[0]).toEqual({ '@type': 'City', name: 'Балашиха' });
    expect(jsonLd.provider['@type']).toBe('LocalBusiness');
    expect(jsonLd.offers.price).toBe('2600');
    expect(jsonLd.offers.priceCurrency).toBe('RUB');
    expect(jsonLd.offers.priceRange).toContain('2600');
  });

  it('references organization node by @id (no duplicate LocalBusiness)', () => {
    const ramenskoe = getCityBySlug('ramenskoe')!;
    const jsonLd = generateGeoServiceJsonLd(ramenskoe) as JsonLdService & {
      provider: { '@id': string };
    };
    expect(jsonLd.provider['@id']).toBe('https://zabor-i-naves.ru/#organization');
  });

  it('works for every city in the directory', () => {
    for (const slug of ['kolomna', 'serpuhov', 'shatura', 'zaraysk', 'klimovsk']) {
      const city = getCityBySlug(slug)!;
      const jsonLd = generateGeoServiceJsonLd(city);
      expect(jsonLd.name).toContain(city.nameIn.replace(/^в /, ''));
      expect(jsonLd.areaServed[0].name).toBe(city.name);
    }
  });
});
