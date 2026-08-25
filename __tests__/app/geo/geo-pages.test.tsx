import '@testing-library/jest-dom';
import { describe, it, expect, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';

jest.mock('next/link', () => ({
  __esModule: true,
  default: function MockLink({ children, href, ...props }: any) {
    return <a href={href} {...props}>{children}</a>;
  },
}));

jest.mock('next/navigation', () => ({
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

const portfolioFindMany = jest.fn();

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  prisma: {
    portfolioItem: {
      findMany: (...args: unknown[]) => portfolioFindMany(...args),
    },
  },
}));

import GeoPage, {
  generateMetadata,
  generateStaticParams,
} from '@/app/(public)/zabory-navesy/[slug]/page';
import IndexPage from '@/app/(public)/zabory-navesy/page';
import { GEO_SLUGS } from '@/lib/geo/cities';

function makeParams(slug: string) {
  return { params: Promise.resolve({ slug }) };
}

describe('geo page generateStaticParams', () => {
  it('returns all city and hub slugs', () => {
    const result = generateStaticParams();
    expect(result).toHaveLength(35);
    expect(result).toContainEqual({ slug: 'balashiha' });
    expect(result).toContainEqual({ slug: 'vostok-podmoskovya' });
  });
});

describe('geo page generateMetadata', () => {
  it('builds city metadata with title, description, canonical', async () => {
    const metadata = await generateMetadata(makeParams('balashiha'));
    expect(metadata.title).toContain('Балашихе');
    expect(metadata.alternates?.canonical).toBe(
      'https://zabor-i-naves.ru/zabory-navesy/balashiha'
    );
    expect((metadata as { robots?: { index: boolean } }).robots?.index).toBe(true);
  });

  it('builds hub metadata', async () => {
    const metadata = await generateMetadata(makeParams('yug-podmoskovya'));
    expect(String(metadata.title)).toContain('Юг Подмосковья');
  });

  it('returns empty metadata for unknown slug', async () => {
    const metadata = await generateMetadata(makeParams('unknown-city'));
    expect(metadata).toEqual({});
  });
});

describe('geo city page rendering', () => {
  beforeEach(() => {
    portfolioFindMany.mockReset();
  });

  it('renders full city page with all sections (US-1)', async () => {
    portfolioFindMany.mockResolvedValue([
      { id: 'p1', title: 'Забор в Балашихе', category: 'fence', images: [] },
    ]);

    const element = await GeoPage(makeParams('balashiha'));
    render(element);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Заборы и навесы в Балашихе'
    );
    expect(
      screen.getByRole('heading', { name: 'Забор из профнастила в Балашихе' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Евроштакетник и 3D-заборы' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Навесы для автомобилей в Балашихе' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Цены с монтажом и доставкой в Балашихе' })
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Районы выезда' })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /Частые вопросы про заборы и навесы в Балашихе/ })
    ).toBeInTheDocument();

    expect(portfolioFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { active: true }, take: 6 })
    );
    expect(screen.getByText('Забор в Балашихе')).toBeInTheDocument();

    const jsonLd = document.querySelectorAll('script[type="application/ld+json"]');
    expect(jsonLd.length).toBeGreaterThanOrEqual(1);
  });

  it('renders FAQ items via accordion', async () => {
    portfolioFindMany.mockResolvedValue([]);

    const element = await GeoPage(makeParams('podolsk'));
    render(element);

    expect(screen.getByTestId('faq-item-0')).toBeInTheDocument();
    expect(screen.getByTestId('faq-item-4')).toBeInTheDocument();
  });

  it('renders dacha block only for dacha cities', async () => {
    portfolioFindMany.mockResolvedValue([]);

    const serpuhov = await GeoPage(makeParams('serpuhov'));
    render(serpuhov);
    expect(
      screen.getByRole('heading', { name: /Заборы для дачи и СНТ в Серпухове/ })
    ).toBeInTheDocument();
  });

  it('renders hub page with city links (US-2)', async () => {
    const element = await GeoPage(makeParams('vostok-podmoskovya'));
    render(element);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Восток Подмосковья'
    );
    expect(screen.getByRole('heading', { name: 'Города направления' })).toBeInTheDocument();
    expect(screen.getByText('Балашиха')).toBeInTheDocument();

    const links = screen.getAllByRole('link');
    expect(
      links.some((link) => link.getAttribute('href') === '/zabory-navesy/balashiha')
    ).toBe(true);
    expect(
      links.some((link) => link.getAttribute('href') === '/zabory-navesy/yugo-vostok-podmoskovya')
    ).toBe(true);
  });

  it('throws notFound for unknown slug', async () => {
    await expect(GeoPage(makeParams('moskva-city'))).rejects.toThrow('NEXT_NOT_FOUND');
  });

  it('renders even when portfolio database fails (error handling)', async () => {
    portfolioFindMany.mockRejectedValue(new Error('db down'));

    const element = await GeoPage(makeParams('noginsk'));
    expect(element).toBeTruthy();
    render(element);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Заборы и навесы в Ногинске'
    );
  });

  it('city page links neighbours and direction hub (interlinking US-1)', async () => {
    portfolioFindMany.mockResolvedValue([]);

    const element = await GeoPage(makeParams('lyubercy'));
    render(element);

    const links = screen.getAllByRole('link').map((l) => l.getAttribute('href'));
    expect(links).toContain('/zabory-navesy/yugo-vostok-podmoskovya');
    expect(links).toContain('/calculator/fence');
    expect(links).toContain('/calculator/canopy');
    expect(links).toContain('/services/zabor-iz-profnastila');
  });
});

describe('geo index page', () => {
  it('renders all directions and cities (US-3)', () => {
    render(<IndexPage />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Заборы и навесы в Подмосковье'
    );
    expect(screen.getByText('Восток Подмосковья')).toBeInTheDocument();
    expect(screen.getByText('Юго-восток Подмосковья')).toBeInTheDocument();
    expect(screen.getByText('Юг Подмосковья')).toBeInTheDocument();
    expect(screen.getByText('Балашиха')).toBeInTheDocument();
    expect(screen.getByText('Серпухов')).toBeInTheDocument();
    expect(screen.getByText('Раменское')).toBeInTheDocument();

    const links = screen.getAllByRole('link').map((l) => l.getAttribute('href'));
    expect(links).toContain('/zabory-navesy/vostok-podmoskovya');
    expect(links).toContain('/zabory-navesy/balashiha');
    expect(links).toContain('/zabory-navesy/serpuhov');
  });
});
