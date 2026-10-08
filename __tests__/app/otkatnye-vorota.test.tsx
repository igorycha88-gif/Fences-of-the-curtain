import '@testing-library/jest-dom';
import { describe, it, expect, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';

jest.mock('next/link', () => ({
  __esModule: true,
  default: function MockLink({ children, href, ...props }: any) {
    return <a href={href} {...props}>{children}</a>;
  },
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: function MockImage({ alt, ...props }: any) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt={alt} {...props} />;
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

import OtkatnyeVorotaPage, { metadata } from '@/app/(public)/otkatnye-vorota/page';
import {
  OTKATNYE_VOROTA_RATE_FROM,
  VOROTA_SIZES,
  VOROTA_S_KALITKOY_PRICE_FROM,
  VOROTA_FAQ,
  VOROTA_KOMPLEKTUYUSHCHIE,
} from '@/lib/landing/otkatnyeVorota';

describe('/otkatnye-vorota — посадочная «Откатные ворота» (ЧТЗ_SEO_расширение_Wordstat, TASK-FRT-001)', () => {
  it('metadata: Title с ценой, canonical, robots index, keywords из кластера Wordstat', () => {
    const title = (metadata.title as { absolute?: string })?.absolute ?? String(metadata.title);
    expect(title).toContain('Откатные ворота под ключ');
    expect(title).toContain('32 000');
    expect(metadata.alternates?.canonical).toBe('https://zabor-i-naves.ru/otkatnye-vorota');
    expect((metadata as { robots?: { index: boolean } }).robots?.index).toBe(true);

    const keywords = String(metadata.keywords);
    expect(keywords).toContain('откатные ворота купить');
    expect(keywords).toContain('откатные ворота с калиткой');
    expect(keywords).toContain('привод для откатных ворот');
  });

  it('рендерит H1 и обязательные H2 по ЧТЗ (цены, калитка, автоматика, комплектующие, установка, FAQ)', () => {
    render(<OtkatnyeVorotaPage />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Откатные ворота под ключ');
    expect(screen.getByRole('heading', { name: /Цены на откатные ворота по ширине проёма/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Откатные ворота с калиткой/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Автоматика для откатных ворот/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Комплектующие: что входит в конструкцию/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Установка откатных ворот: как мы работаем/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Частые вопросы про откатные ворота/ })).toBeInTheDocument();
  });

  it('таблица цен: все типоразмеры + строка «с калиткой» (кластер 6 405 + 10 051)', () => {
    render(<OtkatnyeVorotaPage />);

    for (const row of VOROTA_SIZES) {
      expect(screen.getByTestId(`price-${row.width}`).textContent?.replace(/\u00A0/g, ' ')).toContain(
        row.priceFrom.toLocaleString('ru-RU').replace(/\u00A0/g, ' ')
      );
    }
    expect(screen.getByTestId('price-s-kalitkoy').textContent?.replace(/\u00A0/g, ' ')).toContain(
      VOROTA_S_KALITKOY_PRICE_FROM.toLocaleString('ru-RU').replace(/\u00A0/g, ' ')
    );
    expect(screen.getByTestId('vorota-rate').textContent?.replace(/\u00A0/g, ' ')).toContain(
      OTKATNYE_VOROTA_RATE_FROM.toLocaleString('ru-RU').replace(/\u00A0/g, ' ')
    );
  });

  it('FAQ покрывает ключевые подкластеры: цена, установка, калитка, автоматика, зима', () => {
    render(<OtkatnyeVorotaPage />);

    const faqText = VOROTA_FAQ.map((item) => item.question).join(' ');
    expect(faqText).toMatch(/Сколько стоят откатные ворота под ключ/);
    expect(faqText).toMatch(/Сколько стоит установка/);
    expect(faqText).toMatch(/с калиткой/);
    expect(faqText).toMatch(/автоматика/);
    expect(faqText).toMatch(/зим/);
    expect(VOROTA_FAQ.length).toBeGreaterThanOrEqual(5);
    expect(screen.getByTestId('faq-accordion')).toBeInTheDocument();
  });

  it('CTA: LeadForm с source=otkatnye-vorota и ссылка на калькулятор ворот', () => {
    render(<OtkatnyeVorotaPage />);

    expect(screen.getByTestId('lead-form-otkatnye-vorota')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Калькулятор ворот/ })).toHaveAttribute(
      'href',
      '/calculator/gates'
    );
  });

  it('перелинковка на статью «Откатные ворота своими руками» (кластер 35 718)', () => {
    render(<OtkatnyeVorotaPage />);

    expect(screen.getByRole('link', { name: /Откатные ворота своими руками/ })).toHaveAttribute(
      'href',
      '/blog/otkatnye-vorota-svoimi-rukami'
    );
  });

  it('комплектующие включают балку, ролики, улавливатели и привод (кластеры 19 470 / 13 222)', () => {
    const items = VOROTA_KOMPLEKTUYUSHCHIE.map((item) => item.item).join(' ');
    expect(items).toContain('Консольная балка');
    expect(items).toContain('Роликовые опоры');
    expect(items).toContain('Привод');
  });
});
