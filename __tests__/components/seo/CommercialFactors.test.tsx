import '@testing-library/jest-dom';
import { describe, it, expect, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import CommercialFactors from '@/components/seo/CommercialFactors';

jest.mock('@/hooks/useScrollReveal', () => ({
  AnimatedSection: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('lucide-react', () => ({
  Banknote: () => <span data-testid="icon-banknote" />,
  Clock: () => <span data-testid="icon-clock" />,
  ShieldCheck: () => <span data-testid="icon-shield" />,
  Truck: () => <span data-testid="icon-truck" />,
  CreditCard: () => <span data-testid="icon-credit" />,
}));

describe('CommercialFactors', () => {
  it('показывает минимальную цену за метр по данным прод БД (от 2 600 ₽/м)', () => {
    render(<CommercialFactors />);
    expect(screen.getByText('от 2 600 ₽/м')).toBeInTheDocument();
    expect(screen.queryByText('от 2 800 ₽/м')).not.toBeInTheDocument();
  });

  it('показывает гарантию 1 год вместо 3 лет', () => {
    render(<CommercialFactors />);
    expect(screen.getByText('1 год')).toBeInTheDocument();
    expect(screen.queryByText('3 года')).not.toBeInTheDocument();
    expect(screen.getByText('Гарантия по договору')).toBeInTheDocument();
  });

  it('выезд на замер: бесплатно только при заказе услуги', () => {
    render(<CommercialFactors />);
    expect(screen.getByText('Замер при заказе услуги')).toBeInTheDocument();
    expect(screen.queryByText('Выезд по Москве и МО')).not.toBeInTheDocument();
  });

  it('рендерит все 5 карточек', () => {
    render(<CommercialFactors />);
    expect(screen.getByText('Цена за метр')).toBeInTheDocument();
    expect(screen.getByText('Срок монтажа')).toBeInTheDocument();
    expect(screen.getByText('Любая оплата')).toBeInTheDocument();
    expect(screen.getByText('Бесплатно')).toBeInTheDocument();
  });
});
