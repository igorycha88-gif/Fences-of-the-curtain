import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { StatusHistory } from '@/components/admin/Orders/StatusHistory';

jest.mock('@/lib/validators/order', () => ({
  STATUS_LABELS: {
    NEW: 'Новая',
    ESTIMATE_APPROVAL: 'Согласование сметы',
    MEASUREMENT: 'Замер',
    PRODUCTION: 'Производство',
    INSTALLATION: 'Монтаж',
    COMPLETED: 'Выполнена',
    CANCELLED: 'Отменена',
  },
}));

describe('StatusHistory', () => {
  it('renders empty state when history is empty', () => {
    render(<StatusHistory history={[]} />);
    expect(screen.getByText('История пуста')).toBeInTheDocument();
  });

  it('renders history entries with status labels', () => {
    const history = [
      { status: 'NEW', changedAt: '2026-01-01T10:00:00Z', changedBy: 'u1', changedByName: 'Admin', data: {} },
      { status: 'ESTIMATE_APPROVAL', changedAt: '2026-01-02T12:00:00Z', changedBy: 'u1', changedByName: 'Manager', data: {} },
    ];
    render(<StatusHistory history={history as any} />);
    expect(screen.getByText('Новая')).toBeInTheDocument();
    expect(screen.getByText('Согласование сметы')).toBeInTheDocument();
  });

  it('renders changedByName for each entry', () => {
    const history = [
      { status: 'NEW', changedAt: '2026-01-01T10:00:00Z', changedBy: 'u1', changedByName: 'Admin Ivan', data: {} },
    ];
    render(<StatusHistory history={history as any} />);
    expect(screen.getByText(/Admin Ivan/)).toBeInTheDocument();
  });

  it('renders section header', () => {
    const history = [
      { status: 'NEW', changedAt: '2026-01-01T10:00:00Z', changedBy: 'u1', changedByName: 'Admin', data: {} },
    ];
    render(<StatusHistory history={history as any} />);
    expect(screen.getByText('История изменений')).toBeInTheDocument();
  });

  it('handles null history gracefully', () => {
    render(<StatusHistory history={null as any} />);
    expect(screen.getByText('История пуста')).toBeInTheDocument();
  });
});
