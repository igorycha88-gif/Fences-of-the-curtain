import { describe, it, expect } from '@jest/globals';
import {
  GEO_CITIES,
  GEO_HUBS,
  getCityBySlug,
  getHubBySlug,
  getCitiesByDirection,
  getHubByDirection,
  getNeighbourCities,
  getWave1Cities,
  GEO_SLUGS,
  GEO_HUB_SLUGS,
} from '@/lib/geo/cities';

const TRANSLIT_RE = /^[a-z0-9-]+$/;

describe('geo cities directory', () => {
  it('contains exactly 32 cities', () => {
    expect(GEO_CITIES).toHaveLength(32);
  });

  it('contains exactly 3 direction hubs', () => {
    expect(GEO_HUBS).toHaveLength(3);
    expect(GEO_HUBS.map((h) => h.direction).sort()).toEqual(['east', 'south', 'southeast']);
  });

  it('has unique slugs across cities and hubs', () => {
    const allSlugs = [...GEO_SLUGS, ...GEO_HUB_SLUGS];
    expect(new Set(allSlugs).size).toBe(allSlugs.length);
  });

  it('uses latin slug transliteration only', () => {
    for (const slug of [...GEO_SLUGS, ...GEO_HUB_SLUGS]) {
      expect(slug).toMatch(TRANSLIT_RE);
    }
  });

  it('every city has required fields filled', () => {
    for (const city of GEO_CITIES) {
      expect(city.name.length).toBeGreaterThan(2);
      expect(city.nameIn).toMatch(/^в /);
      expect(city.nameAcc).toMatch(/^в /);
      expect(['east', 'southeast', 'south']).toContain(city.direction);
      expect([1, 2, 3]).toContain(city.wave);
      expect(city.highway.length).toBeGreaterThan(3);
      expect(city.distanceKm).toBeGreaterThan(0);
      expect(city.driveTime.length).toBeGreaterThan(3);
      expect(city.districts.length).toBeGreaterThanOrEqual(3);
      expect(typeof city.isDacha).toBe('boolean');
      expect(Array.isArray(city.faqExtra)).toBe(true);
    }
  });

  it('every city has at least 2 unique local context paragraphs', () => {
    for (const city of GEO_CITIES) {
      expect(city.localContext.length).toBeGreaterThanOrEqual(2);
      for (const paragraph of city.localContext) {
        expect(paragraph.length).toBeGreaterThan(120);
        expect(paragraph).not.toMatch(/[\u4e00-\u9fff]/);
      }
    }
  });

  it('mentions city name or districts inside local context (anti-doorway)', () => {
    for (const city of GEO_CITIES) {
      const text = city.localContext.join(' ');
      expect(
        text.includes(city.name) || text.includes(city.districts[0])
      ).toBe(true);
    }
  });

  it('wave 1 contains exactly 12 priority cities', () => {
    expect(getWave1Cities()).toHaveLength(12);
  });

  it('all three waves are populated', () => {
    for (const wave of [1, 2, 3] as const) {
      expect(GEO_CITIES.filter((c) => c.wave === wave).length).toBeGreaterThan(0);
    }
  });

  it('priority cities from the analysis are in wave 1', () => {
    const wave1Slugs = getWave1Cities().map((c) => c.slug);
    for (const slug of [
      'balashiha',
      'podolsk',
      'lyubercy',
      'elektrostal',
      'kolomna',
      'domodedovo',
      'shchelkovo',
      'serpuhov',
      'orekhovo-zuevo',
      'ramenskoe',
      'zhukovskiy',
      'noginsk',
    ]) {
      expect(wave1Slugs).toContain(slug);
    }
  });

  it('each direction has at least 8 cities', () => {
    for (const direction of ['east', 'southeast', 'south'] as const) {
      expect(getCitiesByDirection(direction).length).toBeGreaterThanOrEqual(8);
    }
  });
});

describe('geo directory helpers', () => {
  it('getCityBySlug finds city and returns undefined for unknown', () => {
    expect(getCityBySlug('balashiha')?.name).toBe('Балашиха');
    expect(getCityBySlug('moskva-city')).toBeUndefined();
  });

  it('getHubBySlug finds hub and returns undefined for unknown', () => {
    expect(getHubBySlug('vostok-podmoskovya')?.direction).toBe('east');
    expect(getHubBySlug('balashiha')).toBeUndefined();
  });

  it('getHubByDirection returns hub for each direction', () => {
    expect(getHubByDirection('east').slug).toBe('vostok-podmoskovya');
    expect(getHubByDirection('southeast').slug).toBe('yugo-vostok-podmoskovya');
    expect(getHubByDirection('south').slug).toBe('yug-podmoskovya');
  });

  it('getNeighbourCities returns same-direction cities without itself', () => {
    const ramenskoe = getCityBySlug('ramenskoe')!;
    const neighbours = getNeighbourCities(ramenskoe, 6);
    expect(neighbours).toHaveLength(6);
    expect(neighbours.map((c) => c.slug)).not.toContain('ramenskoe');
    for (const neighbour of neighbours) {
      expect(neighbour.direction).toBe('southeast');
    }
  });

  it('Mytishchi and other out-of-zone cities are not present', () => {
    const names = GEO_CITIES.map((c) => c.name);
    for (const outOfZone of ['Мытищи', 'Химки', 'Одинцово', 'Красногорск']) {
      expect(names).not.toContain(outOfZone);
    }
  });
});
