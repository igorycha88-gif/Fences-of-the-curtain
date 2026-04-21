import '@testing-library/jest-dom';
import { describe, it, expect, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Footer from '@/components/layout/Footer';

jest.mock('lucide-react', () => ({
  ExternalLink: () => <span data-testid="external-link-icon">↗</span>,
}));

jest.mock('@/components/providers/ContactInfoProvider', () => ({
  useContactInfo: () => ({ phone: '+74993901595', email: 'info@test.ru' }),
}));

jest.mock('@/components/cookie-consent/CookieConsentProvider', () => ({
  CookieConsentContext: {
    Provider: ({ children }: any) => children,
  },
}));

describe('Footer', () => {
  it('renders copyright text', () => {
    render(<Footer />);
    expect(screen.getByText(/© 2026 Заборы и Навесы/)).toBeInTheDocument();
  });

  it('renders phone number from contact info', () => {
    render(<Footer />);
    expect(screen.getByText(/\+74993901595/)).toBeInTheDocument();
  });

  it('renders email from contact info', () => {
    render(<Footer />);
    expect(screen.getByText(/info@test\.ru/)).toBeInTheDocument();
  });

  it('renders platform links', () => {
    render(<Footer />);
    expect(screen.getByText('Авито')).toBeInTheDocument();
    expect(screen.getByText('Юла')).toBeInTheDocument();
  });

  it('renders external links with target blank', () => {
    render(<Footer />);
    const avitoLink = screen.getByText('Авито').closest('a');
    expect(avitoLink).toHaveAttribute('target', '_blank');
    expect(avitoLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders cookie settings button', () => {
    render(<Footer />);
    expect(screen.getByText('Настройка cookies')).toBeInTheDocument();
  });

  it('renders "Мы на площадках" heading', () => {
    render(<Footer />);
    expect(screen.getByText('Мы на площадках')).toBeInTheDocument();
  });
});
