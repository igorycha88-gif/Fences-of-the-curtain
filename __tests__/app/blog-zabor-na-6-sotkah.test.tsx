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

const blogFindMany = jest.fn();

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  prisma: {
    blogPost: {
      findMany: (...args: unknown[]) => blogFindMany(...args),
    },
  },
}));

import ZaborNa6SotkahArticle, { metadata } from '@/app/(public)/blog/zabor-na-6-sotkah/page';
import { HUB_FAQ, MONTAGE_STEPS } from '@/lib/blog/zaborNa6Sotkah';
import BlogListPage from '@/app/(public)/blog/page';

describe('/blog/zabor-na-6-sotkah — статья-хаб «Забор на 6 сотках» (ЧТЗ v5 TASK-ZN-05)', () => {
  it('metadata: Title из ЧТЗ (absolute), canonical', () => {
    const title = (metadata.title as { absolute?: string })?.absolute ?? String(metadata.title);
    expect(title).toBe('Забор на 6 сотках: сколько метров, сколько стоит, материалы — полный гид 2026');
    expect(metadata.alternates?.canonical).toBe('https://zabor-i-naves.ru/blog/zabor-na-6-sotkah');
    expect((metadata.robots as any)?.index).toBe(true);
  });

  it('рендерит H1 и все блоки гида', () => {
    render(<ZaborNa6SotkahArticle />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Забор на 6 сотках: полный гид 2026');
    expect(screen.getByRole('heading', { name: /Сколько метров забора в 6 сотках/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Сколько стоит забор на 6 соток по материалам/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Монтаж забора на 6 сотках по шагам/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Частые вопросы про забор на 6 сотках/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Полезные страницы по теме/ })).toBeInTheDocument();
  });

  it('периметр 6 соток: все варианты пропорций (4 строки)', () => {
    render(<ZaborNa6SotkahArticle />);

    const table = screen.getByTestId('six-sotki-proportions-table');
    const rows = table.querySelectorAll('tbody tr');
    expect(rows.length).toBe(4);
    expect(table).toHaveTextContent('100 м');
    expect(table).toHaveTextContent('98 м');
    expect(table).toHaveTextContent('124 м');
  });

  it('цены по материалам на 100 м + комбинированный вариант', () => {
    render(<ZaborNa6SotkahArticle />);

    const table = screen.getByTestId('six-sotki-prices-table');
    expect(table).toHaveTextContent('260 000');
    expect(table).toHaveTextContent('310 000');
    expect(table).toHaveTextContent('55 000');

    expect(screen.getAllByText(/90 000–130 000/i).length).toBeGreaterThan(0);
  });

  it('поэтапный монтаж: 5 шагов от замера до ворот', () => {
    expect(MONTAGE_STEPS.length).toBe(5);
    const stepsText = MONTAGE_STEPS.map((s) => s.step).join(' ');
    expect(stepsText).toContain('Замер');
    expect(stepsText).toContain('Столбы');
    expect(stepsText).toContain('Лаги');
    expect(stepsText).toContain('Полотно');
    expect(stepsText).toContain('Ворота');
  });

  it('FAQ: 5+ вопросов', () => {
    expect(HUB_FAQ.length).toBeGreaterThanOrEqual(5);
    render(<ZaborNa6SotkahArticle />);
    expect(screen.getByTestId('faq-item-0')).toBeInTheDocument();
    expect(screen.getByTestId('faq-item-4')).toBeInTheDocument();
  });

  it('рендерит Article, FAQPage и BreadcrumbList JSON-LD', () => {
    const { container } = render(<ZaborNa6SotkahArticle />);

    const scripts = container.querySelectorAll('script[type="application/ld+json"]');
    const parsed = Array.from(scripts).map((s) => JSON.parse(s.textContent || '{}'));
    const types = parsed.flatMap((p) => (Array.isArray(p) ? p.map((x: any) => x['@type']) : [p['@type']]));
    expect(types).toContain('Article');
    expect(types).toContain('FAQPage');
    expect(types).toContain('BreadcrumbList');
  });

  it('перелинковка по ЧТЗ: → ZN-01L (таблицы), → ZN-08 (сравнение), → калькулятор', () => {
    render(<ZaborNa6SotkahArticle />);

    const links = screen.getAllByRole('link').map((l) => l.getAttribute('href'));
    expect(links).toContain('/skolko-pogonnyh-metrov-v-sotkah');
    expect(links).toContain('/skolko-stoit-zabor-sravnenie');
    expect(links).toContain('/calculator/fence');
  });

  it('хаб отображается в списке блога featured-карточкой', async () => {
    blogFindMany.mockResolvedValue([]);

    render(await BlogListPage());

    const featured = screen.getByTestId('featured-hub-card');
    expect(featured).toHaveTextContent('Забор на 6 сотках');
    const link = featured.querySelector('a');
    expect(link?.getAttribute('href')).toBe('/blog/zabor-na-6-sotkah');
    expect(blogFindMany).toHaveBeenCalled();
  });
});
