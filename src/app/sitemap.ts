import { MetadataRoute } from 'next';
import { SEO_CONFIG, SITEMAP_CONFIG } from '@/lib/seo/constants';
import { prisma } from '@/lib/prisma';
import logger from '@/lib/logger';
import { GEO_CITIES, GEO_HUBS } from '@/lib/geo/cities';
import { NAVESY_SIZES } from '@/lib/navesy/sizes';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SEO_CONFIG.BASE_URL;
  // Честный lastmod: фиксированная дата последнего контентного релиза.
  // Фиктивная «сегодняшняя» дата обесценивает lastmod для поисковиков (SEO-фикс по книгам).
  const contentLastModified = SEO_CONFIG.CONTENT_LAST_UPDATED;

  const staticPages: MetadataRoute.Sitemap = SITEMAP_CONFIG.pages.map((page) => ({
    url: `${baseUrl}${page.path}`,
    lastModified: contentLastModified,
    changeFrequency: page.changefreq,
    priority: page.priority,
  }));

  const geoPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/zabory-navesy`,
      lastModified: contentLastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    ...GEO_HUBS.map((hub) => ({
      url: `${baseUrl}/zabory-navesy/${hub.slug}`,
      lastModified: contentLastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
    ...GEO_CITIES.map((city) => ({
      url: `${baseUrl}/zabory-navesy/${city.slug}`,
      lastModified: contentLastModified,
      changeFrequency: 'weekly' as const,
      priority: city.wave === 1 ? 0.8 : 0.7,
    })),
  ];

  const navesyPodKlyuchPage: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/navesy-pod-klyuch`,
      lastModified: contentLastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
  ];

  const navesySizePages: MetadataRoute.Sitemap = NAVESY_SIZES.map((size) => ({
    url: `${baseUrl}/navesy/${size.slug}`,
    lastModified: contentLastModified,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  const zaborNaSotkiPage: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/calc/zabor-na-sotki`,
      lastModified: contentLastModified,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
  ];

  // ЧТЗ v5 (SEO для владельца, P0): сезонные и расчётные SEO-посадочные
  const seoLandingPagesV5: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/navesy/na-zimu-ot-snega`,
      lastModified: contentLastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/navesy/pod-klyuch-ceny`,
      lastModified: contentLastModified,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/skolko-pogonnyh-metrov-v-sotkah`,
      lastModified: contentLastModified,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/skolko-stoit-zabor-sravnenie`,
      lastModified: contentLastModified,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog/zabor-na-6-sotkah`,
      lastModified: contentLastModified,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
  ];

  // ЧТЗ_SEO_Гаражи_Сэндвич_Панели: посадочная «Гаражи из сэндвич-панелей»
  const garazhiSendvichPage: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/garazhi-iz-sendvich-panelej`,
      lastModified: contentLastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
  ];

  // ЧТЗ_SEO_Смета_на_Забор: посадочная «Смета на забор»
  const smetaNaZaborPage: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/smeta-na-zabor`,
      lastModified: contentLastModified,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
  ];

  // ЧТЗ_SEO_расширение_Wordstat: посадочные по кластерам Wordstat
  const seoLandingPagesWordstat: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/otkatnye-vorota`,
      lastModified: contentLastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/zabor-zhalyuzi`,
      lastModified: contentLastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/zabory-pod-klyuch`,
      lastModified: contentLastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/navesy/arochnye`,
      lastModified: contentLastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/navesy/dvuskatnye`,
      lastModified: contentLastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
  ];

  let blogPages: MetadataRoute.Sitemap = [];
  let portfolioPages: MetadataRoute.Sitemap = [];
  let servicePagesSitemap: MetadataRoute.Sitemap = [];

  try {
    const [blogPosts, portfolioItems, servicePages] = await Promise.all([
      prisma.blogPost.findMany({
        where: { published: true },
        select: { slug: true, updatedAt: true },
      }),
      prisma.portfolioItem.findMany({
        where: { active: true },
        select: { id: true, slug: true, updatedAt: true },
      }),
      prisma.pageContent.findMany({
        where: { isActive: true },
        select: { slug: true, updatedAt: true },
      }),
    ]);

    blogPages = blogPosts.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: post.updatedAt.toISOString().split('T')[0],
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }));

    portfolioPages = portfolioItems.map((item) => ({
      // ЧТЗ SEO P1 2.5: slug-URL вместо UUID (фолбэк на id до бэкфилла)
      url: `${baseUrl}/portfolio/${item.slug || item.id}`,
      lastModified: item.updatedAt.toISOString().split('T')[0],
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    }));

    servicePagesSitemap = servicePages.map((page) => ({
      url: `${baseUrl}/services/${page.slug}`,
      lastModified: page.updatedAt.toISOString().split('T')[0],
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }));
  } catch (error) {
    logger.error('Sitemap: failed to load dynamic pages from database', {
      module: 'sitemap',
      operation: 'loadDynamicPages',
      error,
    });
  }

  return [
    ...staticPages,
    ...geoPages,
    ...navesyPodKlyuchPage,
    ...navesySizePages,
    ...zaborNaSotkiPage,
    ...seoLandingPagesV5,
    ...garazhiSendvichPage,
    ...smetaNaZaborPage,
    ...seoLandingPagesWordstat,
    ...blogPages,
    ...portfolioPages,
    ...servicePagesSitemap,
  ];
}
