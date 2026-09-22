import '@testing-library/jest-dom';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
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

jest.mock('@/components/seo/SeasonCountdown', () => ({
  __esModule: true,
  default: function MockCountdown({ targetIso }: { targetIso: string }) {
    return <div data-testid="mock-season-countdown" data-target={targetIso} />;
  },
}));

const portfolioFindMany = jest.fn();

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  prisma: {
    portfolioItem: {
      findMany: (...args: unknown[]) => portfolioFindMany(...args),
    },
  },
}));

import NavesyNaZimuPage, { metadata } from '@/app/(public)/navesy/na-zimu-ot-snega/page';
import { ZIMA_FAQ } from '@/lib/navesy/zima';

describe('/navesy/na-zimu-ot-snega — зимний навес (ЧТЗ v5 TASK-ZN-06)', () => {
  beforeEach(() => {
    portfolioFindMany.mockReset();
  });

  it('metadata: точный Title из ЧТЗ (absolute), canonical, индексация', () => {
    const title = (metadata.title as { absolute?: string })?.absolute ?? String(metadata.title);
    expect(title).toBe('Навес для автомобиля на зиму от снега — цена под ключ, монтаж до морозов');
    expect(metadata.alternates?.canonical).toBe('https://zabor-i-naves.ru/navesy/na-zimu-ot-snega');
    expect((metadata.robots as any)?.index).toBe(true);
  });

  it('рендерит H1 и все обязательные блоки по ЧТЗ', async () => {
    portfolioFindMany.mockResolvedValue([]);

    render(await NavesyNaZimuPage());

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('защита от снега и наледи');
    expect(screen.getByRole('heading', { name: /Снеговая нагрузка МО/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Тент на зиму или капитальный навес/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Успеть до заморозков/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Цены на зимние навесы под ключ/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Частые вопросы про зимние навесы/ })).toBeInTheDocument();
  });

  it('упоминает III снеговой район, СП 20.13330 и 180 кг/м² (экспертность)', async () => {
    portfolioFindMany.mockResolvedValue([]);

    render(await NavesyNaZimuPage());

    expect(screen.getAllByText(/III снегов/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/180 кг\/м²/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/20\.13330/).length).toBeGreaterThan(0);
  });

  it('таблица цен из размерных посадочных содержит все 4 размера', async () => {
    portfolioFindMany.mockResolvedValue([]);

    render(await NavesyNaZimuPage());

    const table = screen.getByTestId('zima-prices-table');
    expect(table).toHaveTextContent('39 000');
    expect(table).toHaveTextContent('47 000');
    expect(table).toHaveTextContent('62 000');
    expect(table).toHaveTextContent('94 000');
  });

  it('сезонный CTA-таймер с честной датой окончания окна', async () => {
    portfolioFindMany.mockResolvedValue([]);

    render(await NavesyNaZimuPage());

    const countdown = screen.getByTestId('mock-season-countdown');
    expect(countdown.getAttribute('data-target')).toBe('2026-11-15T00:00:00+03:00');
  });

  it('FAQ: 5+ вопросов про снег, наледь, уборку', () => {
    expect(ZIMA_FAQ.length).toBeGreaterThanOrEqual(5);
    const questions = ZIMA_FAQ.map((f) => f.question).join(' ').toLowerCase();
    expect(questions).toContain('снежную зиму');
    expect(questions).toContain('наледь');
    expect(questions).toContain('чистить снег');
  });

  it('рендерит FAQ, Service и BreadcrumbList JSON-LD', async () => {
    portfolioFindMany.mockResolvedValue([]);

    const { container } = render(await NavesyNaZimuPage());

    const scripts = container.querySelectorAll('script[type="application/ld+json"]');
    expect(scripts.length).toBeGreaterThan(0);

    const parsed = Array.from(scripts).map((s) => JSON.parse(s.textContent || '{}'));
    const types = parsed.flatMap((p) => (Array.isArray(p) ? p.map((x: any) => x['@type']) : [p['@type']]));
    expect(types).toContain('Service');
    expect(types).toContain('FAQPage');
    expect(types).toContain('BreadcrumbList');
  });

  it('запрашивает canopy-портфолио и переживает отказ БД', async () => {
    portfolioFindMany.mockRejectedValue(new Error('db down'));

    render(await NavesyNaZimuPage());

    expect(portfolioFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { active: true, category: 'canopy' },
        take: 6,
      })
    );
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('показывает фото зимних объектов при наличии портфолио', async () => {
    portfolioFindMany.mockResolvedValue([
      { id: 'obj-1', title: 'Навес 6×4 в Подольске' },
      { id: 'obj-2', title: 'Двускатный навес, Домодедово' },
    ]);

    render(await NavesyNaZimuPage());

    expect(screen.getByRole('heading', { name: /фото объектов/ })).toBeInTheDocument();
    const links = screen.getAllByRole('link').map((l) => l.getAttribute('href'));
    expect(links).toContain('/portfolio/obj-1');
    expect(links).toContain('/portfolio/obj-2');
  });

  it('перелинковка: калькулятор навеса, размерные страницы, страница цен ZN-07', async () => {
    portfolioFindMany.mockResolvedValue([]);

    render(await NavesyNaZimuPage());

    const links = screen.getAllByRole('link').map((l) => l.getAttribute('href'));
    expect(links).toContain('/calculator/canopy');
    expect(links).toContain('/navesy/6-na-4');
    expect(links).toContain('/navesy/pod-klyuch-ceny');
  });
});
