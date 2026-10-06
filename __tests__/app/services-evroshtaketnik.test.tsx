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
    return (
      <div data-testid="evroshtaketnik-photos">
        <h2>Евроштакетник шахматкой с планкой — фото наших работ</h2>
      </div>
    );
  },
}));

import ServicePage, { generateMetadata } from '@/app/(public)/services/[slug]/page';

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

describe('/services/[slug] — встраивание фото-блока евроштакетника (ЧТЗ v6 TASK-ZN-2)', () => {
  beforeEach(() => {
    pageContentFindFirst.mockReset();
    pageContentFindMany.mockReset();
    portfolioFindMany.mockReset();
    pageContentFindMany.mockResolvedValue([]);
  });

  it('на странице евроштакетника рендерится фото-блок «шахматкой с планкой»', async () => {
    pageContentFindFirst.mockResolvedValue(
      makePage('zabor-iz-evroshtaketnika', 'Забор из евроштакетника в Москве')
    );

    const element = await ServicePage(makeParams('zabor-iz-evroshtaketnika'));
    render(element);

    expect(
      screen.getByRole('heading', { name: /Евроштакетник шахматкой с планкой — фото наших работ/ })
    ).toBeInTheDocument();
    expect(screen.getByTestId('evroshtaketnik-photos')).toBeInTheDocument();
  });

  it('на других услугах фото-блока нет', async () => {
    pageContentFindFirst.mockResolvedValue(
      makePage('zabor-iz-profnastila', 'Забор из профнастила в Москве')
    );

    const element = await ServicePage(makeParams('zabor-iz-profnastila'));
    render(element);

    expect(screen.queryByTestId('evroshtaketnik-photos')).not.toBeInTheDocument();
    expect(portfolioFindMany).not.toHaveBeenCalled();
  });

  it('metadata услуги строится из БД', async () => {
    pageContentFindFirst.mockResolvedValue(
      makePage('zabor-iz-evroshtaketnika', 'Забор из евроштакетника в Москве')
    );

    const metadata = await generateMetadata(makeParams('zabor-iz-evroshtaketnika'));
    expect(String(metadata.title)).toContain('евроштакетника');
  });
});
