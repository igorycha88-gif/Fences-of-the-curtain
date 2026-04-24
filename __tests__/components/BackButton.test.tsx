import '@testing-library/jest-dom';
import { describe, it, expect, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BackButton from '@/components/BackButton';

const mockBack = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), back: mockBack, prefetch: jest.fn() }),
  usePathname: () => '/',
}));

describe('BackButton', () => {
  beforeEach(() => {
    mockBack.mockClear();
  });

  it('renders children text', () => {
    render(<BackButton>Назад</BackButton>);
    expect(screen.getByText('Назад')).toBeInTheDocument();
  });

  it('renders as a button element', () => {
    render(<BackButton>Go Back</BackButton>);
    expect(screen.getByText('Go Back').tagName).toBe('BUTTON');
  });

  it('calls router.back() when clicked', async () => {
    render(<BackButton>Back</BackButton>);
    await userEvent.click(screen.getByRole('button'));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it('applies custom className', () => {
    render(<BackButton className="custom-cls">Back</BackButton>);
    expect(screen.getByRole('button').className).toContain('custom-cls');
  });

  it('passes through button attributes', () => {
    render(<BackButton disabled>Back</BackButton>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
