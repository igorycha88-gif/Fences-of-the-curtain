import { MetadataRoute } from 'next';
import { SEO_CONFIG, SITEMAP_CONFIG } from '@/lib/seo/constants';
import { prisma } from '@/lib/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SEO_CONFIG.BASE_URL;
  const currentDate = new Date().toISOString().split('T')[0];

  const staticPages: MetadataRoute.Sitemap = SITEMAP_CONFIG.pages.map((page) => ({
    url: `${baseUrl}${page.path}`,
    lastModified: currentDate,
    changeFrequency: page.changefreq,
    priority: page.priority,
  }));

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

  const blogPages: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: post.updatedAt.toISOString().split('T')[0],
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  const portfolioPages: MetadataRoute.Sitemap = portfolioItems.map((item) => ({
    url: `${baseUrl}/portfolio/${item.id}`,
    lastModified: item.updatedAt.toISOString().split('T')[0],
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  }));

  const servicePagesSitemap: MetadataRoute.Sitemap = servicePages.map((page) => ({
    url: `${baseUrl}/services/${page.slug}`,
    lastModified: page.updatedAt.toISOString().split('T')[0],
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  return [...staticPages, ...blogPages, ...portfolioPages, ...servicePagesSitemap];
}
