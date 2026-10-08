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

import ZaboryPodKlyuchPage, { metadata } from '@/app/(public)/zabory-pod-klyuch/page';
import { POD_KLYUCH_MATERIALS, POD_KLYUCH_FAQ } from '@/lib/landing/zaboryPodKlyuch';

describe('/zabory-pod-klyuch — посадочная «Забор под ключ» (ЧТЗ_SEO_расширение_Wordstat, TASK-FRT-003)', () => {
  it('metadata: Title с ценой от 2 600 ₽/м, canonical, keywords из кластера (43 602)', () => {
    const title = (metadata.title as { absolute?: string })?.absolute ?? String(metadata.title);
    expect(title).toContain('Забор под ключ в Московской области');
    expect(title).toContain('2 600');
    expect(metadata.alternates?.canonical).toBe('https://zabor-i-naves.ru/zabory-pod-klyuch');

    const keywords = String(metadata.keywords);
    expect(keywords).toContain('забор под ключ');
    expect(keywords).toContain('забор под ключ цена');
    expect(keywords).toContain('заборы под ключ в московской области');
  });

  it('рендерит H1 и обязательные H2 (материалы-цены, что входит, сроки, FAQ)', () => {
    render(<ZaboryPodKlyuchPage />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Забор под ключ в Московской области');
    expect(screen.getByRole('heading', { name: /Цены под ключ по материалам/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Что входит в «под ключ»/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Сроки установки/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Частые вопросы про забор под ключ/ })).toBeInTheDocument();
  });

  it('таблица материалов: профнастил 2 600 ₽/м, евроштакетник 3 100 ₽/м (согласовано с RATE_*)', () => {
    render(<ZaboryPodKlyuchPage />);

    const rates = screen.getAllByTestId('rate').map((el) => el.textContent?.replace(/\u00A0/g, ' '));
    expect(rates.join(' ')).toContain('2 600 ₽');
    expect(rates.join(' ')).toContain('3 100 ₽');
    expect(POD_KLYUCH_MATERIALS.length).toBeGreaterThanOrEqual(4);
  });

  it('FAQ ≥5 вопросов: цена за метр, что входит, сроки, сравнение подрядчиков', () => {
    render(<ZaboryPodKlyuchPage />);

    const faqText = POD_KLYUCH_FAQ.map((item) => item.question).join(' ');
    expect(faqText).toMatch(/Сколько стоит забор под ключ за метр/);
    expect(faqText).toMatch(/Что входит/);
    expect(faqText).toMatch(/Сроки|Сколько времени/);
    expect(POD_KLYUCH_FAQ.length).toBeGreaterThanOrEqual(5);
    expect(screen.getByTestId('faq-accordion')).toBeInTheDocument();
  });

  it('CTA: LeadForm + калькулятор забора + перелинковка на статью «Какой забор выбрать»', () => {
    render(<ZaboryPodKlyuchPage />);

    expect(screen.getByTestId('lead-form-zabory-pod-klyuch')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Калькулятор забора/ })).toHaveAttribute(
      'href',
      '/calculator/fence'
    );
    expect(screen.getByRole('link', { name: /Какой забор выбрать для частного дома/ })).toHaveAttribute(
      'href',
      '/blog/kakoy-zabor-vybrat'
    );
  });
});
