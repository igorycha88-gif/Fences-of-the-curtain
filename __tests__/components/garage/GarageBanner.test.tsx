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
});
