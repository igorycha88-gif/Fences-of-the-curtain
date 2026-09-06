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

const portfolioFindMany = jest.fn();

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  prisma: {
    portfolioItem: {
      findMany: (...args: unknown[]) => portfolioFindMany(...args),
    },
  },
}));

import NavesyPodKlyuchPage, { metadata } from '@/app/(public)/navesy-pod-klyuch/page';

describe('/navesy-pod-klyuch page (US-4)', () => {
  beforeEach(() => {
    portfolioFindMany.mockReset();
  });

  it('metadata targets the main commercial query', () => {
    expect(String(metadata.title)).toContain('Навесы под ключ');
    expect(metadata.description).toContain('поликарбоната');
    expect(metadata.alternates?.canonical).toBe('https://zabor-i-naves.ru/navesy-pod-klyuch');
  });

  it('renders all required sections', async () => {
    portfolioFindMany.mockResolvedValue([
      { id: 'c1', title: 'Арочный навес на две машины', images: [] },
    ]);

    render(await NavesyPodKlyuchPage());

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Навесы под ключ — цены'
    );
    expect(screen.getByRole('heading', { name: 'Типы навесов' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Что влияет на цену' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Цены по типам конструкций/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Популярные размеры навесов/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Что входит в цену «под ключ»/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Частые вопросы про навесы/ })).toBeInTheDocument();

    expect(screen.getByText('Односкатный навес')).toBeInTheDocument();
    expect(screen.getByText('Двускатный навес')).toBeInTheDocument();
    expect(screen.getByText('Арочный навес')).toBeInTheDocument();

    const priceTable = screen.getByTestId('canopy-price-table');
    expect(priceTable).toHaveTextContent('от 2 600 ₽/м²');
    expect(priceTable).toHaveTextContent('от 2 900 ₽/м²');
  });

  it('links to size landing pages (ЧТЗ v3 TASK-07 interlinking)', async () => {
    portfolioFindMany.mockResolvedValue([]);

    render(await NavesyPodKlyuchPage());

    const links = screen.getAllByRole('link').map((l) => l.getAttribute('href'));
    expect(links).toContain('/navesy/6-na-4');
    expect(links).toContain('/navesy/na-2-mashiny');
  });

  it('queries only canopy portfolio items', async () => {
    portfolioFindMany.mockResolvedValue([]);

    render(await NavesyPodKlyuchPage());

    expect(portfolioFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { active: true, category: 'canopy' },
        take: 6,
      })
    );
  });

  it('renders canopy portfolio items when present', async () => {
    portfolioFindMany.mockResolvedValue([
      { id: 'c1', title: 'Арочный навес на две машины', images: [] },
    ]);

    render(await NavesyPodKlyuchPage());

    expect(screen.getByText('Арочный навес на две машины')).toBeInTheDocument();
  });

  it('survives database failure (error handling)', async () => {
    portfolioFindMany.mockRejectedValue(new Error('db down'));

    render(await NavesyPodKlyuchPage());
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('links to calculator and geo pages (interlinking)', async () => {
    portfolioFindMany.mockResolvedValue([]);

    render(await NavesyPodKlyuchPage());

    const links = screen.getAllByRole('link').map((l) => l.getAttribute('href'));
    expect(links).toContain('/calculator/canopy');
    expect(links).toContain('/zabory-navesy/balashiha');
    expect(links).toContain('/zabory-navesy');
  });
});
