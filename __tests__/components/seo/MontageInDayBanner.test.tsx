import '@testing-library/jest-dom';
import { describe, it, expect, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';

jest.mock('next/link', () => ({
  __esModule: true,
  default: function MockLink({ children, href, ...props }: any) {
    return <a href={href} {...props}>{children}</a>;
  },
}));

import MontageInDayBanner from '@/components/seo/MontageInDayBanner';

describe('MontageInDayBanner (ЧТЗ v3 TASK-08)', () => {
  it('fence mode declares "Монтаж забора за 1 день" with timeline', () => {
    render(<MontageInDayBanner mode="fence" />);

    expect(
      screen.getByRole('heading', { name: 'Монтаж забора за 1 день' })
    ).toBeInTheDocument();
    expect(screen.getByTestId('montage-step-08:00')).toBeInTheDocument();
    expect(screen.getByTestId('montage-step-18:00')).toBeInTheDocument();

    const links = screen.getAllByRole('link').map((l) => l.getAttribute('href'));
    expect(links).toContain('/calculator/fence');
  });

  it('canopy mode declares honest 1-2 days timeline', () => {
    render(<MontageInDayBanner mode="canopy" />);

    expect(
      screen.getByRole('heading', { name: /Монтаж навеса — от 1 до 2 дней/ })
    ).toBeInTheDocument();

    const links = screen.getAllByRole('link').map((l) => l.getAttribute('href'));
    expect(links).toContain('/calculator/canopy');
  });

  it('defaults to fence mode', () => {
    render(<MontageInDayBanner />);

    expect(
      screen.getByRole('heading', { name: 'Монтаж забора за 1 день' })
    ).toBeInTheDocument();
  });
});
