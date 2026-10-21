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

import SmetaNaZaborPage, { metadata } from '@/app/(public)/smeta-na-zabor/page';
import { SMETA_MATERIALS, SMETA_PERIMETERS, SMETA_FAQ, SMETA_STEPS, SMETA_CHECKLIST } from '@/lib/zabor/smeta';
import { RATE_PROFNASTIL, RATE_EVROSHTAKETNIK, RATE_RABICA } from '@/lib/zabor/sravnenie';

describe('/smeta-na-zabor — смета на забор (ЧТЗ_SEO_Смета_на_Забор)', () => {
  it('metadata: Title из ЧТЗ (absolute), keywords кластера, canonical, index', () => {
    const title = (metadata.title as { absolute?: string })?.absolute ?? String(metadata.title);
    expect(title).toBe('Смета на забор — как рассчитать стоимость под ключ | Заборы и Навесы');
    expect(title.length).toBeLessThanOrEqual(70);

    const keywords = String(metadata.keywords);
    expect(keywords).toContain('сделать смету на забор');
    expect(keywords).toContain('рассчитать смету на забор');
    expect(keywords).toContain('смета на забор под ключ');

    expect(metadata.description).toContain('Московской области');
    expect(metadata.alternates?.canonical).toBe('https://zabor-i-naves.ru/smeta-na-zabor');
    expect((metadata.robots as any)?.index).toBe(true);
  });

  it('рендерит H1 и все обязательные секции по ЧТЗ', () => {
    render(<SmetaNaZaborPage />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Смета на забор: как рассчитать стоимость под ключ');
    expect(screen.getByRole('heading', { name: /Из чего состоит смета под ключ/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Примеры готовых смет/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Как рассчитать смету на забор самостоятельно/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Что должно быть в смете подрядчика/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Частые вопросы про смету на забор/ })).toBeInTheDocument();
  });

  it('структура сметы: полотно, столбы, монтаж, замер 0 ₽', () => {
    render(<SmetaNaZaborPage />);

    const table = screen.getByTestId('smeta-structure-table');
    expect(table).toHaveTextContent('Полотно забора');
    expect(table).toHaveTextContent('Столбы');
    expect(table).toHaveTextContent('Монтаж');
    expect(table).toHaveTextContent('Замер и составление сметы');
    expect(table).toHaveTextContent('0 ₽');
  });

  it('примеры смет: суммы = периметр × RATE_*, без выдуманных прайсов', () => {
    render(<SmetaNaZaborPage />);

    const table = screen.getByTestId('smeta-examples-table');
    // 130 м (10 соток): профнастил 338 000, евроштакетник 403 000, рабица 71 500
    expect(table).toHaveTextContent('338 000');
    expect(table).toHaveTextContent('403 000');
    expect(table).toHaveTextContent('71 500');
    // 100 м профнастил = 260 000; 160 м профнастил = 416 000
    expect(table).toHaveTextContent('260 000');
    expect(table).toHaveTextContent('416 000');

    // данные согласованы со ставками sravnenie.ts
    expect(SMETA_MATERIALS.map((m) => m.ratePerMeter)).toEqual([RATE_PROFNASTIL, RATE_EVROSHTAKETNIK, RATE_RABICA]);
    expect(SMETA_PERIMETERS.map((p) => p.perimeterM)).toEqual([100, 130, 160]);
  });

  it('шаги расчёта: 6 шагов, включая периметр, ворота, рельеф, чек-лист', () => {
    render(<SmetaNaZaborPage />);

    const steps = screen.getAllByTestId('smeta-step');
    expect(steps.length).toBe(6);
    expect(SMETA_STEPS.length).toBe(6);

    const stepsText = SMETA_STEPS.map((s) => s.title + s.text).join(' ').toLowerCase();
    expect(stepsText).toContain('периметр');
    expect(stepsText).toContain('ворота');
    expect(stepsText).toContain('рельеф');
    expect(stepsText).toContain('чек-лист');
    // цены ворот/калитки согласованы с прайсами проекта (calc/zabor-na-sotki, otkatnye-vorota)
    expect(stepsText).toContain('45 000');
    expect(stepsText).toContain('11 000');
  });

  it('чек-лист сметы подрядчика: 8 пунктов', () => {
    render(<SmetaNaZaborPage />);

    const checklist = screen.getByTestId('smeta-checklist');
    const items = checklist.querySelectorAll('li');
    expect(items.length).toBe(8);
    expect(SMETA_CHECKLIST.length).toBe(8);
    const checklistText = SMETA_CHECKLIST.join(' ').toLowerCase();
    expect(checklistText).toContain('ворота');
    expect(checklistText).toContain('демонтаж');
    expect(checklistText).toContain('гарантия');
  });

  it('LeadForm «Сделать смету с выездом замерщика — бесплатно» рендерится', () => {
    render(<SmetaNaZaborPage />);

    expect(screen.getByTestId('lead-form')).toBeInTheDocument();
    expect(screen.getAllByText(/Сделать смету с выездом замерщика — бесплатно/i).length).toBeGreaterThan(0);
  });

  it('FAQ: 6 вопросов, включая «сколько стоит» и «по фото»', () => {
    expect(SMETA_FAQ.length).toBeGreaterThanOrEqual(6);
    const faqText = SMETA_FAQ.map((f) => f.question).join(' ').toLowerCase();
    expect(faqText).toContain('сколько стоит');
    expect(faqText).toContain('по фото');

    render(<SmetaNaZaborPage />);
    expect(screen.getByTestId('faq-item-0')).toBeInTheDocument();
    expect(screen.getByTestId('faq-item-5')).toBeInTheDocument();
  });

  it('рендерит Service, FAQPage и BreadcrumbList JSON-LD', () => {
    const { container } = render(<SmetaNaZaborPage />);

    const scripts = container.querySelectorAll('script[type="application/ld+json"]');
    const parsed = Array.from(scripts).map((s) => JSON.parse(s.textContent || '{}'));
    const types = parsed.flatMap((p) => (Array.isArray(p) ? p.map((x: any) => x['@type']) : [p['@type']]));
    expect(types).toContain('Service');
    expect(types).toContain('FAQPage');
    expect(types).toContain('BreadcrumbList');
  });

  it('перелинковка: калькулятор, таблица соток, сравнение цен, телефон', () => {
    render(<SmetaNaZaborPage />);

    const links = screen.getAllByRole('link').map((l) => l.getAttribute('href'));
    expect(links).toContain('/calculator/fence');
    expect(links).toContain('/skolko-pogonnyh-metrov-v-sotkah');
    expect(links).toContain('/skolko-stoit-zabor-sravnenie');
    expect(links).toContain('tel:+74993901595');
  });
});
