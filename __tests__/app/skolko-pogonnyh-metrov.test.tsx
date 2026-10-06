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
  SELF_CALC_STEPS,
  COST_BY_SOTKI,
  RATE_PROFNASTIL,
  RATE_EVROSHTAKETNIK,
  RATE_RABICA,
  GEO_MINI_SOTKI_TABLE,
} from '@/lib/zabor/pogMetry';

describe('/skolko-pogonnyh-metrov-v-sotkah — сотки → погонные метры (ЧТЗ v5 ZN-01L + v6 ZN-1)', () => {
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

  it('СТАТИЧЕСКАЯ таблица 4–50 соток: 15 строк, включая новые якоря v6 «21 сотка» и «5 гектар»', () => {
    render(<SkolkoPogonnyhMetrovPage />);

    const table = screen.getByTestId('sotki-perimeter-table');
    const rows = table.querySelectorAll('tbody tr');
    expect(rows.length).toBe(15);

    ['4 сотки', '6 соток', '8 соток', '10 соток', '11 соток', '12 соток', '15 соток', '18 соток', '20 соток', '21 сотка', '24 сотки', '25 соток', '30 соток', '40 соток', '50 соток (5 гектар)'].forEach((label) => {
      expect(table).toHaveTextContent(label);
    });

    // контрольные точки из данных Вебмастера (клики): 18 соток → 180 м, 25 соток → 200 м
    const row18 = SOTKI_PERIMETER_TABLE.find((r) => r.sotki === '18 соток');
    expect(row18?.perimeterM).toBe(180);
    const row25 = SOTKI_PERIMETER_TABLE.find((r) => r.sotki === '25 соток');
    expect(row25?.perimeterM).toBe(200);
  });

  it('ЧТЗ v6 ZN-1: строка «21 сотка» — пропорции 30 × 70, периметр 200 м, квадрат 183 м', () => {
    const row21 = SOTKI_PERIMETER_TABLE.find((r) => r.sotki === '21 сотка');
    expect(row21).toBeDefined();
    expect(row21?.plotSize).toBe('30 × 70 м');
    expect(row21?.perimeterM).toBe(200);
    expect(row21?.perimeterSquareM).toBe(183);
    // 30 × 70 = 2100 м² = 21 сотка; 4 × √2100 ≈ 183,3
    expect(30 * 70).toBe(2100);
  });

  it('ЧТЗ v6 ZN-1: строка «5 гектар (=50 соток)» — 300 м периметра', () => {
    const row5ga = SOTKI_PERIMETER_TABLE.find((r) => r.sotki === '50 соток (5 гектар)');
    expect(row5ga).toBeDefined();
    expect(row5ga?.perimeterM).toBe(300);
    expect(row5ga?.plotSize).toBe('50 × 100 м');
  });

  it('ЧТЗ v6 ZN-1: H2 «Как рассчитать периметр забора самому» — 4 шага, пример 14 соток, CTA', () => {
    render(<SkolkoPogonnyhMetrovPage />);

    expect(screen.getByRole('heading', { name: /Как рассчитать периметр забора самому/ })).toBeInTheDocument();

    const steps = screen.getAllByTestId('self-calc-step');
    expect(steps.length).toBe(4);
    expect(SELF_CALC_STEPS[0].title).toContain('сотки в квадратные метры');
    expect(SELF_CALC_STEPS[1].title).toContain('пропорции');
    expect(SELF_CALC_STEPS[2].title).toContain('периметр');
    expect(SELF_CALC_STEPS[3].title).toContain('погонные метры');

    // разбор на примере 14 соток: 35 × 40 → 150 м; 20 × 70 → 180 м
    const summary = screen.getByTestId('self-calc-summary');
    expect(summary).toHaveTextContent('14 соток');
    expect(summary).toHaveTextContent('150 м');
    expect(summary).toHaveTextContent('180 м');
    // CTA по ЧТЗ: «проверьте себя нашей таблицей / закажите точный расчёт»
    expect(summary.textContent).toMatch(/проверьте себя нашей таблицей выше/i);
    expect(summary.textContent).toMatch(/закажите точный расчёт/i);
  });

  it('ЧТЗ v6 ZN-1: H2 «Сколько будет стоить забор на N соток» — деньги-таблица 7 размеров × 3 материала', () => {
    render(<SkolkoPogonnyhMetrovPage />);

    expect(screen.getByRole('heading', { name: /Сколько будет стоить забор на N соток/ })).toBeInTheDocument();

    const table = screen.getByTestId('cost-by-sotki-table');
    const rows = table.querySelectorAll('tbody tr');
    expect(rows.length).toBe(7);

    expect(table).toHaveTextContent('14 соток');
    expect(table).toHaveTextContent('21 сотка');
    expect(table).toHaveTextContent('50 соток (5 гектар)');
    expect(screen.getByText(/Во сколько обойдётся забор/i)).toBeInTheDocument();

    // контрольные суммы: 21 сотка (200 м) × 2600 = 520 000 ₽; 5 гектар (300 м) × 3100 = 930 000 ₽
    const row21 = COST_BY_SOTKI.find((r) => r.sotki === '21 сотка');
    expect(row21?.perimeterM * RATE_PROFNASTIL).toBe(520000);
    const row5ga = COST_BY_SOTKI.find((r) => r.sotki === '50 соток (5 гектар)');
    expect(row5ga?.perimeterM * RATE_EVROSHTAKETNIK).toBe(930000);
    const row14 = COST_BY_SOTKI.find((r) => r.sotki === '14 соток');
    expect(row14?.perimeterM * RATE_RABICA).toBe(82500);
  });

  it('ЧТЗ v6 ZN-5: экспорт GEO_MINI_SOTKI_TABLE — 5 строк для гео-страниц', () => {
    expect(GEO_MINI_SOTKI_TABLE.length).toBe(5);
    expect(GEO_MINI_SOTKI_TABLE.map((r) => r.sotki)).toEqual([
      '6 соток',
      '10 соток',
      '15 соток',
      '20 соток',
      '50 соток (5 гектар)',
    ]);
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

    // формула встречается в блоке нестандартной формы и в методике ZN-1
    expect(screen.getAllByText(/P = 2 × \(длина \+ ширина\)/).length).toBeGreaterThanOrEqual(1);
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
