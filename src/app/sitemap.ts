import { MetadataRoute } from 'next';
import { SEO_CONFIG, SITEMAP_CONFIG } from '@/lib/seo/constants';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = SEO_CONFIG.BASE_URL;
  const currentDate = new Date().toISOString().split('T')[0];

  const staticPages: MetadataRoute.Sitemap = SITEMAP_CONFIG.pages.map((page) => ({
    url: `${baseUrl}${page.path}`,
    lastModified: currentDate,
    changeFrequency: page.changefreq,
    priority: page.priority,
  }));

  return staticPages;
}
