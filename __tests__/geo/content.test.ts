import { describe, it, expect } from '@jest/globals';
import { getCityBySlug, getHubBySlug } from '@/lib/geo/cities';
import {
  generateCityFaq,
  generateCityPriceTable,
  generateCityTitle,
  generateCityDescription,
  generateCityKeywords,
  generateHubTitle,
  generateHubDescription,
  generateNearbyCitiesLinks,
  generateDistrictsText,
  generateDachaBlock,
  NAVESY_POD_KLYUCH_FAQ,
} from '@/lib/geo/content';

describe('geo content generators', () => {
  const balashiha = getCityBySlug('balashiha')!;

  describe('generateCityFaq', () => {
    it('returns at least 5 questions with city substitution', () => {
      const faq = generateCityFaq(balashiha);
      expect(faq.length).toBeGreaterThanOrEqual(5);
      for (const item of faq) {
        expect(item.question.length).toBeGreaterThan(10);
        expect(item.answer.length).toBeGreaterThan(40);
      }
    });

    it('includes the price question mentioning the city', () => {
      const faq = generateCityFaq(balashiha);
      expect(
        faq.some((item) => item.question.includes('Балашихе'))
      ).toBe(true);
    });

    it('appends city-specific extra questions', () => {
      const kolomna = getCityBySlug('kolomna')!;
      const faq = generateCityFaq(kolomna);
      expect(
        faq.some((item) => item.question.includes('удалённость'))
      ).toBe(true);
    });

    it('always returns at least 5 questions even without city extras', () => {
      const elektrostal = getCityBySlug('elektrostal')!;
      const faq = generateCityFaq(elektrostal);
      expect(faq.length).toBeGreaterThanOrEqual(5);
      expect(faq.some((item) => item.question.includes('навес для автомобиля'))).toBe(true);
    });
  });

  describe('generateCityPriceTable', () => {
    it('starts with profnastil price from 2600 and has free measurement row', () => {
      const prices = generateCityPriceTable(balashiha);
      expect(prices[0].material).toContain('профнастила');
      expect(prices[0].price).toContain('2 600');
      const freeRow = prices.find((row) => row.material.includes('Замер'));
      expect(freeRow?.price).toBe('бесплатно');
    });

    it('mentions the city in table notes', () => {
      const prices = generateCityPriceTable(balashiha);
      expect(
        prices.some((row) => row.note.includes('Балашихе') || row.note.includes('Балашиха'))
      ).toBe(true);
    });
  });

  describe('metadata generators', () => {
    it('title fits 65 chars limit and includes city and price', () => {
      const pavlovskiyPosad = getCityBySlug('pavlovskiy-posad')!;
      for (const city of [balashiha, pavlovskiyPosad, getCityBySlug('likino-dulevo')!]) {
        const title = generateCityTitle(city);
        expect(title.length).toBeLessThanOrEqual(65);
        expect(title).toContain(city.nameIn.replace(/^в /, ''));
        expect(title).toContain('2 600');
      }
    });

    it('description includes city, phone and guarantee', () => {
      const description = generateCityDescription(balashiha);
      expect(description).toContain('Балашихе');
      expect(description).toContain('+7 (499) 390-15-95');
    });

    it('keywords contain geo queries for the city', () => {
      const keywords = generateCityKeywords(balashiha);
      expect(keywords.some((k) => k.includes('балашихе'))).toBe(true);
      expect(keywords.some((k) => k.includes('навес'))).toBe(true);
    });

    it('hub metadata includes direction name and highways', () => {
      const hub = getHubBySlug('vostok-podmoskovya')!;
      const title = generateHubTitle(hub);
      const description = generateHubDescription(hub);
      expect(title).toContain('Восток Подмосковья');
      expect(description).toContain('Горьковское');
    });
  });

  describe('text generators', () => {
    it('districts text includes districts and highway', () => {
      const text = generateDistrictsText(balashiha);
      expect(text).toContain('Железнодорожный');
      expect(text).toContain(balashiha.highway);
      expect(text).toContain(`${balashiha.distanceKm} км`);
    });

    it('dacha block only for dacha cities', () => {
      expect(generateDachaBlock(balashiha)).toBeNull();
      const serpuhov = getCityBySlug('serpuhov')!;
      const block = generateDachaBlock(serpuhov);
      expect(block).not.toBeNull();
      expect(block!.title).toContain('Серпухове');
    });

    it('nearby links exclude the city itself', () => {
      const neighbours = generateNearbyCitiesLinks(balashiha);
      expect(neighbours.map((c) => c.slug)).not.toContain('balashiha');
      expect(neighbours.length).toBeGreaterThan(0);
    });
  });

  describe('navesy pod klyuch faq', () => {
    it('has 5 questions targeting "naves pod kluch" cluster', () => {
      expect(NAVESY_POD_KLYUCH_FAQ).toHaveLength(5);
      expect(
        NAVESY_POD_KLYUCH_FAQ[0].question.includes('навес под ключ')
      ).toBe(true);
    });
  });
});
