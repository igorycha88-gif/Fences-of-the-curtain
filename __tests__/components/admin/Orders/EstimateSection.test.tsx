import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { EstimateSection } from '@/components/admin/Orders/EstimateSection';

jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }: any) {
    return <a href={href} {...props}>{children}</a>;
  };
});

const mockItems = [
  { category: 'material', nomenclatureId: 'n1', nomenclatureName: 'Столб 60x60', quantity: 10, unit: 'шт', pricePerUnit: 1500, totalPrice: 15000 },
  { category: 'material', nomenclatureId: 'n2', nomenclatureName: 'Лага 40x20', quantity: 6, unit: 'шт', pricePerUnit: 500, totalPrice: 3000 },
  { category: 'installation', nomenclatureId: 'n3', nomenclatureName: 'Монтаж забора', quantity: 50, unit: 'м.п.', pricePerUnit: 800, totalPrice: 40000 },
];

const defaultProps = {
  estimateId: 'est-123',
  items: mockItems,
  materialsTotal: 18000,
  installationTotal: 40000,
  grandTotal: 58000,
};

describe('EstimateSection', () => {
  it('renders section header and items', () => {
    render(<EstimateSection {...defaultProps} />);
    expect(screen.getByText('Смета')).toBeInTheDocument();
    expect(screen.getByText('Столб 60x60')).toBeInTheDocument();
    expect(screen.getByText('Лага 40x20')).toBeInTheDocument();
    expect(screen.getByText('Монтаж забора')).toBeInTheDocument();
  });

  it('renders materials and installation totals', () => {
    render(<EstimateSection {...defaultProps} />);
    expect(screen.getByText('Итого материалы:')).toBeInTheDocument();
    expect(screen.getByText('Итого работы:')).toBeInTheDocument();
    expect(screen.getByText('18 000 ₽')).toBeInTheDocument();
    expect(screen.getAllByText('40 000 ₽').length).toBeGreaterThanOrEqual(2);
  });

  it('renders grand total', () => {
    render(<EstimateSection {...defaultProps} />);
    expect(screen.getByText('58 000 ₽')).toBeInTheDocument();
    expect(screen.getByText('ИТОГО:')).toBeInTheDocument();
  });

  it('renders link to open in estimates', () => {
    render(<EstimateSection {...defaultProps} />);
    const link = screen.getByText('Открыть в Расчетах');
    expect(link).toBeInTheDocument();
    expect(link.closest('a')).toHaveAttribute('href', '/admin/estimates?open=est-123');
  });

  it('calls onEdit when edit button clicked', () => {
    const onEdit = jest.fn();
    render(<EstimateSection {...defaultProps} onEdit={onEdit} />);
    const editBtn = screen.getByTitle('Редактировать');
    fireEvent.click(editBtn);
    expect(onEdit).toHaveBeenCalled();
  });

  it('does not render edit button when onEdit not provided', () => {
    render(<EstimateSection {...defaultProps} />);
    expect(screen.queryByTitle('Редактировать')).not.toBeInTheDocument();
  });
});
