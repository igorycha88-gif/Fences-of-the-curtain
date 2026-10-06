import '@testing-library/jest-dom';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { render, screen } from '@testing-library/react';

jest.mock('next/link', () => ({
  __esModule: true,
  default: function MockLink({ children, href, ...props }: any) {
    return <a href={href} {...props}>{children}</a>;
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

const loggerError = jest.fn();
const loggerWarn = jest.fn();
const loggerInfo = jest.fn();

jest.mock('@/lib/logger', () => ({
  __esModule: true,
  default: {
    error: (...args: unknown[]) => loggerError(...args),
    warn: (...args: unknown[]) => loggerWarn(...args),
    info: (...args: unknown[]) => loggerInfo(...args),
  },
}));

import EvroshtaketnikPhotos from '@/components/seo/EvroshtaketnikPhotos';

const EVROSHTAKETNIK_ITEMS = [
  { id: 'p1', title: 'Заборы, ворота, калитки из евроштакетника под ключ', images: ['/uploads/portfolio/2026/03/p1.jpg'] },
  { id: 'p2', title: 'Заборы из евроштакетника под ключ', images: ['/uploads/portfolio/2026/04/p2.jpg'] },
  { id: 'p3', title: 'Заборы, ворота, калитки из евроштакетника под ключ', images: ['/uploads/portfolio/2026/04/p3.png'] },
];

describe('EvroshtaketnikPhotos — фото-блок «Евроштакетник шахматкой с планкой» (ЧТЗ v6 TASK-ZN-2)', () => {
  beforeEach(() => {
    portfolioFindMany.mockReset();
    loggerError.mockReset();
    loggerWarn.mockReset();
    loggerInfo.mockReset();
  });

  it('happy path: H2 с формулировкой запроса + 3 фото с alt-тегами и подписями', async () => {
    portfolioFindMany.mockResolvedValueOnce(EVROSHTAKETNIK_ITEMS);

    render(await EvroshtaketnikPhotos());

    expect(
      screen.getByRole('heading', { name: /Евроштакетник шахматкой с планкой — фото наших работ/ })
    ).toBeInTheDocument();

    const photos = screen.getAllByTestId('evroshtaketnik-photo');
    expect(photos.length).toBe(3);

    photos.forEach((img) => {
      expect(img.getAttribute('alt')).toMatch(/забор из евроштакетника шахматка с планкой/i);
    });

    expect(screen.getByText('Шахматка')).toBeInTheDocument();
    expect(screen.getByText('Шахматка с планкой-накладкой')).toBeInTheDocument();
    expect(screen.getByText('Двусторонний евроштакетник')).toBeInTheDocument();

    expect(loggerInfo).toHaveBeenCalledWith(
      expect.stringContaining('block rendered'),
      expect.objectContaining({ photoCount: 3 })
    );
  });

  it('фото кликабельны и ведут на работы портфолио', async () => {
    portfolioFindMany.mockResolvedValueOnce(EVROSHTAKETNIK_ITEMS);

    render(await EvroshtaketnikPhotos());

    const links = screen.getAllByRole('link').map((l) => l.getAttribute('href'));
    expect(links).toContain('/portfolio/p1');
    expect(links).toContain('/portfolio/p2');
    expect(links).toContain('/portfolio/p3');
  });

  it('fallback: при нехватке работ по евроштакетнику добирает fence-работы', async () => {
    portfolioFindMany
      .mockResolvedValueOnce([EVROSHTAKETNIK_ITEMS[0]])
      .mockResolvedValueOnce([
        { id: 'f1', title: 'Заборы из профнастила', images: ['/uploads/portfolio/2026/04/f1.jpg'] },
        { id: 'f2', title: 'Заборы и ворота', images: ['/uploads/portfolio/2026/04/f2.jpg'] },
      ]);

    render(await EvroshtaketnikPhotos());

    const photos = screen.getAllByTestId('evroshtaketnik-photo');
    expect(photos.length).toBe(3);
    expect(portfolioFindMany).toHaveBeenCalledTimes(2);
    expect(portfolioFindMany).toHaveBeenLastCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ category: 'fence' }),
      })
    );
  });

  it('edge case: элементы без изображений отфильтрованы', async () => {
    portfolioFindMany
      .mockResolvedValueOnce([
        { id: 'p1', title: 'Евроштакетник', images: ['/uploads/p1.jpg'] },
        { id: 'p2', title: 'Евроштакетник без фото', images: [] },
        { id: 'p3', title: 'Евроштакетник null', images: null },
      ])
      .mockResolvedValueOnce([]);

    render(await EvroshtaketnikPhotos());

    const photos = screen.getAllByTestId('evroshtaketnik-photo');
    expect(photos.length).toBe(1);
  });

  it('error case: БД недоступна → блок не рендерится, ошибка залогирована', async () => {
    portfolioFindMany.mockRejectedValueOnce(new Error('db down'));

    const result = await EvroshtaketnikPhotos();
    expect(result).toBeNull();

    expect(loggerError).toHaveBeenCalledWith(
      expect.stringContaining('failed to load portfolio photos'),
      expect.objectContaining({
        module: 'evroshtaketnik-photos',
        operation: 'loadPortfolioPhotos',
        error: expect.any(Error),
      })
    );
  });

  it('edge case: пустой портфель → блок пропущен, залогирован warn', async () => {
    portfolioFindMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const result = await EvroshtaketnikPhotos();
    expect(result).toBeNull();

    expect(loggerWarn).toHaveBeenCalledWith(
      expect.stringContaining('no portfolio photos found'),
      expect.objectContaining({ module: 'evroshtaketnik-photos' })
    );
  });
});
