import '@testing-library/jest-dom';
import { describe, it, expect, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

jest.mock('next/image', () => ({
  __esModule: true,
  default: function MockImage(props: any) {
    return <img {...props} />;
  },
}));

import GarageBanner from '@/components/garage/GarageBanner';

describe('GarageBanner', () => {
  it('renders title and description', () => {
    render(<GarageBanner />);
    expect(screen.getByText('Гараж из сендвич-панелей')).toBeInTheDocument();
    expect(
      screen.getByText(/Надёжный утеплённый гараж из сендвич-панелей/)
    ).toBeInTheDocument();
  });

  it('does NOT render any price or promotion text', () => {
    const { container } = render(<GarageBanner />);
    expect(screen.queryByText('от 1 450 000 ₽')).not.toBeInTheDocument();
    expect(screen.queryByText('от 1 250 000 ₽')).not.toBeInTheDocument();
    expect(screen.queryByText('Гараж 6×6')).not.toBeInTheDocument();
    expect(screen.queryByText(/Акция до конца июня 2026/)).not.toBeInTheDocument();
    expect(container.querySelectorAll('.line-through')).toHaveLength(0);
  });

  it('shows "Индивидуальный расчёт" instead of a price', () => {
    render(<GarageBanner />);
    expect(screen.getByText('Индивидуальный расчёт')).toBeInTheDocument();
  });

  it('renders benefits (Гарантия/Утепление/Под ключ)', () => {
    render(<GarageBanner />);
    expect(screen.getByText('Гарантия')).toBeInTheDocument();
    expect(screen.getByText('Утепление')).toBeInTheDocument();
    expect(screen.getByText('Под ключ')).toBeInTheDocument();
  });

  it('renders the "Оставить заявку" button', () => {
    render(<GarageBanner />);
    expect(
      screen.getByRole('button', { name: /Оставить заявку/ })
    ).toBeInTheDocument();
  });

  it('opens the order modal when the CTA is clicked', async () => {
    render(<GarageBanner />);
    await userEvent.click(screen.getByRole('button', { name: /Оставить заявку/ }));
    expect(
      await screen.findByText('Заявка на гараж из сендвич-панелей')
    ).toBeInTheDocument();
  });

  it('renders section with garage anchor id for in-page links', () => {
    render(<GarageBanner />);
    expect(document.getElementById('garage')).toBeInTheDocument();
  });

  it('is mobile-adapted: compact paddings and scroll offset for anchor jumps', () => {
    render(<GarageBanner />);
    const section = document.getElementById('garage');
    expect(section).toHaveClass('py-12', 'md:py-20', 'scroll-mt-24');
  });

  it('is mobile-adapted: CTA buttons full width on mobile, w-fit from sm', () => {
    render(<GarageBanner />);
    const cta = screen.getByRole('button', { name: /Оставить заявку/ });
    expect(cta).toHaveClass('w-full', 'sm:w-fit');
  });

  it('is mobile-adapted: benefit chips use smaller text on mobile', () => {
    render(<GarageBanner />);
    ['Гарантия', 'Утепление', 'Под ключ'].forEach((label) => {
      const chip = screen.getByText(label).closest('div');
      expect(chip).toHaveClass('text-xs', 'sm:text-sm');
    });
  });
});
