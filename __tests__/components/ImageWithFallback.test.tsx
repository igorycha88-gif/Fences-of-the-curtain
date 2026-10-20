import '@testing-library/jest-dom';
import { describe, it, expect, jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react';

jest.mock('next/image', () => ({
  __esModule: true,
  default: function MockImage(props: any) {
    return (
      <div
        data-testid="next-image"
        data-src={props.src}
        data-sizes={props.sizes ?? ''}
        data-fill={String(!!props.fill)}
        onClick={props.onError}
      />
    );
  },
}));

import ImageWithFallback from '@/components/ui/ImageWithFallback';

describe('ImageWithFallback', () => {
  it('проксирует sizes в next/image (fill-режим)', () => {
    render(
      <ImageWithFallback
        src="/uploads/portfolio/2026/04/test_thumb.jpg"
        alt="Тест"
        fill
        sizes="(max-width: 768px) 100vw, 33vw"
      />
    );
    const img = screen.getByTestId('next-image');
    expect(img).toHaveAttribute('data-sizes', '(max-width: 768px) 100vw, 33vw');
    expect(img).toHaveAttribute('data-src', '/uploads/portfolio/2026/04/test_thumb.jpg');
    expect(img).toHaveAttribute('data-fill', 'true');
  });

  it('проксирует sizes в next/image (width/height-режим)', () => {
    render(
      <ImageWithFallback
        src="/uploads/test.jpg"
        alt="Тест"
        width={400}
        height={300}
        sizes="50vw"
      />
    );
    const img = screen.getByTestId('next-image');
    expect(img).toHaveAttribute('data-sizes', '50vw');
    expect(img).toHaveAttribute('data-fill', 'false');
  });

  it('показывает заглушку «Нет фото» при ошибке загрузки', () => {
    render(<ImageWithFallback src="/broken_thumb.jpg" alt="Сломанное" fill />);
    const img = screen.getByTestId('next-image');
    fireEvent.click(img);
    expect(screen.getByText('Нет фото')).toBeInTheDocument();
    expect(screen.queryByTestId('next-image')).not.toBeInTheDocument();
  });

  it('без sizes не передаёт атрибут', () => {
    render(<ImageWithFallback src="/uploads/a.jpg" alt="Без sizes" fill />);
    expect(screen.getByTestId('next-image')).toHaveAttribute('data-sizes', '');
  });
});
