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

jest.mock('@/components/seo/LeadForm', () => ({
  __esModule: true,
  default: function MockLeadForm({ source }: { source: string }) {
    return <div data-testid={`lead-form-${source}`} />;
  },
}));

jest.mock('@/components/geo/FaqAccordion', () => ({
  __esModule: true,
  default: function MockFaqAccordion({ items }: { items: { question: string }[] }) {
    return (
      <div data-testid="faq-accordion">
        {items.map((item) => (
          <div key={item.question}>{item.question}</div>
        ))}
      </div>
    );
  },
}));

import ZaborZhalyuziPage, { metadata } from '@/app/(public)/zabor-zhalyuzi/page';
import { ZHALYUZI_RATE_FROM, ZHALYUZI_OPTIONS, ZHALYUZI_FAQ } from '@/lib/landing/zaborZhalyuzi';

describe('/zabor-zhalyuzi — посадочная «Забор жалюзи» (ЧТЗ_SEO_расширение_Wordstat, TASK-FRT-002)', () => {
  it('metadata: Title с ценой за метр, canonical, keywords из кластера (59 455 показов/мес)', () => {
    const title = (metadata.title as { absolute?: string })?.absolute ?? String(metadata.title);
    expect(title).toContain('Забор жалюзи');
    expect(title).toContain('4 500');
    expect(metadata.alternates?.canonical).toBe('https://zabor-i-naves.ru/zabor-zhalyuzi');

    const keywords = String(metadata.keywords);
    expect(keywords).toContain('забор жалюзи купить');
    expect(keywords).toContain('забор жалюзи цена');
    expect(keywords).toContain('ламели для забора жалюзи');
  });

  it('рендерит H1 и обязательные H2 (преимущества, варианты цен, ламели, FAQ)', () => {
    render(<ZaborZhalyuziPage />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Забор жалюзи — цена за метр под ключ');
    expect(screen.getByRole('heading', { name: /Почему жалюзи, а не профнастил/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Варианты и цены забора жалюзи/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Ламели и каркас/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Частые вопросы про забор жалюзи/ })).toBeInTheDocument();
  });

  it('hero: цена от 4 500 ₽/м', () => {
    render(<ZaborZhalyuziPage />);

    expect(screen.getByTestId('zhalyuzi-rate').textContent?.replace(/\u00A0/g, ' ')).toContain('4 500 ₽');
  });

  it('таблица вариантов содержит горизонтальные ламели и двусторонний (кластеры 1 360 / 863)', () => {
    render(<ZaborZhalyuziPage />);

    const optionsText = ZHALYUZI_OPTIONS.map((row) => row.option).join(' ');
    expect(optionsText).toContain('Горизонтальные ламели');
    expect(optionsText).toContain('Двусторонний');
    expect(screen.getByTestId('zhalyuzi-price-table')).toBeInTheDocument();
  });

  it('FAQ ≥5 вопросов, CTA LeadForm и калькулятор', () => {
    render(<ZaborZhalyuziPage />);

    expect(ZHALYUZI_FAQ.length).toBeGreaterThanOrEqual(5);
    expect(screen.getByTestId('faq-accordion')).toBeInTheDocument();
    expect(screen.getByTestId('lead-form-zabor-zhalyuzi')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Калькулятор забора/ })).toHaveAttribute(
      'href',
      '/calculator/fence'
    );
  });
});
