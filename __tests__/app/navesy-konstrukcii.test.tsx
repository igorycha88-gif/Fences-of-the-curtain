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

import NavesyArochnyePage, { metadata as arochnyeMetadata } from '@/app/(public)/navesy/arochnye/page';
import NavesyDvuskatnyePage, { metadata as dvuskatnyeMetadata } from '@/app/(public)/navesy/dvuskatnye/page';
import {
  AROCHNYE_NAVESY_TYPES,
  AROCHNYE_NAVESY_FAQ,
  DVUSKATNYE_NAVESY_TYPES,
  DVUSKATNYE_NAVESY_FAQ,
} from '@/lib/landing/navesyKonstrukcii';

describe('/navesy/arochnye — «Арочный навес» (ЧТЗ_SEO_расширение_Wordstat, TASK-FRT-004, кластер 10 040)', () => {
  it('metadata: Title с ценой, canonical, keywords кластера', () => {
    const title = (arochnyeMetadata.title as { absolute?: string })?.absolute ?? String(arochnyeMetadata.title);
    expect(title).toContain('Арочный навес для автомобиля');
    expect(title).toContain('70 000');
    expect(arochnyeMetadata.alternates?.canonical).toBe('https://zabor-i-naves.ru/navesy/arochnye');

    const keywords = String(arochnyeMetadata.keywords);
    expect(keywords).toContain('арочный навес');
    expect(keywords).toContain('арочные фермы для навеса');
    expect(keywords).toContain('арочный навес из профильной трубы');
  });

  it('рендерит H1, таблицу размеров 6×3–6×6, конструкцию, FAQ ≥4, CTA', () => {
    render(<NavesyArochnyePage />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Арочный навес для автомобиля');
    expect(screen.getByRole('heading', { name: /Размеры и цены арочных навесов/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Конструкция арочного навеса/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Частые вопросы про арочные навесы/ })).toBeInTheDocument();
    expect(AROCHNYE_NAVESY_TYPES.length).toBe(3);
    expect(AROCHNYE_NAVESY_FAQ.length).toBeGreaterThanOrEqual(4);
    expect(screen.getByTestId('lead-form-navesy-arochnye')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Калькулятор навеса/ })).toHaveAttribute(
      'href',
      '/calculator/canopy'
    );
  });

  it('FAQ покрывает подкластеры: цена, поликарбонат, фермы, снег, профильная труба', () => {
    const faqText = AROCHNYE_NAVESY_FAQ.map((item) => item.question + item.answer).join(' ');
    expect(faqText).toMatch(/Сколько стоит арочный навес/);
    expect(faqText).toMatch(/снег/);
    expect(faqText).toMatch(/поликарбонат/);
    expect(faqText).toMatch(/профильн/);
  });
});

describe('/navesy/dvuskatnye — «Двускатный навес» (TASK-FRT-004, кластер 5 027)', () => {
  it('metadata: Title с ценой, canonical, keywords кластера', () => {
    const title = (dvuskatnyeMetadata.title as { absolute?: string })?.absolute ?? String(dvuskatnyeMetadata.title);
    expect(title).toContain('Двускатный навес');
    expect(title).toContain('68 000');
    expect(dvuskatnyeMetadata.alternates?.canonical).toBe('https://zabor-i-naves.ru/navesy/dvuskatnye');

    const keywords = String(dvuskatnyeMetadata.keywords);
    expect(keywords).toContain('навес двускатный');
    expect(keywords).toContain('навес двускатный для автомобиля');
    expect(keywords).toContain('навесы из металлопрофиля двускатный');
  });

  it('рендерит H1, таблицу размеров, конструкцию, FAQ ≥4, CTA', () => {
    render(<NavesyDvuskatnyePage />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Двускатный навес для авто и дачи');
    expect(screen.getByRole('heading', { name: /Размеры и цены двускатных навесов/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Конструкция двускатного навеса/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Частые вопросы про двускатные навесы/ })).toBeInTheDocument();
    expect(DVUSKATNYE_NAVESY_TYPES.length).toBe(3);
    expect(DVUSKATNYE_NAVESY_FAQ.length).toBeGreaterThanOrEqual(4);
    expect(screen.getByTestId('lead-form-navesy-dvuskatnye')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Калькулятор навеса/ })).toHaveAttribute(
      'href',
      '/calculator/canopy'
    );
  });

  it('FAQ и текст упоминают металлочерепицу (кластер «навес из металлочерепицы» 1 109)', () => {
    const faqText = DVUSKATNYE_NAVESY_FAQ.map((item) => item.question + item.answer).join(' ');
    expect(faqText).toMatch(/металлочерепиц/);
  });
});
