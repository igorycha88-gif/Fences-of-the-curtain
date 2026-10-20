import '@testing-library/jest-dom';
import { describe, it, expect, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import CalcTypesGrid from '@/components/home/CalcTypesGrid';

jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }: any) {
    return <a href={href} {...props}>{children}</a>;
  };
});

jest.mock('lucide-react', () => ({
  ArrowRight: () => <span data-testid="icon-arrow-right">→</span>,
  ChevronRight: () => <span data-testid="icon-chevron">›</span>,
  DoorClosed: () => <span data-testid="icon-door-closed">door-closed</span>,
  DoorOpen: () => <span data-testid="icon-door-open">door-open</span>,
  Fence: () => <span data-testid="icon-fence">fence</span>,
  Home: () => <span data-testid="icon-home">home</span>,
  Warehouse: () => <span data-testid="icon-warehouse">warehouse</span>,
}));

const EXPECTED_TYPES = [
  { title: 'Забор', href: '/calculator/fence' },
  { title: 'Навес', href: '/calculator/canopy' },
  { title: 'Ворота', href: '/calculator/gates' },
  { title: 'Калитка', href: '/calculator/gates' },
  { title: 'Гараж', href: '/garazhi-iz-sendvich-panelej' },
];

describe('CalcTypesGrid', () => {
  it('renders all 5 calc type cards', () => {
    render(<CalcTypesGrid />);
    EXPECTED_TYPES.forEach(({ title }) => {
      expect(screen.getByText(title)).toBeInTheDocument();
    });
  });

  it('links each card to the correct calculator', () => {
    render(<CalcTypesGrid />);
    EXPECTED_TYPES.forEach(({ title, href }) => {
      const link = screen.getByText(title).closest('a');
      expect(link).not.toBeNull();
      expect(link).toHaveAttribute('href', href);
    });
  });

  it('renders CTA label in every card', () => {
    render(<CalcTypesGrid />);
    expect(screen.getAllByText('Рассчитать').length).toBe(5);
  });

  it('marks garage card with NEW badge and price per sqm', () => {
    render(<CalcTypesGrid />);
    expect(screen.getByText('Новый')).toBeInTheDocument();
    expect(screen.getByText(/от 40 000 ₽\/м²/)).toBeInTheDocument();

    const garageCard = screen.getByText('Гараж').closest('a');
    expect(garageCard).toContainElement(screen.getByText('Новый'));
  });

  it('renders only one NEW badge', () => {
    render(<CalcTypesGrid />);
    expect(screen.getAllByText('Новый').length).toBe(1);
  });

  it('has accessible labels for each card', () => {
    render(<CalcTypesGrid />);
    EXPECTED_TYPES.forEach(({ title }) => {
      expect(screen.getByLabelText(`Рассчитать: ${title}`)).toBeInTheDocument();
    });
  });
});
