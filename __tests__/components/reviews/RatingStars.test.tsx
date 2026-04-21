import '@testing-library/jest-dom';
import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { RatingStars } from '@/components/reviews/RatingStars';

jest.mock('lucide-react', () => ({
  Star: ({ className }: { className?: string }) => (
    <svg data-testid="star" data-class={className} />
  ),
}));

jest.mock('@/lib/utils', () => ({
  cn: (...args: (string | undefined | null | false)[]) => args.filter(Boolean).join(' '),
}));

describe('RatingStars', () => {
  it('renders 5 stars by default', () => {
    render(<RatingStars rating={3} />);
    expect(screen.getAllByTestId('star')).toHaveLength(5);
  });

  it('renders custom maxRating number of stars', () => {
    render(<RatingStars rating={2} maxRating={10} />);
    expect(screen.getAllByTestId('star')).toHaveLength(10);
  });

  it('applies filled styles for full stars', () => {
    render(<RatingStars rating={3} />);
    const stars = screen.getAllByTestId('star');
    expect(stars[0].getAttribute('data-class')).toContain('fill-yellow-400');
    expect(stars[1].getAttribute('data-class')).toContain('fill-yellow-400');
    expect(stars[2].getAttribute('data-class')).toContain('fill-yellow-400');
    expect(stars[3].getAttribute('data-class')).toContain('fill-gray-200');
    expect(stars[4].getAttribute('data-class')).toContain('fill-gray-200');
  });

  it('applies partial fill style for fractional rating', () => {
    render(<RatingStars rating={3.5} />);
    const stars = screen.getAllByTestId('star');
    expect(stars[0].getAttribute('data-class')).toContain('fill-yellow-400');
    expect(stars[3].getAttribute('data-class')).toContain('fill-yellow-400');
    expect(stars[4].getAttribute('data-class')).toContain('fill-gray-200');
  });

  it('renders all empty stars for rating 0', () => {
    render(<RatingStars rating={0} />);
    const stars = screen.getAllByTestId('star');
    stars.forEach(star => {
      expect(star.getAttribute('data-class')).toContain('fill-gray-200');
    });
  });

  it('renders all full stars for max rating', () => {
    render(<RatingStars rating={5} />);
    const stars = screen.getAllByTestId('star');
    stars.forEach(star => {
      expect(star.getAttribute('data-class')).toContain('fill-yellow-400');
    });
  });

  it('applies size classes', () => {
    const { rerender } = render(<RatingStars rating={3} size="sm" />);
    expect(screen.getAllByTestId('star')[0].getAttribute('data-class')).toContain('w-4');

    rerender(<RatingStars rating={3} size="md" />);
    expect(screen.getAllByTestId('star')[0].getAttribute('data-class')).toContain('w-5');

    rerender(<RatingStars rating={3} size="lg" />);
    expect(screen.getAllByTestId('star')[0].getAttribute('data-class')).toContain('w-6');
  });
});
