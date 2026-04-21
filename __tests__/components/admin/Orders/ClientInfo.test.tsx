import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ClientInfo } from '@/components/admin/Orders/ClientInfo';

describe('ClientInfo', () => {
  const defaultProps = {
    clientName: 'Иван Иванов',
    phone: '+7 (999) 123-45-67',
    email: 'ivan@example.com' as string | null,
    message: 'Нужен забор 50 метров' as string | null,
  };

  it('renders client name and phone', () => {
    render(<ClientInfo {...defaultProps} />);
    expect(screen.getByText('Иван Иванов')).toBeInTheDocument();
    expect(screen.getByText('+7 (999) 123-45-67')).toBeInTheDocument();
  });

  it('renders phone link with tel: protocol', () => {
    render(<ClientInfo {...defaultProps} />);
    const phoneLinks = screen.getAllByRole('link').filter(link => link.getAttribute('href')?.startsWith('tel:'));
    expect(phoneLinks.length).toBeGreaterThan(0);
    expect(phoneLinks[0]).toHaveAttribute('href', 'tel:79991234567');
  });

  it('renders email when provided', () => {
    render(<ClientInfo {...defaultProps} email="ivan@example.com" />);
    expect(screen.getByText('ivan@example.com')).toBeInTheDocument();
    expect(screen.getByText('Написать')).toBeInTheDocument();
  });

  it('does not render email section when email is null', () => {
    render(<ClientInfo {...defaultProps} email={null} />);
    expect(screen.queryByText('Написать')).not.toBeInTheDocument();
    expect(screen.queryByText('ivan@example.com')).not.toBeInTheDocument();
  });

  it('renders message when provided', () => {
    render(<ClientInfo {...defaultProps} message="Нужен забор 50 метров" />);
    expect(screen.getByText('Нужен забор 50 метров')).toBeInTheDocument();
  });

  it('does not render message section when message is null', () => {
    render(<ClientInfo {...defaultProps} message={null} />);
    expect(screen.queryByText('Комментарий')).not.toBeInTheDocument();
  });

  it('renders Позвонить button', () => {
    render(<ClientInfo {...defaultProps} />);
    expect(screen.getByText('Позвонить')).toBeInTheDocument();
  });
});
