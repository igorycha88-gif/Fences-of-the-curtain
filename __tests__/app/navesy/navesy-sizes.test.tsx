import '@testing-library/jest-dom';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { render, screen } from '@testing-library/react';

jest.mock('next/link', () => ({
  __esModule: true,
  default: function MockLink({ children, href, ...props }: any) {
    return <a href={href} {...props}>{children}</a>;
  },
}));

jest.mock('next/navigation', () => ({
  __esModule: true,
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND');
  },
}));

jest.mock('@/components/layout/Header', () => ({
  __esModule: true,
  default: function MockHeader() {
    return <div data-testid="mock-header" />;
  },
}));

jest.mock('@/components/layout/Footer', () => ({
  __esModule: true,
  default: function MockFooter() {
    return <div data-testid="mock-footer" />;
  },
}));

jest.mock('@/components/seo/MontageInDayBanner', () => ({
  __esModule: true,
  default: function MockBanner({ mode }: { mode?: string }) {
    return <div data-testid={`mock-montage-${mode || 'fence'}`} />;
  },
}));

const portfolioFindMany = jest.fn();

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  prisma: {
    portfolioItem: {
      findMany: (...args: unknown[]) => portfolioFindMany(...args),
    },
  },
}));

import NavesySizePage, {
  generateStaticParams,
  generateMetadata,
} from '@/app/(public)/navesy/[slug]/page';
import { NAVESY_SIZE_SLUGS } from '@/lib/navesy/sizes';

describe('/navesy/[slug] size landing pages (ЧТЗ v3 TASK-07)', () => {
  beforeEach(() => {
    portfolioFindMany.mockReset();
  });

  it('generateStaticParams returns all 4 size slugs', () => {
    const params = generateStaticParams();
    expect(params).toHaveLength(4);
    expect(params.map((p) => p.slug)).toEqual(
      expect.arrayContaining(['6-na-4', '6-na-3', '5-na-3', 'na-2-mashiny'])
    );
  });

  it('generateMetadata builds title, canonical and robots for a size', async () => {
    const metadata = await generateMetadata({ params: Promise.resolve({ slug: '6-na-4' }) });

    expect(String(metadata.title)).toContain('6 на 4');
    expect(metadata.alternates?.canonical).toBe('https://zabor-i-naves.ru/navesy/6-na-4');
    expect((metadata.robots as any)?.index).toBe(true);
  });

  it('generateMetadata returns empty object for unknown slug', async () => {
    const metadata = await generateMetadata({ params: Promise.resolve({ slug: 'unknown' }) });
    expect(metadata).toEqual({});
  });

  it('renders 6x4 page with all required sections and price', async () => {
    portfolioFindMany.mockResolvedValue([]);

    render(await NavesySizePage({ params: Promise.resolve({ slug: '6-na-4' }) }));

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('6×4');
    expect(screen.getByRole('heading', { name: /Чертёж и размеры/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Снеговая и ветровая нагрузка/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Цена под ключ по материалам/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Частые вопросы/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Другие популярные размеры/ })).toBeInTheDocument();

    expect(screen.getByText('24 м²')).toBeInTheDocument();
    expect(screen.getByTestId('size-scheme')).toBeInTheDocument();
    expect(screen.getAllByText(/62 000/i).length).toBeGreaterThan(0);
  });

  it('mentions snow load region III (E-E-A-T / safety)', async () => {
    portfolioFindMany.mockResolvedValue([]);

    render(await NavesySizePage({ params: Promise.resolve({ slug: '6-na-4' }) }));

    expect(screen.getAllByText(/III снегов/i).length).toBeGreaterThan(0);
  });

  it('renders FAQ accordion items', async () => {
    portfolioFindMany.mockResolvedValue([]);

    render(await NavesySizePage({ params: Promise.resolve({ slug: 'na-2-mashiny' }) }));

    expect(screen.getByTestId('faq-item-0')).toBeInTheDocument();
    expect(screen.getByTestId('faq-item-1')).toBeInTheDocument();
  });

  it('renders FAQPage, Service and BreadcrumbList JSON-LD', async () => {
    portfolioFindMany.mockResolvedValue([]);

    const { container } = render(
      await NavesySizePage({ params: Promise.resolve({ slug: '6-na-4' }) })
    );

    const scripts = container.querySelectorAll('script[type="application/ld+json"]');
    expect(scripts.length).toBeGreaterThan(0);

    const parsed = Array.from(scripts).map((s) => JSON.parse(s.textContent || '{}'));
    const types = parsed.flatMap((p) => (Array.isArray(p) ? p.map((x: any) => x['@type']) : [p['@type']]));
    expect(types).toContain('BreadcrumbList');
    expect(types).toContain('Service');
    expect(types).toContain('FAQPage');
  });

  it('queries only canopy portfolio and survives db failure', async () => {
    portfolioFindMany.mockRejectedValue(new Error('db down'));

    render(await NavesySizePage({ params: Promise.resolve({ slug: '5-na-3' }) }));

    expect(portfolioFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { active: true, category: 'canopy' },
        take: 6,
      })
    );
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('links to calculator, hub and other sizes (interlinking)', async () => {
    portfolioFindMany.mockResolvedValue([]);

    render(await NavesySizePage({ params: Promise.resolve({ slug: '6-na-3' }) }));

    const links = screen.getAllByRole('link').map((l) => l.getAttribute('href'));
    expect(links).toContain('/calculator/canopy');
    expect(links).toContain('/navesy-pod-klyuch');
    expect(links).toContain('/navesy/6-na-4');
    expect(links).toContain('/navesy/na-2-mashiny');
  });

  it('throws notFound for unknown slug', async () => {
    await expect(
      NavesySizePage({ params: Promise.resolve({ slug: 'neizvestnyy' }) })
    ).rejects.toThrow('NEXT_NOT_FOUND');
  });

  it('exposes all slugs via NAVESY_SIZE_SLUGS', () => {
    expect(NAVESY_SIZE_SLUGS).toHaveLength(4);
  });
});
