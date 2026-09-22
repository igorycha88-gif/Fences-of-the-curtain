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

import SkolkoPogonnyhMetrovPage, { metadata } from '@/app/(public)/skolko-pogonnyh-metrov-v-sotkah/page';
import {
  SOTKI_PERIMETER_TABLE,
  MATERIALS_TABLE,
  POG_METRY_FAQ,
} from '@/lib/zabor/pogMetry';

describe('/skolko-pogonnyh-metrov-v-sotkah — сотки → погонные метры (ЧТЗ v5 TASK-ZN-01L)', () => {
  it('metadata: Title и canonical по ЧТЗ', () => {
    const title = (metadata.title as { absolute?: string })?.absolute ?? String(metadata.title);
    expect(title).toBe('Сколько погонных метров забора в сотках — таблица 4–50 соток + смета');
    expect(metadata.alternates?.canonical).toBe('https://zabor-i-naves.ru/skolko-pogonnyh-metrov-v-sotkah');
    expect((metadata.robots as any)?.index).toBe(true);
  });

  it('рендерит H1 из ЧТЗ и все обязательные блоки', () => {
    render(<SkolkoPogonnyhMetrovPage />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Сотки → погонные метры забора: таблица');
    expect(screen.getByRole('heading', { name: /Таблица: сотки → периметр → погонные метры забора/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Сколько нужно столбов и листов на N соток/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Примерная смета под ключ по материалам/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Как посчитать периметр участка нестандартной формы/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Частые вопросы: сотки и погонные метры/ })).toBeInTheDocument();
  });

  it('СТАТИЧЕСКАЯ таблица 4–50 соток: 14 строк, кликабельные размеры из данных Вебмастера', () => {
    render(<SkolkoPogonnyhMetrovPage />);

    const table = screen.getByTestId('sotki-perimeter-table');
    const rows = table.querySelectorAll('tbody tr');
    expect(rows.length).toBe(14);

    ['4 сотки', '6 соток', '8 соток', '10 соток', '11 соток', '12 соток', '15 соток', '18 соток', '20 соток', '24 сотки', '25 соток', '30 соток', '40 соток', '50 соток'].forEach((label) => {
      expect(table).toHaveTextContent(label);
    });

    // контрольные точки из данных Вебмастера (клики): 18 соток → 180 м, 25 соток → 200 м
    const row18 = SOTKI_PERIMETER_TABLE.find((r) => r.sotki === '18 соток');
    expect(row18?.perimeterM).toBe(180);
    const row25 = SOTKI_PERIMETER_TABLE.find((r) => r.sotki === '25 соток');
    expect(row25?.perimeterM).toBe(200);
  });

  it('квадрат 10 соток = 126 м (контрольная формула 4×√1000 из ЧТЗ v4)', () => {
    const row10 = SOTKI_PERIMETER_TABLE.find((r) => r.sotki === '10 соток');
    expect(row10?.perimeterSquareM).toBe(126);
  });

  it('материальный расчёт: столбы/лаги/листы для 6–20 соток (поглощает ZN-03)', () => {
    render(<SkolkoPogonnyhMetrovPage />);

    const table = screen.getByTestId('materials-table');
    expect(table).toHaveTextContent('41');
    expect(table).toHaveTextContent('91');
    expect(table).toHaveTextContent('260');
    expect(MATERIALS_TABLE).toHaveLength(4);

    const six = MATERIALS_TABLE[0];
    expect(six.posts).toBe(41);
    expect(six.sheets).toBe(91);
    expect(six.lagsM).toBe(200);
  });

  it('смета по 3 материалам + форма заявки «Точный расчёт с выездом — бесплатно»', () => {
    render(<SkolkoPogonnyhMetrovPage />);

    const table = screen.getByTestId('estimate-table');
    expect(table).toHaveTextContent('Профнастил');
    expect(table).toHaveTextContent('Евроштакетник');
    expect(table).toHaveTextContent('Сетка-рабица');
    expect(table).toHaveTextContent('338 000');

    expect(screen.getByTestId('lead-form')).toBeInTheDocument();
    expect(screen.getAllByText(/Точный расчёт с выездом — бесплатно/i).length).toBeGreaterThan(0);
  });

  it('блок нестандартной формы: формулы и разбор «15 соток по периметру»', () => {
    render(<SkolkoPogonnyhMetrovPage />);

    expect(screen.getByText(/P = 2 × \(длина \+ ширина\)/)).toBeInTheDocument();
    expect(screen.getByText(/30 × 60 м \(18 соток\)/)).toBeInTheDocument();
    expect(screen.getAllByText(/15 соток — это сколько метров по периметру/i).length).toBeGreaterThan(0);
  });

  it('FAQ: 5+ вопросов, включая 25/18/11 соток и столбы', () => {
    expect(POG_METRY_FAQ.length).toBeGreaterThanOrEqual(5);
    const faqText = POG_METRY_FAQ.map((f) => f.question).join(' ');
    expect(faqText).toContain('25 соток');
    expect(faqText).toContain('18 сотках');
    expect(faqText).toContain('11 соток');
    expect(faqText).toContain('столбов');

    render(<SkolkoPogonnyhMetrovPage />);
    expect(screen.getByTestId('faq-item-0')).toBeInTheDocument();
    expect(screen.getByTestId('faq-item-4')).toBeInTheDocument();
  });

  it('рендерит Service, FAQPage и BreadcrumbList JSON-LD', () => {
    const { container } = render(<SkolkoPogonnyhMetrovPage />);

    const scripts = container.querySelectorAll('script[type="application/ld+json"]');
    const parsed = Array.from(scripts).map((s) => JSON.parse(s.textContent || '{}'));
    const types = parsed.flatMap((p) => (Array.isArray(p) ? p.map((x: any) => x['@type']) : [p['@type']]));
    expect(types).toContain('Service');
    expect(types).toContain('FAQPage');
    expect(types).toContain('BreadcrumbList');
  });

  it('перелинковка: калькулятор, сравнение цен (ZN-08), телефон', () => {
    render(<SkolkoPogonnyhMetrovPage />);

    const links = screen.getAllByRole('link').map((l) => l.getAttribute('href'));
    expect(links).toContain('/calculator/fence');
    expect(links).toContain('/skolko-stoit-zabor-sravnenie');
    expect(links).toContain('tel:+74993901595');
  });
});
