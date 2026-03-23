import { describe, it, expect } from '@jest/globals';
import { generatePageMetadata } from '../../src/lib/seo/metadata';
import { SEO_CONFIG } from '../../src/lib/seo/constants';

describe('generatePageMetadata', () => {
  it('should generate metadata with correct title format', () => {
    const result = generatePageMetadata({
      title: 'Test Page',
      description: 'Test description',
    });

    expect(result.title).toBe('Test Page | Заборы и Навесы');
  });

  it('should include description', () => {
    const result = generatePageMetadata({
      title: 'Test',
      description: 'Test description with enough characters',
    });

    expect(result.description).toBe('Test description with enough characters');
  });

  it('should include keywords', () => {
    const result = generatePageMetadata({
      title: 'Test',
      description: 'Description',
      keywords: ['keyword1', 'keyword2', 'keyword3'],
    });

    expect(result.keywords).toBe('keyword1, keyword2, keyword3');
  });

  it('should generate full OG image URL', () => {
    const result = generatePageMetadata({
      title: 'Test',
      description: 'Description',
      ogImage: '/og/test.svg',
    });

    const images = Array.isArray(result.openGraph?.images) ? result.openGraph?.images : [];
    const firstImage = images[0];
    expect(typeof firstImage === 'string' ? firstImage : firstImage?.url).toBe(`${SEO_CONFIG.BASE_URL}/og/test.svg`);
  });

  it('should handle absolute OG image URL', () => {
    const result = generatePageMetadata({
      title: 'Test',
      description: 'Description',
      ogImage: 'https://example.com/image.jpg',
    });

    const images = Array.isArray(result.openGraph?.images) ? result.openGraph?.images : [];
    const firstImage = images[0];
    expect(typeof firstImage === 'string' ? firstImage : firstImage?.url).toBe('https://example.com/image.jpg');
  });

  it('should use default OG image if not provided', () => {
    const result = generatePageMetadata({
      title: 'Test',
      description: 'Description',
    });

    const images = Array.isArray(result.openGraph?.images) ? result.openGraph?.images : [];
    const firstImage = images[0];
    expect(typeof firstImage === 'string' ? firstImage : firstImage?.url).toBe(`${SEO_CONFIG.BASE_URL}/og/og-main.svg`);
  });

  it('should generate canonical URL', () => {
    const result = generatePageMetadata({
      title: 'Test',
      description: 'Description',
      canonical: '/test-page',
    });

    expect(result.alternates?.canonical).toBe(`${SEO_CONFIG.BASE_URL}/test-page`);
  });

  it('should use base URL as canonical if not provided', () => {
    const result = generatePageMetadata({
      title: 'Test',
      description: 'Description',
    });

    expect(result.alternates?.canonical).toBe(SEO_CONFIG.BASE_URL);
  });

  it('should generate OpenGraph metadata', () => {
    const result = generatePageMetadata({
      title: 'Test Page',
      description: 'Test description',
    });

    expect(result.openGraph).toBeDefined();
    expect(result.openGraph?.siteName).toBe(SEO_CONFIG.SITE_NAME);
  });

  it('should generate Twitter Card metadata', () => {
    const result = generatePageMetadata({
      title: 'Test Page',
      description: 'Test description',
    });

    expect(result.twitter).toBeDefined();
  });

  it('should set noIndex when requested', () => {
    const result = generatePageMetadata({
      title: 'Test',
      description: 'Description',
      noIndex: true,
    });

    const robots = typeof result.robots === 'object' ? result.robots : undefined;
    expect(robots?.index).toBe(false);
    expect(robots?.follow).toBe(false);
  });

  it('should allow indexing by default', () => {
    const result = generatePageMetadata({
      title: 'Test',
      description: 'Description',
    });

    const robots = typeof result.robots === 'object' ? result.robots : undefined;
    expect(robots?.index).toBe(true);
    expect(robots?.follow).toBe(true);
  });
});
