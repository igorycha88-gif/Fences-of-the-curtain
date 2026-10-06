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
  default: function MockSeasonCountdown() {
    return <div data-testid="mock-season-countdown" />;
  },
}));

const blogFindMany = jest.fn();
const portfolioFindMany = jest.fn();
const pageContentFindMany = jest.fn();

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  prisma: {
    blogPost: { findMany: (...args: unknown[]) => blogFindMany(...args) },
    portfolioItem: { findMany: (...args: unknown[]) => portfolioFindMany(...args) },
    pageContent: { findMany: (...args: unknown[]) => pageContentFindMany(...args) },
  },
}));

import sitemap from '@/app/sitemap';
import NavesyPodKlyuchCenyPage from '@/app/(public)/navesy/pod-klyuch-ceny/page';
import NavesyZimaPage from '@/app/(public)/navesy/na-zimu-ot-snega/page';
describe('Инфраструктура посадочной гаражей: sitemap + обратные ссылки (TASK-GRZ-2)', () => {
  beforeEach(() => {
    blogFindMany.mockReset().mockResolvedValue([]);
    portfolioFindMany.mockReset().mockResolvedValue([]);
    pageContentFindMany.mockReset().mockResolvedValue([]);
  });

  it('sitemap содержит /garazhi-iz-sendvich-panelej (priority 0.8, weekly)', async () => {
    const result = await sitemap();

    const entry = result.find((item) => item.url === 'https://zabor-i-naves.ru/garazhi-iz-sendvich-panelej');
    expect(entry).toBeDefined();
    expect(entry?.priority).toBe(0.8);
    expect(entry?.changeFrequency).toBe('weekly');
  });

  it('«Навесы под ключ — цены»: блок «Нужен не навес, а тёплый гараж?» со ссылкой', () => {
    render(<NavesyPodKlyuchCenyPage />);

    expect(screen.getByRole('heading', { name: /Нужен не навес, а тёплый гараж\?/ })).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /Цены на гаражи/ });
    expect(link.getAttribute('href')).toBe('/garazhi-iz-sendvich-panelej');
    expect(screen.getAllByText(/40 000 ₽/).length).toBeGreaterThan(0);
  });

  it('«Навес на зиму от снега»: ссылка «тёплые гаражи из сэндвич-панелей»', async () => {
    render(await NavesyZimaPage());

    const link = screen.getByRole('link', { name: /тёплые гаражи из сэндвич-панелей/ });
    expect(link.getAttribute('href')).toBe('/garazhi-iz-sendvich-panelej');
  });
});
