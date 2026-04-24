import '@testing-library/jest-dom';
import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { YandexRatingBadge } from '@/components/reviews/YandexRatingBadge';

describe('YandexRatingBadge', () => {
  it('renders an iframe', () => {
    render(<YandexRatingBadge />);
    expect(screen.getByTitle('Рейтинг компании в Яндексе')).toBeInTheDocument();
  });

  it('uses default orgId when none provided', () => {
    render(<YandexRatingBadge />);
    const iframe = screen.getByTitle('Рейтинг компании в Яндексе');
    expect(iframe.getAttribute('src')).toContain('154197841574');
  });

  it('uses provided orgId', () => {
    render(<YandexRatingBadge orgId="12345" />);
    const iframe = screen.getByTitle('Рейтинг компании в Яндексе');
    expect(iframe.getAttribute('src')).toContain('12345');
    expect(iframe.getAttribute('src')).not.toContain('154197841574');
  });

  it('uses default type=rating', () => {
    render(<YandexRatingBadge orgId="12345" />);
    const iframe = screen.getByTitle('Рейтинг компании в Яндексе');
    expect(iframe.getAttribute('src')).toContain('type=rating');
  });

  it('uses type=reviews when specified', () => {
    render(<YandexRatingBadge orgId="12345" type="reviews" />);
    const iframe = screen.getByTitle('Рейтинг компании в Яндексе');
    expect(iframe.getAttribute('src')).toContain('type=reviews');
  });

  it('applies width and height props', () => {
    render(<YandexRatingBadge width={200} height={60} />);
    const iframe = screen.getByTitle('Рейтинг компании в Яндексе');
    expect(iframe).toHaveAttribute('width', '200');
    expect(iframe).toHaveAttribute('height', '60');
  });

  it('applies default width and height', () => {
    render(<YandexRatingBadge />);
    const iframe = screen.getByTitle('Рейтинг компании в Яндексе');
    expect(iframe).toHaveAttribute('width', '150');
    expect(iframe).toHaveAttribute('height', '50');
  });

  it('applies custom className', () => {
    render(<YandexRatingBadge className="my-badge" />);
    expect(screen.getByTitle('Рейтинг компании в Яндексе').className).toContain('my-badge');
  });
});
