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

import SkolkoStoitZaborSravneniePage, { metadata } from '@/app/(public)/skolko-stoit-zabor-sravnenie/page';
import { SRAVNENIE_FAQ, PRICE_TRAPS } from '@/lib/zabor/sravnenie';

describe('/skolko-stoit-zabor-sravnenie — сравнение цен подрядчиков (ЧТЗ v5 TASK-ZN-08)', () => {
  it('metadata: Title из ЧТЗ (absolute), БЕЗ чужих брендов, canonical', () => {
    const title = (metadata.title as { absolute?: string })?.absolute ?? String(metadata.title);
    expect(title).toBe('Сколько стоит забор из профлиста под ключ — сравнение цен подрядчиков МО');
    expect(title).not.toMatch(/dostup|dlya doma|zaborexpress/i);
    expect(metadata.alternates?.canonical).toBe('https://zabor-i-naves.ru/skolko-stoit-zabor-sravnenie');
    expect((metadata.robots as any)?.index).toBe(true);
  });

  it('рендерит H1 и обязательные блоки по ЧТЗ', () => {
    render(<SkolkoStoitZaborSravneniePage />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Сколько стоит забор: сравнение цен');
    expect(screen.getByRole('heading', { name: /Цена за погонный метр по материалам/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Сколько выходит на 6, 10 и 15 соток/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Сравнение подрядчиков заборов в МО/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Почему дешёвые объявления потом дорожают/ })).toBeInTheDocument();
  });

  it('таблица ставок: 3 материала с ценой + 3D-панели по расчёту', () => {
    render(<SkolkoStoitZaborSravneniePage />);

    const table = screen.getByTestId('material-rates-table');
    expect(table).toHaveTextContent('2 600');
    expect(table).toHaveTextContent('3 100');
    expect(table).toHaveTextContent('550');
    expect(table).toHaveTextContent('3D-панели');
    expect(table).toHaveTextContent('по расчёту');
  });

  it('сметы 6/10/15 соток: профнастил 260–416 тыс., рабица от 55 тыс.', () => {
    render(<SkolkoStoitZaborSravneniePage />);

    const table = screen.getByTestId('sotki-costs-table');
    expect(table).toHaveTextContent('260 000');
    expect(table).toHaveTextContent('338 000');
    expect(table).toHaveTextContent('416 000');
    expect(table).toHaveTextContent('55 000');
  });

  it('перехват брендов: dostup-zabor и zabor dlya doma В ТЕКСТЕ с дисклеймером 09.2026', () => {
    const { container } = render(<SkolkoStoitZaborSravneniePage />);

    const pageText = container.textContent || '';
    expect(pageText).toContain('dostup-zabor');
    expect(pageText).toContain('zabor dlya doma');
    expect(pageText).toContain('09.2026');
    expect(pageText).toContain('без очернения');
  });

  it('таблица сравнения подрядчиков: цена п.м., сроки, гарантия, отзывы', () => {
    render(<SkolkoStoitZaborSravneniePage />);

    const table = screen.getByTestId('zabor-contractors-table');
    expect(table).toHaveTextContent('Профлист под ключ, за пог. метр');
    expect(table).toHaveTextContent('Сроки монтажа');
    expect(table).toHaveTextContent('Гарантия');
    expect(table).toHaveTextContent('Отзывы');
  });

  it('разбор «почему дешёвые дорожают»: 5 ловушек (выезд, рельеф, ворота)', () => {
    render(<SkolkoStoitZaborSravneniePage />);

    const traps = screen.getByTestId('price-traps');
    expect(traps.children.length).toBe(5);
    expect(PRICE_TRAPS.length).toBe(5);

    const trapsText = PRICE_TRAPS.map((t) => t.trap + t.detail).join(' ').toLowerCase();
    expect(trapsText).toContain('рельеф');
    expect(trapsText).toContain('ворота');
  });

  it('FAQ: 5+ вопросов, включая «10 соток под ключ» и вопрос про конкурентов', () => {
    expect(SRAVNENIE_FAQ.length).toBeGreaterThanOrEqual(5);
    const faqText = SRAVNENIE_FAQ.map((f) => f.question).join(' ');
    expect(faqText).toContain('10 соток');
    expect(faqText).toContain('dostup-zabor');

    render(<SkolkoStoitZaborSravneniePage />);
    expect(screen.getByTestId('faq-item-0')).toBeInTheDocument();
  });

  it('рендерит Service, FAQPage и BreadcrumbList JSON-LD', () => {
    const { container } = render(<SkolkoStoitZaborSravneniePage />);

    const scripts = container.querySelectorAll('script[type="application/ld+json"]');
    const parsed = Array.from(scripts).map((s) => JSON.parse(s.textContent || '{}'));
    const types = parsed.flatMap((p) => (Array.isArray(p) ? p.map((x: any) => x['@type']) : [p['@type']]));
    expect(types).toContain('Service');
    expect(types).toContain('FAQPage');
    expect(types).toContain('BreadcrumbList');
  });

  it('CTA на расчётную страницу ZN-01L и калькулятор', () => {
    render(<SkolkoStoitZaborSravneniePage />);

    const links = screen.getAllByRole('link').map((l) => l.getAttribute('href'));
    expect(links).toContain('/skolko-pogonnyh-metrov-v-sotkah');
    expect(links).toContain('tel:+74993901595');
  });
});
