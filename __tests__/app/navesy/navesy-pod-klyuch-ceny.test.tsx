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

import NavesyPodKlyuchCenyPage, { metadata } from '@/app/(public)/navesy/pod-klyuch-ceny/page';
import { CENY_FAQ, CONTRACTOR_QUESTIONS } from '@/lib/navesy/podKlyuchCeny';

describe('/navesy/pod-klyuch-ceny — навесы под ключ: цены и сравнение (ЧТЗ v5 TASK-ZN-07)', () => {
  it('metadata: Title из ЧТЗ (absolute), БЕЗ чужих брендов, canonical', () => {
    const title = (metadata.title as { absolute?: string })?.absolute ?? String(metadata.title);
    expect(title).toBe('Навесы под ключ — цены 2026, Москва и МО | Сравнение стоимости за м²');
    expect(title).not.toMatch(/zaborexpress|dostup|dlya doma/i);
    expect(metadata.alternates?.canonical).toBe('https://zabor-i-naves.ru/navesy/pod-klyuch-ceny');
    expect((metadata.robots as any)?.index).toBe(true);
  });

  it('рендерит H1 и обязательные блоки по ЧТЗ', () => {
    render(<NavesyPodKlyuchCenyPage />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Навесы под ключ: цены и сравнение');
    expect(screen.getByRole('heading', { name: /Таблица цен за м² по материалам и размерам/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Что входит в «под ключ»/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Сравнение подрядчиков навесов в МО/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Снеговая нагрузка Московской области/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Частые вопросы про цены/ })).toBeInTheDocument();
  });

  it('таблица цен: поликарбонат/профлист/металлочерепица по 4 размерам', () => {
    render(<NavesyPodKlyuchCenyPage />);

    const table = screen.getByTestId('ceny-prices-table');
    ['Поликарбонат', 'Профлист', 'Металлочерепица'].forEach((th) =>
      expect(table).toHaveTextContent(th)
    );
    expect(table).toHaveTextContent('39 000');
    expect(table).toHaveTextContent('94 000');
  });

  it('чек-лист «что входит в под ключ» и 7 вопросов подрядчику', () => {
    render(<NavesyPodKlyuchCenyPage />);

    expect(screen.getByTestId('turnkey-checklist').children.length).toBeGreaterThanOrEqual(8);
    const questions = screen.getByTestId('contractor-questions');
    expect(questions).toHaveTextContent('СП 20.13330');
    expect(CONTRACTOR_QUESTIONS.length).toBe(7);
  });

  it('безопасный формат перехвата: бренды zaborexpress и dostup-zabor В ТЕКСТЕ, не в Title', () => {
    const { container } = render(<NavesyPodKlyuchCenyPage />);

    const pageText = container.textContent || '';
    expect(pageText).toContain('zaborexpress.ru');
    expect(pageText).toContain('dostup-zabor');
    expect(pageText).toContain('09.2026');
    // без очернения — сравнение подано нейтрально
    expect(pageText).toContain('без очернения');
  });

  it('таблица сравнения подрядчиков: критерии включая снеговую нагрузку', () => {
    render(<NavesyPodKlyuchCenyPage />);

    const table = screen.getByTestId('contractors-comparison-table');
    expect(table).toHaveTextContent('Снеговая нагрузка (СП 20.13330)');
    expect(table).toHaveTextContent('180 кг/м²');
    expect(table).toHaveTextContent('Гарантия');
  });

  it('FAQ: 5+ вопросов, включая «сколько стоит» и снеговой расчёт', () => {
    expect(CENY_FAQ.length).toBeGreaterThanOrEqual(5);
    const questions = CENY_FAQ.map((f) => f.question.toLowerCase()).join(' ');
    expect(questions).toContain('сколько стоит навес под ключ');
    expect(questions).toContain('снеговую нагрузку');
  });

  it('рендерит Service, FAQPage и BreadcrumbList JSON-LD', () => {
    const { container } = render(<NavesyPodKlyuchCenyPage />);

    const scripts = container.querySelectorAll('script[type="application/ld+json"]');
    const parsed = Array.from(scripts).map((s) => JSON.parse(s.textContent || '{}'));
    const types = parsed.flatMap((p) => (Array.isArray(p) ? p.map((x: any) => x['@type']) : [p['@type']]));
    expect(types).toContain('Service');
    expect(types).toContain('FAQPage');
    expect(types).toContain('BreadcrumbList');
  });

  it('перелинковка: калькулятор навеса, размерные страницы, зимняя страница ZN-06', () => {
    render(<NavesyPodKlyuchCenyPage />);

    const links = screen.getAllByRole('link').map((l) => l.getAttribute('href'));
    expect(links).toContain('/calculator/canopy');
    expect(links).toContain('/navesy/na-zimu-ot-snega');
    expect(links).toContain('/navesy/6-na-4');
    expect(links).toContain('/navesy/5-na-3');
  });
});
