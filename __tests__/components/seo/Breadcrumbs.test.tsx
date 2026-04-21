import '@testing-library/jest-dom';
import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import Breadcrumbs from '@/components/seo/Breadcrumbs';

jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }: any) {
    return <a href={href} {...props}>{children}</a>;
  };
});

jest.mock('lucide-react', () => ({
  ChevronRight: () => <span data-testid="chevron">/</span>,
  Home: () => <span data-testid="home-icon">Home</span>,
}));

describe('Breadcrumbs', () => {
  it('renders home link as first item', () => {
    render(<Breadcrumbs items={[{ label: 'Услуги' }]} />);
    const homeLink = screen.getByTestId('home-icon').closest('a');
    expect(homeLink).toHaveAttribute('href', '/');
  });

  it('renders breadcrumb items with links', () => {
    render(
      <Breadcrumbs
        items={[
          { label: 'Услуги', href: '/services' },
          { label: 'Заборы', href: '/services/zabory' },
        ]}
      />
    );
    expect(screen.getByText('Услуги')).toHaveAttribute('href', '/services');
    expect(screen.getByText('Заборы')).toHaveAttribute('href', '/services/zabory');
  });

  it('renders last item without link as plain text', () => {
    render(
      <Breadcrumbs
        items={[
          { label: 'Услуги', href: '/services' },
          { label: 'Текущая страница' },
        ]}
      />
    );
    const lastItem = screen.getByText('Текущая страница');
    expect(lastItem.tagName).toBe('SPAN');
    expect(lastItem).not.toHaveAttribute('href');
  });

  it('renders nav element with aria-label', () => {
    render(<Breadcrumbs items={[{ label: 'Test' }]} />);
    expect(screen.getByRole('navigation')).toHaveAttribute('aria-label', 'Навигация');
  });

  it('renders chevron separators between items', () => {
    render(
      <Breadcrumbs
        items={[
          { label: 'Услуги', href: '/services' },
          { label: 'Заборы' },
        ]}
      />
    );
    const chevrons = screen.getAllByTestId('chevron');
    expect(chevrons).toHaveLength(2);
  });

  it('renders only home when items is empty', () => {
    render(<Breadcrumbs items={[]} />);
    expect(screen.getByTestId('home-icon')).toBeInTheDocument();
    expect(screen.queryByTestId('chevron')).not.toBeInTheDocument();
  });
});
