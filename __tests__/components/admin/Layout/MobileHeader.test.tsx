import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MobileHeader } from '@/components/admin/Layout/MobileHeader';

describe('MobileHeader', () => {
  it('renders menu button', () => {
    render(<MobileHeader onMenuClick={jest.fn()} />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('calls onMenuClick when menu button clicked', () => {
    const onMenuClick = jest.fn();
    render(<MobileHeader onMenuClick={onMenuClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onMenuClick).toHaveBeenCalledTimes(1);
  });

  it('renders title when provided', () => {
    render(<MobileHeader onMenuClick={jest.fn()} title="Заявки" />);
    expect(screen.getByText('Заявки')).toBeInTheDocument();
  });

  it('does not render title when not provided', () => {
    render(<MobileHeader onMenuClick={jest.fn()} />);
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('has correct CSS class for mobile visibility', () => {
    const { container } = render(<MobileHeader onMenuClick={jest.fn()} title="Test" />);
    const header = container.querySelector('header');
    expect(header).toHaveClass('md:hidden');
  });
});
