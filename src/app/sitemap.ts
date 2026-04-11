import { MetadataRoute } from 'next';
import { SEO_CONFIG, SITEMAP_CONFIG } from '@/lib/seo/constants';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SEO_CONFIG.BASE_URL;
  const currentDate = new Date().toISOString().split('T')[0];

  const staticPages: MetadataRoute.Sitemap = SITEMAP_CONFIG.pages.map((page) => ({
    url: `${baseUrl}${page.path}`,
    lastModified: currentDate,
    changeFrequency: page.changefreq,
    priority: page.priority,
  }));

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
        select: { id: true, updatedAt: true },
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
      url: `${baseUrl}/portfolio/${item.id}`,
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
  } catch {}

  return [...staticPages, ...blogPages, ...portfolioPages, ...servicePagesSitemap];
}
