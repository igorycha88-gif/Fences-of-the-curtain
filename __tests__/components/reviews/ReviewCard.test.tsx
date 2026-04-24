import '@testing-library/jest-dom';
import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { ReviewCard } from '@/components/reviews/ReviewCard';

jest.mock('lucide-react', () => ({
  Star: ({ className }: { className?: string }) => (
    <svg data-testid="star" data-class={className} />
  ),
}));

jest.mock('@/lib/utils', () => ({
  cn: (...args: (string | undefined | null | false)[]) => args.filter(Boolean).join(' '),
}));

describe('ReviewCard', () => {
  const defaultProps = {
    author: 'Иван Петров',
    rating: 4,
    text: 'Отличная работа, установили забор за 2 дня!',
    date: '2025-03-15',
  };

  it('renders author name', () => {
    render(<ReviewCard {...defaultProps} />);
    expect(screen.getByText('Иван Петров')).toBeInTheDocument();
  });

  it('renders review text', () => {
    render(<ReviewCard {...defaultProps} />);
    expect(screen.getByText('Отличная работа, установили забор за 2 дня!')).toBeInTheDocument();
  });

  it('renders formatted date in Russian locale', () => {
    render(<ReviewCard {...defaultProps} />);
    expect(screen.getByText(/15 марта 2025/)).toBeInTheDocument();
  });

  it('renders author initials', () => {
    render(<ReviewCard {...defaultProps} />);
    expect(screen.getByText('ИП')).toBeInTheDocument();
  });

  it('renders initials for single name', () => {
    render(<ReviewCard {...defaultProps} author="Алексей" />);
    expect(screen.getByText('А')).toBeInTheDocument();
  });

  it('renders initials for three-word name (max 2 chars)', () => {
    render(<ReviewCard {...defaultProps} author="Иван Петр Сидоров" />);
    expect(screen.getByText('ИП')).toBeInTheDocument();
  });

  it('renders rating stars', () => {
    render(<ReviewCard {...defaultProps} />);
    expect(screen.getAllByTestId('star')).toHaveLength(5);
  });

  it('applies custom className to root element', () => {
    const { container } = render(<ReviewCard {...defaultProps} className="custom-class" />);
    const rootDiv = container.firstElementChild as HTMLElement;
    expect(rootDiv?.getAttribute('class')).toContain('custom-class');
  });
});
