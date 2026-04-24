import '@testing-library/jest-dom';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }: any) {
    return <a href={href} {...props}>{children}</a>;
  };
});

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), refresh: jest.fn() }),
  usePathname: () => '/',
}));

jest.mock('next/image', () => {
  return function MockImage(props: any) {
    return <img {...props} />;
  };
});

jest.mock('@/lib/seo/metrika', () => ({
  metrikaEvents: {
    orderFormSubmit: jest.fn(),
  },
}));

jest.mock('@/lib/analytics', () => ({
  trackEvent: jest.fn(),
}));

jest.mock('@/types/analytics', () => ({
  EVENT_NAMES: {
    CONTACT_FORM_SUBMIT: 'contact_form_submit',
  },
}));

import OrderForm from '@/components/calculator/OrderForm';

const singleProps = {
  calculatedCost: 150000,
  onClose: jest.fn(),
  onSuccess: jest.fn(),
};

const multiProps = {
  multiEstimateId: 'multi-1',
  estimates: [
    {
      index: 0,
      result: {
        estimateId: 'est-1',
        items: [
          { category: 'posts', nomenclatureId: 'n1', nomenclatureName: 'Столб 60x60', quantity: 10, unit: 'шт', pricePerUnit: 1500, totalPrice: 15000 },
          { category: 'pickets', nomenclatureId: 'n2', nomenclatureName: 'Штакетник', quantity: 100, unit: 'шт', pricePerUnit: 200, totalPrice: 20000 },
        ],
        totals: { materials: 35000, installation: 10000, grandTotal: 45000 },
        parameters: { fenceTypeId: 'ft-1', fenceTypeName: 'Штакетник', length: 20, height: 2, lagRows: 2, coating: 'POLYMER_SINGLE' },
        calculatedAt: '2026-01-01T00:00:00Z',
      },
    },
    {
      index: 1,
      result: {
        estimateId: 'est-2',
        items: [
          { category: 'posts', nomenclatureId: 'n3', nomenclatureName: 'Столб 80x80', quantity: 8, unit: 'шт', pricePerUnit: 2000, totalPrice: 16000 },
        ],
        totals: { materials: 16000, installation: 5000, grandTotal: 21000 },
        parameters: { fenceTypeId: 'ft-2', fenceTypeName: 'Профнастил', length: 15, height: 2.5, lagRows: 3 },
        calculatedAt: '2026-01-01T00:00:00Z',
      },
    },
  ],
  totals: { totalMaterials: 51000, totalInstallation: 15000, grandTotal: 66000 },
  onClose: jest.fn(),
  onSuccess: jest.fn(),
};

function fillValidPhone() {
  const phoneInput = screen.getByPlaceholderText('+7 (___) ___-__-__');
  fireEvent.change(phoneInput, { target: { value: '+7 (999) 123-45-67' } });
}

