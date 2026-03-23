import sitemap from '../../src/app/sitemap';
import { SEO_CONFIG, SITEMAP_CONFIG } from '@/lib/seo/constants';

describe('Sitemap', () => {
  it('should generate sitemap with all static pages', () => {
    const result = sitemap();

    expect(result).toBeInstanceOf(Array);
    expect(result).toHaveLength(SITEMAP_CONFIG.pages.length);
  });

  it('should include all required pages', () => {
    const result = sitemap();
    const urls = result.map((item) => item.url);

    SITEMAP_CONFIG.pages.forEach((page) => {
      expect(urls).toContain(`${SEO_CONFIG.BASE_URL}${page.path}`);
    });
  });

  it('should include correct change frequencies', () => {
    const result = sitemap();

    result.forEach((item) => {
      const pageConfig = SITEMAP_CONFIG.pages.find((p) => p.path === item.url.replace(SEO_CONFIG.BASE_URL, ''));
      expect(item.changeFrequency).toBe(pageConfig?.changefreq);
    });
  });

  it('should include correct priorities', () => {
    const result = sitemap();

    result.forEach((item) => {
      const pageConfig = SITEMAP_CONFIG.pages.find((p) => p.path === item.url.replace(SEO_CONFIG.BASE_URL, ''));
      expect(item.priority).toBe(pageConfig?.priority);
    });
  });

  it('should include last modification date', () => {
    const result = sitemap();
    const currentDate = new Date().toISOString().split('T')[0];

    result.forEach((item) => {
      expect(item.lastModified).toBe(currentDate);
    });
  });

  it('should generate valid URLs', () => {
    const result = sitemap();

    result.forEach((item) => {
      expect(item.url).toMatch(/^https?:\/\/.+/);
    });
  });

  it('should include home page with highest priority', () => {
    const result = sitemap();
    const homePage = result.find((item) => item.url === `${SEO_CONFIG.BASE_URL}/`);

    expect(homePage).toBeDefined();
    expect(homePage?.priority).toBe(1.0);
  });

  it('should include all calculator pages', () => {
    const result = sitemap();
    const urls = result.map((item) => item.url);

    expect(urls).toContain(`${SEO_CONFIG.BASE_URL}/calculator/fence`);
    expect(urls).toContain(`${SEO_CONFIG.BASE_URL}/calculator/canopy`);
  });

  it('should include services and portfolio pages', () => {
    const result = sitemap();
    const urls = result.map((item) => item.url);

    expect(urls).toContain(`${SEO_CONFIG.BASE_URL}/services`);
    expect(urls).toContain(`${SEO_CONFIG.BASE_URL}/portfolio`);
  });

  it('should include contacts page', () => {
    const result = sitemap();
    const urls = result.map((item) => item.url);

    expect(urls).toContain(`${SEO_CONFIG.BASE_URL}/contacts`);
  });
});
