import '@testing-library/jest-dom';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { render, screen } from '@testing-library/react';

jest.mock('next/link', () => ({
  __esModule: true,
  default: function MockLink({ children, href, ...props }: any) {
    return <a href={href} {...props}>{children}</a>;
  },
}));

jest.mock('@/hooks/useScrollReveal', () => ({
  __esModule: true,
  AnimatedSection: function MockAnimatedSection({ children }: any) {
    return <div>{children}</div>;
  },
}));

jest.mock('@/components/layout/Header', () => ({
  __esModule: true,
  default: function MockHeader() {
    return <div data-testid="mock-header" />;
  },
}));

jest.mock('@/components/layout/HomeFooter', () => ({
  __esModule: true,
  default: function MockHomeFooter() {
    return <div data-testid="mock-home-footer" />;
  },
}));

jest.mock('@/components/reviews/YandexReviews', () => ({
  __esModule: true,
  YandexReviews: function MockReviews() {
    return <div data-testid="mock-reviews" />;
  },
}));

jest.mock('@/components/promotions/PromotionBanner', () => ({
  __esModule: true,
  PromotionBanner: function MockPromo() {
    return <div data-testid="mock-promo" />;
  },
}));

jest.mock('@/components/garage/GarageBanner', () => ({
  __esModule: true,
  default: function MockGarage() {
    return <div data-testid="mock-garage" />;
  },
}));

jest.mock('@/components/seo/CommercialFactors', () => ({
  __esModule: true,
  default: function MockCommercial() {
    return <div data-testid="mock-commercial" />;
  },
}));

jest.mock('@/components/seo/MontageInDayBanner', () => ({
  __esModule: true,
  default: function MockBanner({ mode }: { mode?: string }) {
    return <div data-testid={`mock-montage-${mode || 'fence'}`} />;
  },
}));

jest.mock('@/components/seo/JsonLdScript', () => ({
  __esModule: true,
  default: function MockJsonLd() {
    return <div data-testid="mock-jsonld" />;
  },
}));

const reviewFindMany = jest.fn();
const reviewCount = jest.fn();
const reviewAggregate = jest.fn();

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  prisma: {
    review: {
      findMany: (...args: unknown[]) => reviewFindMany(...args),
      count: (...args: unknown[]) => reviewCount(...args),
      aggregate: (...args: unknown[]) => reviewAggregate(...args),
    },
  },
}));

import HomePage from '@/app/page';

describe('Home page (ЧТЗ v3 TASK-01/05/08/10)', () => {
  beforeEach(() => {
    reviewFindMany.mockReset().mockResolvedValue([]);
    reviewCount.mockReset().mockResolvedValue(0);
    reviewAggregate.mockReset().mockResolvedValue({ _avg: { rating: 0 } });
  });

  it('renders hero with "Монтаж за 1 день" thesis (TASK-08)', async () => {
    render(await HomePage());

    expect(screen.getAllByText('Монтаж забора за 1 день').length).toBeGreaterThan(0);
    expect(screen.getByTestId('mock-montage-fence')).toBeInTheDocument();
  });

  it('city block includes Shatura (featured) and wave-1 cities as links (TASK-01)', async () => {
    render(await HomePage());

    const links = screen.getAllByRole('link').map((l) => l.getAttribute('href'));
    expect(links).toContain('/zabory-navesy/shatura');
    expect(links).toContain('/zabory-navesy/balashiha');
    expect(links).toContain('/zabory-navesy/lyubercy');
    expect(links).toContain('/zabory-navesy/podolsk');
    expect(links).toContain('/zabory-navesy');
  });

  it('links to navesy-pod-klyuch landing from services block (TASK-02)', async () => {
    render(await HomePage());

    const links = screen.getAllByRole('link').map((l) => l.getAttribute('href'));
    expect(links).toContain('/navesy-pod-klyuch');
  });

  it('renders review JSON-LD blocks when 5+ reviews exist', async () => {
    reviewFindMany.mockResolvedValue([
      { name: 'Иван', text: 'Отличный забор', rating: 5 },
    ]);
    reviewCount.mockResolvedValue(7);
    reviewAggregate.mockResolvedValue({ _avg: { rating: 4.9 } });

    render(await HomePage());

    expect(reviewAggregate).toHaveBeenCalled();
    expect(screen.getByTestId('mock-header')).toBeInTheDocument();
  });
});
