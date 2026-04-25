import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { OrderStatusSection } from '@/components/admin/Orders/OrderStatusSection';

jest.mock('@/components/admin/Orders/StatusHistory', () => ({
  StatusHistory: ({ history }: any) => (
    <div data-testid="status-history">History: {history.length} entries</div>
  ),
}));

const defaultHistory: Array<{
  status: 'NEW' | 'ESTIMATE_APPROVAL' | 'MEASUREMENT' | 'PRODUCTION' | 'INSTALLATION' | 'COMPLETED' | 'CANCELLED';
  statusLabel: string;
  changedAt: string;
  changedBy: string;
  changedByName: string;
  data: Record<string, unknown>;
}> = [
  { status: 'NEW', statusLabel: 'Новая', changedAt: '2026-01-01T10:00:00Z', changedBy: 'user1', changedByName: 'Admin', data: {} },
  { status: 'ESTIMATE_APPROVAL', statusLabel: 'Согласование сметы', changedAt: '2026-01-02T10:00:00Z', changedBy: 'user1', changedByName: 'Admin', data: {} },
];

const defaultProps = {
  status: 'ESTIMATE_APPROVAL' as const,
  statusLabel: 'Согласование сметы',
  measurementAddress: 'ул. Ленина, д. 10' as string | null,
  measurementDate: '2026-01-15' as string | null,
  cancellationReason: null as string | null,
  completionDate: null as string | null,
  assignedUser: { id: 'u1', name: 'Иван', role: 'ADMIN' } as any,
  statusHistory: defaultHistory,
  isAdmin: true,
};

describe('OrderStatusSection', () => {
  it('renders current status badge', () => {
    render(<OrderStatusSection {...defaultProps} />);
    expect(screen.getByText('Согласование сметы')).toBeInTheDocument();
  });

  it('renders measurement address when provided', () => {
    render(<OrderStatusSection {...defaultProps} measurementAddress="ул. Ленина, д. 10" />);
    expect(screen.getByText('ул. Ленина, д. 10')).toBeInTheDocument();
  });

  it('renders assigned user', () => {
    render(<OrderStatusSection {...defaultProps} />);
    expect(screen.getByText(/Иван/)).toBeInTheDocument();
    expect(screen.getByText(/Администратор/)).toBeInTheDocument();
  });

  it('toggles history visibility on click', () => {
    render(<OrderStatusSection {...defaultProps} />);
    const toggleBtn = screen.getByText(/История изменений \(2\)/);
    expect(screen.queryByTestId('status-history')).not.toBeInTheDocument();
    fireEvent.click(toggleBtn);
    expect(screen.getByTestId('status-history')).toBeInTheDocument();
  });

  it('renders cancellation reason when status is CANCELLED', () => {
    render(
      <OrderStatusSection
        {...defaultProps}
        status="CANCELLED"
        statusLabel="Отменена"
        cancellationReason="Цена слишком высокая"
      />
    );
    expect(screen.getByText('Цена слишком высокая')).toBeInTheDocument();
  });

  it('renders completion date when status is COMPLETED', () => {
    render(
      <OrderStatusSection
        {...defaultProps}
        status="COMPLETED"
        statusLabel="Выполнена"
        completionDate="2026-02-01"
      />
    );
    expect(screen.getByText('Дата завершения')).toBeInTheDocument();
  });
});
