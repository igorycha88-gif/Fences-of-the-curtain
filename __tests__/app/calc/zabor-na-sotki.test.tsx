import '@testing-library/jest-dom';
import { describe, it, expect, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';

jest.mock('next/link', () => ({
  __esModule: true,
  default: function MockLink({ children, href, ...props }: any) {
    return <a href={href} {...props}>{children}</a>;
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

import ZaborNaSotkiPage, { metadata } from '@/app/(public)/calc/zabor-na-sotki/page';

describe('/calc/zabor-na-sotki hub page (ЧТЗ v3 TASK-06)', () => {
  it('metadata targets sotki intent with canonical', () => {
    expect(String(metadata.title)).toContain('6, 10, 15 соток');
    expect(metadata.description).toContain('под ключ');
    expect(metadata.alternates?.canonical).toBe('https://zabor-i-naves.ru/calc/zabor-na-sotki');
  });

  it('renders H1, sotki price table and perimeter formula blocks', () => {
    render(<ZaborNaSotkiPage />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Сколько стоит забор на участок: расчёт по соткам'
    );
    expect(
      screen.getByRole('heading', { name: /Таблица: сотки → периметр → цена/ })
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Как посчитать периметр самостоятельно/ })).toBeInTheDocument();

    const table = screen.getByTestId('sotki-table');
    expect(table).toHaveTextContent('6 соток');
    expect(table).toHaveTextContent('8 соток');
    expect(table).toHaveTextContent('10 соток');
    expect(table).toHaveTextContent('12 соток');
    expect(table).toHaveTextContent('15 соток');
    expect(table).toHaveTextContent('20 соток');
    expect(table).toHaveTextContent('100 м');
    expect(table).toHaveTextContent('260 000');
    expect(table).toHaveTextContent('180 м');
  });

  it('renders sections per sotki range', () => {
    render(<ZaborNaSotkiPage />);

    expect(screen.getByRole('heading', { name: 'Забор на 6 соток' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Забор на 10–12 соток' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Забор на 15–20 соток' })).toBeInTheDocument();
  });

  it('renders FAQ accordion with sotki questions', () => {
    render(<ZaborNaSotkiPage />);

    expect(screen.getByTestId('faq-item-0')).toHaveTextContent('Сколько метров забора нужно на 6 соток');
    expect(screen.getByTestId('faq-item-1')).toHaveTextContent('10 соток');
    expect(screen.getByTestId('faq-item-2')).toHaveTextContent('периметр неправильного участка');
  });

  it('renders Article, FAQPage and BreadcrumbList JSON-LD', () => {
    const { container } = render(<ZaborNaSotkiPage />);

    const scripts = container.querySelectorAll('script[type="application/ld+json"]');
    expect(scripts.length).toBeGreaterThan(0);

    const parsed = Array.from(scripts).map((s) => JSON.parse(s.textContent || '{}'));
    const types = parsed.flatMap((p) => (Array.isArray(p) ? p.map((x: any) => x['@type']) : [p['@type']]));
    expect(types).toContain('Article');
    expect(types).toContain('FAQPage');
    expect(types).toContain('BreadcrumbList');
  });

  it('links to fence calculator (CTA)', () => {
    render(<ZaborNaSotkiPage />);

    const links = screen.getAllByRole('link').map((l) => l.getAttribute('href'));
    expect(links).toContain('/calculator/fence');
  });
});
