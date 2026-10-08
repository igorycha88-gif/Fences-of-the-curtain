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

const pageContentFindFirst = jest.fn();
const pageContentFindMany = jest.fn();
const portfolioFindMany = jest.fn();

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  prisma: {
    pageContent: {
      findFirst: (...args: unknown[]) => pageContentFindFirst(...args),
      findMany: (...args: unknown[]) => pageContentFindMany(...args),
    },
    portfolioItem: {
      findMany: (...args: unknown[]) => portfolioFindMany(...args),
    },
  },
}));

jest.mock('@/components/seo/EvroshtaketnikPhotos', () => ({
  __esModule: true,
  default: function MockEvroshtaketnikPhotos() {
    return <div data-testid="evroshtaketnik-photos" />;
  },
}));

import ServicePage from '@/app/(public)/services/[slug]/page';
import {
  SHAHMATKA_VARIANTS,
  SHTAKETNIK_PER_PIECE_PRICES,
  PROFLIST_2000x1150_PRICES,
} from '@/lib/landing/servicesSections';

function makePage(slug: string, title: string) {
  return {
    slug,
    title,
    category: 'fence',
    seoTitle: `${title} — монтаж под ключ`,
    seoDescription: 'Описание услуги',
    seoKeywords: null,
    content: JSON.stringify({ description: 'Текст описания', sections: [] }),
  };
}

function makeParams(slug: string) {
  return { params: Promise.resolve({ slug }) };
}

describe('services/[slug] — секции Wordstat-кластеров (ЧТЗ_SEO_расширение_Wordstat, TASK-FRT-005)', () => {
  beforeEach(() => {
    pageContentFindFirst.mockReset();
    pageContentFindMany.mockReset();
    portfolioFindMany.mockReset();
    pageContentFindMany.mockResolvedValue([]);
  });

  it('евроштакетник: рендерится секция «Шахматка» (кластер 4 937)', async () => {
    pageContentFindFirst.mockResolvedValue(
      makePage('zabor-iz-evroshtaketnika', 'Забор из евроштакетника в Москве')
    );

    render(await ServicePage(makeParams('zabor-iz-evroshtaketnika')));

    expect(screen.getByTestId('shahmatka-section')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Забор шахматка из евроштакетника/ })).toBeInTheDocument();
    expect(SHAHMATKA_VARIANTS.length).toBeGreaterThanOrEqual(3);
    const variantsText = SHAHMATKA_VARIANTS.map((v) => v.variant + ' ' + v.detail).join(' ');
    expect(variantsText).toContain('Шахматка');
    expect(variantsText).toMatch(/двусторонн|двух сторон/i);
  });

  it('евроштакетник: рендерится секция «Цена за штуку» (кластер 3 686)', async () => {
    pageContentFindFirst.mockResolvedValue(
      makePage('zabor-iz-evroshtaketnika', 'Забор из евроштакетника в Москве')
    );

    render(await ServicePage(makeParams('zabor-iz-evroshtaketnika')));

    expect(screen.getByTestId('shtaketnik-price-section')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Цена евроштакетника за штуку/ })).toBeInTheDocument();
    expect(SHTAKETNIK_PER_PIECE_PRICES.length).toBeGreaterThanOrEqual(3);
  });

  it('профнастил: рендерится таблица «Цена за лист 2000×1150» (кластер 10 261)', async () => {
    pageContentFindFirst.mockResolvedValue(
      makePage('zabor-iz-profnastila', 'Забор из профнастила в Москве')
    );

    render(await ServicePage(makeParams('zabor-iz-profnastila')));

    expect(screen.getByTestId('proflist-price-section')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Цена профлиста для забора за лист 2000×1150/ })).toBeInTheDocument();
    expect(PROFLIST_2000x1150_PRICES.length).toBeGreaterThanOrEqual(3);
  });

  it('на других услугах новых секций нет', async () => {
    pageContentFindFirst.mockResolvedValue(
      makePage('zabor-iz-setki-rabitsy', 'Забор из сетки-рабицы в Москве')
    );

    render(await ServicePage(makeParams('zabor-iz-setki-rabitsy')));

    expect(screen.queryByTestId('shahmatka-section')).not.toBeInTheDocument();
    expect(screen.queryByTestId('shtaketnik-price-section')).not.toBeInTheDocument();
    expect(screen.queryByTestId('proflist-price-section')).not.toBeInTheDocument();
  });
});
