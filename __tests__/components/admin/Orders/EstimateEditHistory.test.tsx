import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EstimateEditHistory } from '@/components/admin/Orders/EstimateEditHistory';

global.fetch = jest.fn();

describe('EstimateEditHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show loading state', () => {
    (global.fetch as jest.Mock).mockReturnValue(new Promise(() => {}));
    render(<EstimateEditHistory orderId="order-1" />);

    expect(screen.getByText('История корректировок')).toBeInTheDocument();
  });

  it('should show empty state when no logs', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ logs: [] }),
    });

    render(<EstimateEditHistory orderId="order-1" />);

    await waitFor(() => {
      expect(screen.getByText('Корректировки еще не производились')).toBeInTheDocument();
    });
  });

  it('should show error state on fetch failure', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Server error' }),
    });

    render(<EstimateEditHistory orderId="order-1" />);

    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeInTheDocument();
    });
  });

  it('should display history entries', async () => {
    const logs = [
      {
        id: 'log-1',
        action: 'CREATE_ADMIN_ESTIMATE',
        user: { id: 'u-1', name: 'Админ', email: 'admin@test.com' },
        createdAt: '2026-01-15T10:00:00Z',
        details: {
          changes: [
            {
              type: 'PARAMETER_CHANGED',
              field: 'length',
              oldValue: 30,
              newValue: 35,
            },
          ],
          originalEstimateId: 'est-1',
          adminEstimateId: 'admin-est-1',
          editComment: 'Увеличена длина',
        },
      },
    ];

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ logs }),
    });

    render(<EstimateEditHistory orderId="order-1" />);

    await waitFor(() => {
      expect(screen.getByText('Создание корректировки')).toBeInTheDocument();
      expect(screen.getByText('Админ')).toBeInTheDocument();
    });
  });

  it('should expand entry on click', async () => {
    const logs = [
      {
        id: 'log-1',
        action: 'UPDATE_ADMIN_ESTIMATE',
        user: null,
        createdAt: '2026-01-15T10:00:00Z',
        details: {
          changes: [
            {
              type: 'QUANTITY_OVERRIDDEN',
              nomenclatureId: 'post-1',
              nomenclatureName: 'Столб 60x60',
              autoQuantity: 13,
              manualQuantity: 15,
            },
          ],
          originalEstimateId: null,
          adminEstimateId: null,
          editComment: 'Правка по замерам',
        },
      },
    ];

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ logs }),
    });

    render(<EstimateEditHistory orderId="order-1" />);

    await waitFor(() => {
      expect(screen.getByText('Обновление корректировки')).toBeInTheDocument();
    });

    const entry = screen.getByText('Обновление корректировки');
    fireEvent.click(entry);

    await waitFor(() => {
      expect(screen.getByText('Правка по замерам')).toBeInTheDocument();
    });
  });

  it('should show "записей" count label', async () => {
    const logs = [
      { id: 'log-1', action: 'CREATE_ADMIN_ESTIMATE', user: null, createdAt: '2026-01-01', details: { changes: [], originalEstimateId: null, adminEstimateId: null, editComment: null } },
      { id: 'log-2', action: 'UPDATE_ADMIN_ESTIMATE', user: null, createdAt: '2026-01-02', details: { changes: [], originalEstimateId: null, adminEstimateId: null, editComment: null } },
    ];

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ logs }),
    });

    render(<EstimateEditHistory orderId="order-1" />);

    await waitFor(() => {
      expect(screen.getByText('2 записей')).toBeInTheDocument();
    });
  });
});
