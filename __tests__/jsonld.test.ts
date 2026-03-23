import { describe, it, expect } from '@jest/globals';
import {
  generateOrganizationJsonLd,
  generateWebSiteJsonLd,
  generateServiceJsonLd,
  generateWebApplicationJsonLd,
  generateBreadcrumbJsonLd,
  generateContactPageJsonLd,
} from '../src/lib/seo/jsonld';
import { SEO_CONFIG } from '../src/lib/seo/constants';

describe('JSON-LD Generators', () => {
  describe('generateOrganizationJsonLd', () => {
    it('should generate valid Organization schema', () => {
      const result = generateOrganizationJsonLd();

      expect(result['@context']).toBe('https://schema.org');
      expect(result['@type']).toBe('LocalBusiness');
      expect(result.name).toBe('Заборы и Навесы');
      expect(result.url).toBe('https://zabor-i-naves.ru');
    });

    it('should have required Organization fields', () => {
      const result = generateOrganizationJsonLd();

      expect(result).toHaveProperty('telephone');
      expect(result).toHaveProperty('email');
      expect(result).toHaveProperty('address');
      expect(result).toHaveProperty('openingHoursSpecification');
      expect(result).toHaveProperty('priceRange');
    });

    it('should have @id field', () => {
      const result = generateOrganizationJsonLd();

      expect(result['@id']).toBe('https://zabor-i-naves.ru/#organization');
    });

    it('should have valid address structure', () => {
      const result = generateOrganizationJsonLd();

      expect(result.address).toHaveProperty('@type', 'PostalAddress');
      expect(result.address).toHaveProperty('addressLocality');
      expect(result.address).toHaveProperty('addressRegion');
      expect(result.address).toHaveProperty('addressCountry');
    });

    it('should have valid opening hours', () => {
      const result = generateOrganizationJsonLd();

      expect(result.openingHoursSpecification).toBeDefined();
      expect(result.openingHoursSpecification?.length).toBe(1);
      expect(result.openingHoursSpecification?.[0]).toHaveProperty('@type', 'OpeningHoursSpecification');
      expect(result.openingHoursSpecification?.[0]).toHaveProperty('dayOfWeek');
      expect(result.openingHoursSpecification?.[0]).toHaveProperty('opens');
      expect(result.openingHoursSpecification?.[0]).toHaveProperty('closes');
    });
  });

  describe('generateWebSiteJsonLd', () => {
    it('should generate valid WebSite schema', () => {
      const result = generateWebSiteJsonLd();

      expect(result['@context']).toBe('https://schema.org');
      expect(result['@type']).toBe('WebSite');
      expect(result.name).toBe('Заборы и Навесы');
      expect(result.url).toBe('https://zabor-i-naves.ru');
    });

    it('should have search action', () => {
      const result = generateWebSiteJsonLd();

      expect(result.potentialAction).toBeDefined();
      expect(result.potentialAction?.['@type']).toBe('SearchAction');
      expect(result.potentialAction?.target).toBe('https://zabor-i-naves.ru/search?q={search_term_string}');
      expect(result.potentialAction?.['query-input']).toBe('required name=search_term_string');
    });
  });

  describe('generateServiceJsonLd', () => {
    it('should generate valid Service schema', () => {
      const result = generateServiceJsonLd(
        'Test Service',
        'Test description',
        'from 1000 rub/m'
      );

      expect(result['@context']).toBe('https://schema.org');
      expect(result['@type']).toBe('Service');
      expect(result.name).toBe('Test Service');
      expect(result.description).toBe('Test description');
    });

    it('should have provider reference', () => {
      const result = generateServiceJsonLd('Test', 'Description');

      expect(result.provider).toBeDefined();
      expect(result.provider?.['@type']).toBe('LocalBusiness');
      expect(result.provider?.['@id']).toBe('https://zabor-i-naves.ru/#organization');
    });

    it('should include price range', () => {
      const result = generateServiceJsonLd(
        'Test',
        'Description',
        'from 1500 rub/m'
      );

      expect(result.offers?.priceRange).toBe('from 1500 rub/m');
    });

    it('should use default price range if not provided', () => {
      const result = generateServiceJsonLd('Test', 'Description');

      expect(result.offers?.priceRange).toBe('$$');
    });

    it('should have areaServed', () => {
      const result = generateServiceJsonLd('Test', 'Description');

      expect(result.areaServed).toBe('Россия');
    });
  });

  describe('generateWebApplicationJsonLd', () => {
    it('should generate valid WebApplication schema', () => {
      const result = generateWebApplicationJsonLd(
        'Test App',
        'Test description',
        '/test'
      );

      expect(result['@context']).toBe('https://schema.org');
      expect(result['@type']).toBe('WebApplication');
      expect(result.name).toBe('Test App');
      expect(result.description).toBe('Test description');
    });

    it('should generate full URL', () => {
      const result = generateWebApplicationJsonLd('Test', 'Description', '/calculator/fence');

      expect(result.url).toBe('https://zabor-i-naves.ru/calculator/fence');
    });

    it('should have required WebApplication fields', () => {
      const result = generateWebApplicationJsonLd('Test', 'Description', '/test');

      expect(result.applicationCategory).toBe('UtilityApplication');
      expect(result.operatingSystem).toBe('Web');
      expect(result.offers).toBeDefined();
      expect(result.offers?.['@type']).toBe('Offer');
      expect(result.offers?.price).toBe('0');
      expect(result.offers?.priceCurrency).toBe('RUB');
    });
  });

  describe('generateBreadcrumbJsonLd', () => {
    it('should generate valid BreadcrumbList schema', () => {
      const items = [
        { name: 'Главная', url: '/' },
        { name: 'Услуги', url: '/services' },
      ];
      const result = generateBreadcrumbJsonLd(items);

      expect(result['@context']).toBe('https://schema.org');
      expect(result['@type']).toBe('BreadcrumbList');
      expect(result.itemListElement).toHaveLength(2);
    });

    it('should have correct positions', () => {
      const items = [
        { name: 'Главная', url: '/' },
        { name: 'Услуги', url: '/services' },
        { name: 'Калькулятор', url: '/calculator' },
      ];
      const result = generateBreadcrumbJsonLd(items);

      expect(result.itemListElement[0].position).toBe(1);
      expect(result.itemListElement[1].position).toBe(2);
      expect(result.itemListElement[2].position).toBe(3);
    });

    it('should generate full URLs', () => {
      const items = [{ name: 'Главная', url: '/' }];
      const result = generateBreadcrumbJsonLd(items);

      expect(result.itemListElement[0].item).toBe('https://zabor-i-naves.ru/');
    });

    it('should handle items without URL', () => {
      const items = [{ name: 'Current Page' }];
      const result = generateBreadcrumbJsonLd(items);

      expect(result.itemListElement[0].item).toBeUndefined();
      expect(result.itemListElement[0].name).toBe('Current Page');
    });
  });

  describe('generateContactPageJsonLd', () => {
    it('should generate valid ContactPage schema', () => {
      const result = generateContactPageJsonLd();

      expect(result['@context']).toBe('https://schema.org');
      expect(result['@type']).toBe('ContactPage');
      expect(result.name).toBe('Контакты');
      expect(result.url).toBe('https://zabor-i-naves.ru/contacts');
    });

    it('should have mainEntity reference', () => {
      const result = generateContactPageJsonLd();

      expect(result.mainEntity).toBeDefined();
      expect(result.mainEntity?.['@type']).toBe('LocalBusiness');
      expect(result.mainEntity?.['@id']).toBe('https://zabor-i-naves.ru/#organization');
    });

    it('should have description', () => {
      const result = generateContactPageJsonLd();

      expect(result.description).toBe('Свяжитесь с нами для консультации и расчёта стоимости');
    });
  });
});
