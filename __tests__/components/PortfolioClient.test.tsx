import '@testing-library/jest-dom';
import { describe, it, it as test, expect, jest, beforeEach } from '@jest/globals';
import { render, screen } from '@testing-library/react';

jest.mock('next/link', () => ({
  __esModule: true,
  default: function MockLink({ children, href }: any) {
    return <a href={href}>{children}</a>;
  },
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: function MockImage(props: any) {
    return (
      <div
        data-testid="next-image"
        data-src={props.src}
        data-sizes={props.sizes ?? ''}
        data-fill={String(!!props.fill)}
      />
    );
  },
}));

const trackEventMock = jest.fn();
const metrikaPortfolioViewMock = jest.fn();

jest.mock('@/lib/hooks/useAnalytics', () => ({
  __esModule: true,
  useAnalytics: () => ({ trackEvent: trackEventMock }),
}));

jest.mock('@/lib/seo/metrika', () => ({
  __esModule: true,
  metrikaEvents: { portfolioView: metrikaPortfolioViewMock },
}));

import PortfolioClient from '@/components/portfolio/PortfolioClient';

const items = [
  {
    id: 'item-1',
    title: 'Забор из профлиста',
    category: 'fence',
    description: 'Описание объекта',
    images: ['/uploads/portfolio/2026/04/abc.jpg'],
  },
  {
    id: 'item-2',
    title: 'Навес для авто',
    category: 'canopy',
    description: '',
    images: [],
  },
];

describe('PortfolioClient', () => {
  beforeEach(() => {
    trackEventMock.mockClear();
    metrikaPortfolioViewMock.mockClear();
  });

  test('карточка с фото рендерит next/image с sizes для 3-колоночной сетки', () => {
    render(<PortfolioClient items={items} />);
    const img = screen.getByTestId('next-image');
    expect(img).toHaveAttribute('data-src', '/uploads/portfolio/2026/04/abc_thumb.jpg');
    expect(img).toHaveAttribute('data-sizes', '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw');
    expect(img).toHaveAttribute('data-fill', 'true');
  });

  test('использует _thumb версию первого фото', () => {
    render(
      <PortfolioClient
        items={[
          {
            id: 'item-3',
            title: 'Гараж',
            category: 'garage',
            images: ['/uploads/portfolio/2026/04/xyz.jpg'],
          },
        ]}
      />
    );
    expect(screen.getByTestId('next-image')).toHaveAttribute(
      'data-src',
      '/uploads/portfolio/2026/04/xyz_thumb.jpg'
    );
  });

  test('карточка без фото показывает заглушку «Нет фото»', () => {
    render(<PortfolioClient items={items} />);
    expect(screen.getByText('Нет фото')).toBeInTheDocument();
  });

  test('рендерит все карточки и ссылки на объекты', () => {
    render(<PortfolioClient items={items} />);
    expect(screen.getByText('Забор из профлиста')).toBeInTheDocument();
    expect(screen.getByText('Навес для авто')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Забор из профлиста/ })).toHaveAttribute(
      'href',
      '/portfolio/item-1'
    );
  });
});
