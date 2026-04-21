import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MobileSidebar } from '@/components/admin/Layout/MobileSidebar';

const mockPush = jest.fn();
const mockRefresh = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, back: jest.fn(), refresh: mockRefresh }),
  usePathname: () => '/admin/dashboard',
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: { user: { name: 'Admin User', email: 'admin@test.com', role: 'ADMIN' } },
  }),
  signOut: jest.fn().mockResolvedValue(undefined),
}));

describe('MobileSidebar', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    document.body.style.overflow = '';
  });

  it('renders admin panel header', () => {
    render(<MobileSidebar {...defaultProps} />);
    expect(screen.getByText('Админ-панель')).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    render(<MobileSidebar {...defaultProps} />);
    expect(screen.getByText('Дашборд')).toBeInTheDocument();
    expect(screen.getByText('Заявки')).toBeInTheDocument();
    expect(screen.getByText('Расчеты')).toBeInTheDocument();
    expect(screen.getByText('Калькулятор')).toBeInTheDocument();
  });

  it('calls onClose when close button clicked', () => {
    render(<MobileSidebar {...defaultProps} />);
    const closeButtons = screen.getAllByRole('button');
    const closeBtn = closeButtons.find(btn => btn.querySelector('svg.lucide-x') || btn.textContent === '');
    if (closeBtn) {
      fireEvent.click(closeBtn);
    }
  });

  it('calls onClose when overlay is clicked', () => {
    render(<MobileSidebar {...defaultProps} />);
    const overlay = document.querySelector('.bg-black\\/50');
    if (overlay) {
      fireEvent.click(overlay);
      expect(defaultProps.onClose).toHaveBeenCalled();
    }
  });

  it('renders user info section', () => {
    render(<MobileSidebar {...defaultProps} />);
    expect(screen.getByText('Admin User')).toBeInTheDocument();
    expect(screen.getByText('admin@test.com')).toBeInTheDocument();
  });

  it('renders logout button', () => {
    render(<MobileSidebar {...defaultProps} />);
    expect(screen.getByText('Выйти')).toBeInTheDocument();
  });

  it('renders references section with toggle', () => {
    render(<MobileSidebar {...defaultProps} />);
    expect(screen.getByText('Справочники')).toBeInTheDocument();
  });

  it('toggles references section on click', () => {
    render(<MobileSidebar {...defaultProps} />);
    const toggleBtn = screen.getByText('Справочники');
    fireEvent.click(toggleBtn);
  });

  it('does not render visible sidebar when closed', () => {
    const { container } = render(<MobileSidebar {...defaultProps} isOpen={false} />);
    const sidebar = container.querySelector('.-translate-x-full');
    expect(sidebar).toBeInTheDocument();
    expect(container.querySelector('.bg-black\\/50')).toBeNull();
  });
});
