import '@testing-library/jest-dom';
import { describe, it, expect, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Header from '@/components/layout/Header';

jest.mock('next/link', () => {
  return function MockLink({ children, href, onClick, ...props }: any) {
    return <a href={href} onClick={onClick} {...props}>{children}</a>;
  };
});

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), prefetch: jest.fn() }),
  usePathname: () => '/',
}));

jest.mock('lucide-react', () => ({
  Menu: () => <span data-testid="menu-icon">Menu</span>,
  X: () => <span data-testid="x-icon">X</span>,
  Fence: () => <span data-testid="fence-icon">Fence</span>,
  Sun: () => <span data-testid="sun-icon">Sun</span>,
  Moon: () => <span data-testid="moon-icon">Moon</span>,
}));

jest.mock('@/components/layout/ContactPhoneBadge', () => {
  return function MockContactPhoneBadge() {
    return <span data-testid="phone-badge">Phone</span>;
  };
});

jest.mock('@/components/providers/ContactInfoProvider', () => ({
  useContactInfo: () => ({ phone: '+74993901595', email: '' }),
}));

describe('Header', () => {
  it('renders logo text "Заборы и Навесы"', () => {
    render(<Header />);
    expect(screen.getByText('Заборы и Навесы')).toBeInTheDocument();
  });

  it('renders navigation links (desktop + mobile)', () => {
    render(<Header />);
    expect(screen.getAllByText('Главная').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('Калькулятор').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('Услуги').length).toBeGreaterThanOrEqual(2);
  });

  it('renders login links with correct href', () => {
    render(<Header />);
    const loginLinks = screen.getAllByText('Войти');
    loginLinks.forEach(link => {
      expect(link.closest('a')).toHaveAttribute('href', '/admin/login');
    });
  });

  it('renders theme toggle button', () => {
    render(<Header />);
    expect(screen.getByLabelText('Toggle theme')).toBeInTheDocument();
  });

  it('toggles mobile menu on hamburger click', async () => {
    render(<Header />);
    const menuBtn = screen.getByLabelText('Toggle menu');
    await userEvent.click(menuBtn);
    expect(screen.getByTestId('x-icon')).toBeInTheDocument();
    await userEvent.click(menuBtn);
    expect(screen.getByTestId('menu-icon')).toBeInTheDocument();
  });

  it('renders contact phone badge', () => {
    render(<Header />);
    expect(screen.getAllByTestId('phone-badge').length).toBeGreaterThanOrEqual(1);
  });

  it('toggles dark mode on theme button click', async () => {
    render(<Header />);
    const themeBtn = screen.getByLabelText('Toggle theme');
    await userEvent.click(themeBtn);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    await userEvent.click(themeBtn);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('renders all nav links with correct hrefs', () => {
    render(<Header />);
    const homeLinks = screen.getAllByText('Главная');
    expect(homeLinks.some(el => el.closest('a')?.getAttribute('href') === '/')).toBe(true);
  });
});