describe('OrderForm (single mode)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders form fields and calculated cost', () => {
    render(<OrderForm {...singleProps} />);

    expect(screen.getByText('Оформить заявку')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Иван Петров')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('+7 (___) ___-__-__')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('email@example.com')).toBeInTheDocument();
    expect(screen.getByText(/150 000/)).toBeInTheDocument();
  });

  it('shows validation errors on empty submit', async () => {
    render(<OrderForm {...singleProps} />);

    await userEvent.click(screen.getByRole('button', { name: /Отправить заявку/i }));

    expect(screen.getByText('Имя должно содержать минимум 2 символа')).toBeInTheDocument();
    expect(screen.getByText(/Введите телефон в формате/)).toBeInTheDocument();
  });

  it('shows email validation error for invalid email', async () => {
    render(<OrderForm {...singleProps} />);

    fireEvent.change(screen.getByPlaceholderText('Иван Петров'), { target: { value: 'Иван' } });
    fillValidPhone();
    fireEvent.change(screen.getByPlaceholderText('email@example.com'), { target: { value: 'bad-email' } });

    const form = screen.getByRole('button', { name: /Отправить заявку/i }).closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText(/Введите корректный email/)).toBeInTheDocument();
    });
  });

  it('calls onClose when close button clicked', async () => {
    render(<OrderForm {...singleProps} />);

    const cancelButton = screen.getByText('Отмена');
    await userEvent.click(cancelButton);

    expect(singleProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('submits form successfully and shows success state', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ orderId: 'ord-1' }),
    }) as any;

    render(<OrderForm {...singleProps} />);

    await userEvent.type(screen.getByPlaceholderText('Иван Петров'), 'Иван Петров');
    fillValidPhone();

    const form = screen.getByRole('button', { name: /Отправить заявку/i }).closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('Заявка отправлена!')).toBeInTheDocument();
    });

    expect(screen.getByText('Мы свяжемся с вами в ближайшее время')).toBeInTheDocument();
  });

  it('shows error on API failure', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ message: 'Сервер недоступен' }),
    }) as any;

    render(<OrderForm {...singleProps} />);

    await userEvent.type(screen.getByPlaceholderText('Иван Петров'), 'Иван Петров');
    fillValidPhone();
    await userEvent.click(screen.getByRole('button', { name: /Отправить заявку/i }));

    await waitFor(() => {
      expect(screen.getByText('Сервер недоступен')).toBeInTheDocument();
    });
  });

  it('shows session expired error', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'SESSION_EXPIRED' }),
    }) as any;

    render(<OrderForm {...singleProps} />);

    await userEvent.type(screen.getByPlaceholderText('Иван Петров'), 'Иван Петров');
    fillValidPhone();
    await userEvent.click(screen.getByRole('button', { name: /Отправить заявку/i }));

    await waitFor(() => {
      expect(screen.getByText(/Время сессии истекло/)).toBeInTheDocument();
    });
  });

  it('shows rate limit error', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'RATE_LIMIT_EXCEEDED' }),
    }) as any;

    render(<OrderForm {...singleProps} />);

    await userEvent.type(screen.getByPlaceholderText('Иван Петров'), 'Иван Петров');
    fillValidPhone();
    await userEvent.click(screen.getByRole('button', { name: /Отправить заявку/i }));

    await waitFor(() => {
      expect(screen.getByText(/Слишком много запросов/)).toBeInTheDocument();
    });
  });

  it('shows network error on fetch failure', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error')) as any;

    render(<OrderForm {...singleProps} />);

    await userEvent.type(screen.getByPlaceholderText('Иван Петров'), 'Иван Петров');
    fillValidPhone();
    await userEvent.click(screen.getByRole('button', { name: /Отправить заявку/i }));

    await waitFor(() => {
      expect(screen.getByText(/Ошибка отправки заявки/)).toBeInTheDocument();
    });
  });
});

describe('OrderForm (multi mode)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders multi-estimate view with fence counts and totals', () => {
    render(<OrderForm {...multiProps} />);

    expect(screen.getByText(/Типы заборов \(2\)/)).toBeInTheDocument();
    expect(screen.getAllByText(/Штакетник/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Профнастил/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/66 000/)).toBeInTheDocument();
    expect(screen.getByText('Итого:')).toBeInTheDocument();
  });

  it('expands estimate breakdown on click', async () => {
    render(<OrderForm {...multiProps} />);

    const expandButtons = screen.getAllByRole('button').filter(b => /Забор/.test(b.textContent || ''));
    await userEvent.click(expandButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Столб 60x60')).toBeInTheDocument();
    });
  });

  it('submits multi estimate with isMultiEstimate flag', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ orderId: 'ord-2' }),
    }) as any;

    render(<OrderForm {...multiProps} />);

    await userEvent.type(screen.getByPlaceholderText('Иван Петров'), 'Иван Петров');
    fillValidPhone();
    await userEvent.click(screen.getByRole('button', { name: /Отправить заявку/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/orders', expect.objectContaining({
        method: 'POST',
      }));
    });

    const callBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(callBody.isMultiEstimate).toBe(true);
    expect(callBody.multiEstimateId).toBe('multi-1');
  });
});
