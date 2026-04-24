import '@testing-library/jest-dom';
import { describe, it, expect, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import HomeFooter from '@/components/layout/HomeFooter';

jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }: any) {
    return <a href={href} {...props}>{children}</a>;
  };
});

jest.mock('lucide-react', () => ({
  Home: () => <span data-testid="home-icon">Home</span>,
  ExternalLink: () => <span data-testid="external-link">↗</span>,
}));

jest.mock('@/components/providers/ContactInfoProvider', () => ({
  useContactInfo: () => ({
    phone: '+74993901595',
    email: 'info@test.ru',
    workHours: { monFri: '09:00-18:00', sat: '10:00-15:00', sun: '' },
  }),
}));

describe('HomeFooter', () => {
  it('renders company name', () => {
    render(<HomeFooter />);
    const names = screen.getAllByText('Заборы и Навесы');
    expect(names.length).toBeGreaterThanOrEqual(1);
  });

  it('renders copyright', () => {
    render(<HomeFooter />);
    expect(screen.getByText(/© 2026 Заборы и Навесы/)).toBeInTheDocument();
  });

  it('renders fence service links', () => {
    render(<HomeFooter />);
    expect(screen.getByText('Забор из профнастила')).toHaveAttribute('href', '/services/zabor-iz-profnastila');
    expect(screen.getByText('Забор из евроштакетника')).toHaveAttribute('href', '/services/zabor-iz-evroshtaketnika');
  });

  it('renders canopy service links', () => {
    render(<HomeFooter />);
    expect(screen.getByText('Навес под машину')).toHaveAttribute('href', '/services/naves-pod-mashinu');
    expect(screen.getByText('Навес из поликарбоната')).toHaveAttribute('href', '/services/naves-iz-polikarbonata');
  });

  it('renders calculator links', () => {
    render(<HomeFooter />);
    expect(screen.getByText('Калькулятор забора')).toHaveAttribute('href', '/calculator/fence');
    expect(screen.getByText('Калькулятор навеса')).toHaveAttribute('href', '/calculator/canopy');
  });

  it('renders information links', () => {
    render(<HomeFooter />);
    expect(screen.getByText('Портфолио')).toHaveAttribute('href', '/portfolio');
    expect(screen.getByText('Блог')).toHaveAttribute('href', '/blog');
    expect(screen.getByText('Вопросы и ответы')).toHaveAttribute('href', '/faq');
    const contactsLinks = screen.getAllByText('Контакты');
    const contactsLink = contactsLinks.find(el => el.tagName === 'A');
    expect(contactsLink).toHaveAttribute('href', '/contacts');
  });

  it('renders contact info', () => {
    render(<HomeFooter />);
    expect(screen.getByText('+74993901595')).toBeInTheDocument();
    expect(screen.getByText('info@test.ru')).toBeInTheDocument();
    expect(screen.getByText('Пн-Пт: 09:00-18:00')).toBeInTheDocument();
  });

  it('renders Saturday hours when present', () => {
    render(<HomeFooter />);
    expect(screen.getByText('Сб: 10:00-15:00')).toBeInTheDocument();
  });

  it('renders external platform links', () => {
    render(<HomeFooter />);
    expect(screen.getByText('Авито')).toBeInTheDocument();
    expect(screen.getByText('Юла')).toBeInTheDocument();
  });
});
