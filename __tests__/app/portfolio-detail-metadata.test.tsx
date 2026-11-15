import '@testing-library/jest-dom';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

jest.mock('next/link', () => ({
  __esModule: true,
  default: function MockLink({ children, href, ...props }: any) {
    return <a href={href} {...props}>{children}</a>;
  },
}));

jest.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND');
  },
  permanentRedirect: (to: string) => {
    throw new Error(`NEXT_PERMANENT_REDIRECT:${to}`);
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

jest.mock('@/components/seo/Breadcrumbs', () => ({
  __esModule: true,
  default: function MockBreadcrumbs() {
    return <nav data-testid="mock-breadcrumbs" />;
  },
}));

jest.mock('@/app/(public)/portfolio/[slug]/PortfolioGalleryClient', () => ({
  __esModule: true,
  default: function MockGallery() {
    return <div data-testid="mock-gallery" />;
  },
}));

jest.mock('@/app/(public)/portfolio/[slug]/PhoneLinkButton', () => ({
  __esModule: true,
  default: function MockPhone() {
    return <div data-testid="mock-phone" />;
  },
}));

const findUnique = jest.fn();

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  prisma: {
    portfolioItem: {
      findUnique: (...args: unknown[]) => findUnique(...args),
    },
  },
}));

import PortfolioDetailPage, {
  generateMetadata,
} from '@/app/(public)/portfolio/[slug]/page';

function makeParams(slug: string) {
  return { params: Promise.resolve({ slug }) };
}

const ACTIVE_ITEM = {
  id: 'cmob5y454000cd1ofoowairl2',
  slug: 'zabory-i-vorota-iz-profnastila',
  title: 'Заборы и ворота из профнастила',
  description: 'Забор под ключ на 12 сотках в Подольске',
  images: ['/uploads/work-1.jpg', '/uploads/work-2.jpg'],
  active: true,
};

describe('portfolio detail generateMetadata (ЧТЗ Фикс Canonical Портфолио GSC)', () => {
  beforeEach(() => {
    findUnique.mockReset();
  });

  it('regression guard: page.tsx exports generateMetadata (не мёртвый metadata.tsx)', () => {
    expect(typeof generateMetadata).toBe('function');
    expect(typeof PortfolioDetailPage).toBe('function');
  });

  it('happy path by slug: self-canonical, детальный title, description из БД', async () => {
    findUnique.mockResolvedValueOnce(ACTIVE_ITEM);

    const metadata = await generateMetadata(makeParams('zabory-i-vorota-iz-profnastila'));

    expect(findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { slug: 'zabory-i-vorota-iz-profnastila' } })
    );
    expect(metadata.title).toBe('Заборы и ворота из профнастила — Заборы и Навесы');
    expect(metadata.description).toBe('Забор под ключ на 12 сотках в Подольске');
    expect(metadata.alternates?.canonical).toBe(
      'https://zabor-i-naves.ru/portfolio/zabory-i-vorota-iz-profnastila'
    );
  });

  it('double lookup: по slug не найдено, по legacy id найдено → canonical на slug-URL', async () => {
    findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce(ACTIVE_ITEM);

    const metadata = await generateMetadata(makeParams('cmob5y454000cd1ofoowairl2'));

    expect(findUnique).toHaveBeenCalledTimes(2);
    expect(findUnique).toHaveBeenLastCalledWith(
      expect.objectContaining({ where: { id: 'cmob5y454000cd1ofoowairl2' } })
    );
    expect(metadata.alternates?.canonical).toBe(
      'https://zabor-i-naves.ru/portfolio/zabory-i-vorota-iz-profnastila'
    );
  });

  it('not found: canonical на каталог /portfolio, title «Проект не найден»', async () => {
    findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce(null);

    const metadata = await generateMetadata(makeParams('net-takogo'));

    expect(metadata.alternates?.canonical).toBe('https://zabor-i-naves.ru/portfolio');
    expect(metadata.title).toBe('Проект не найден');
  });

  it('inactive item: обрабатывается как not-found', async () => {
    findUnique.mockResolvedValueOnce({ ...ACTIVE_ITEM, active: false });

    const metadata = await generateMetadata(makeParams('zabory-i-vorota-iz-profnastila'));

    expect(metadata.title).toBe('Проект не найден');
    expect(metadata.alternates?.canonical).toBe('https://zabor-i-naves.ru/portfolio');
  });

  it('description fallback при пустом description в БД', async () => {
    findUnique.mockResolvedValueOnce({ ...ACTIVE_ITEM, description: '' });

    const metadata = await generateMetadata(makeParams('zabory-i-vorota-iz-profnastila'));

    expect(metadata.description).toBe(
      'Проект «Заборы и ворота из профнастила» — пример нашей работы. Заборы и Навесы в Москве и МО.'
    );
  });

  it('ogImage из первой картинки галереи (абсолютный URL)', async () => {
    findUnique.mockResolvedValueOnce(ACTIVE_ITEM);

    const metadata = await generateMetadata(makeParams('zabory-i-vorota-iz-profnastila'));

    expect(metadata.openGraph?.images).toEqual([
      {
        url: 'https://zabor-i-naves.ru/uploads/work-1.jpg',
        width: 1200,
        height: 630,
        alt: 'Заборы и ворота из профнастила — Заборы и Навесы',
      },
    ]);
    expect(metadata.twitter?.images).toEqual(['https://zabor-i-naves.ru/uploads/work-1.jpg']);
  });

  it('без картинок — дефолтная OG-картинка проекта', async () => {
    findUnique.mockResolvedValueOnce({ ...ACTIVE_ITEM, images: [] });

    const metadata = await generateMetadata(makeParams('zabory-i-vorota-iz-profnastila'));

    expect(metadata.openGraph?.images).toEqual([
      expect.objectContaining({ url: 'https://zabor-i-naves.ru/og/og-main.jpg' }),
    ]);
  });
});

describe('portfolio detail page redirect (регресс ЧТЗ SEO P1 2.5)', () => {
  beforeEach(() => {
    findUnique.mockReset();
  });

  it('legacy cuid URL → 308 permanentRedirect на slug-URL', async () => {
    findUnique.mockResolvedValueOnce(ACTIVE_ITEM);

    await expect(
      PortfolioDetailPage(makeParams('cmob5y454000cd1ofoowairl2'))
    ).rejects.toThrow('NEXT_PERMANENT_REDIRECT:/portfolio/zabory-i-vorota-iz-profnastila');
  });

  it('legacy id без slug в БД — рендерится как есть (без редиректа)', async () => {
    findUnique.mockResolvedValueOnce({ ...ACTIVE_ITEM, slug: null });

    await expect(
      PortfolioDetailPage(makeParams('cmob5y454000cd1ofoowairl2'))
    ).resolves.not.toThrow();
  });

  it('неизвестный slug → notFound', async () => {
    findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce(null);

    await expect(PortfolioDetailPage(makeParams('net-takogo'))).rejects.toThrow('NEXT_NOT_FOUND');
  });
});
