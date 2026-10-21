import { describe, it, expect, beforeEach, jest } from '@jest/globals';

jest.mock('@/lib/prisma', () => {
  const mockPrisma = {
    blogPost: { findMany: jest.fn().mockResolvedValue([]) },
    portfolioItem: { findMany: jest.fn().mockResolvedValue([]) },
    pageContent: { findMany: jest.fn().mockResolvedValue([]) },
  };
  return { prisma: mockPrisma };
});

import { prisma } from '@/lib/prisma';

describe('sitemap portfolio URLs (ЧТЗ SEO P1 2.5)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should use slug URLs for portfolio items', async () => {
    (prisma.portfolioItem.findMany as any).mockResolvedValue([
      {
        id: '05c85312-227b-400f-b6fd-3b2a245cd87d',
        slug: 'zabory-vorota-kalitki-iz-evroshtaketnika-pod-klyuch',
        updatedAt: new Date('2026-10-01T10:00:00Z'),
      },
    ]);

    const sitemapModule = await import('../src/app/sitemap');
    const result = await sitemapModule.default();

    const urls = result.map((item: any) => item.url);
    expect(urls).toContain(
      'https://zabor-i-naves.ru/portfolio/zabory-vorota-kalitki-iz-evroshtaketnika-pod-klyuch'
    );
    expect(urls).not.toContain(
      'https://zabor-i-naves.ru/portfolio/05c85312-227b-400f-b6fd-3b2a245cd87d'
    );
  });

  it('should fall back to id URL when slug is null (not backfilled)', async () => {
    (prisma.portfolioItem.findMany as any).mockResolvedValue([
      {
        id: '05c85312-227b-400f-b6fd-3b2a245cd87d',
        slug: null,
        updatedAt: new Date('2026-10-01T10:00:00Z'),
      },
    ]);

    const sitemapModule = await import('../src/app/sitemap');
    const result = await sitemapModule.default();

    const urls = result.map((item: any) => item.url);
    expect(urls).toContain(
      'https://zabor-i-naves.ru/portfolio/05c85312-227b-400f-b6fd-3b2a245cd87d'
    );
  });

  it('should log error when DB unavailable and keep static pages', async () => {
    (prisma.portfolioItem.findMany as any).mockRejectedValue(new Error('ECONNREFUSED'));

    const sitemapModule = await import('../src/app/sitemap');
    const result = await sitemapModule.default();

    const urls = result.map((item: any) => item.url);
    expect(urls).toContain('https://zabor-i-naves.ru/');
    expect(urls.find((u: string) => u.includes('/portfolio/'))).toBeUndefined();
  });
});
