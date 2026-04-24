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

import NomenclatureNotFoundModal from '@/components/calculator/NomenclatureNotFoundModal';

const fenceParameters = {
  fenceTypeId: 'ft-1',
  fenceTypeName: 'Штакетник',
  length: 25,
  height: 2,
  coating: 'POLYMER_SINGLE',
  hasGate: true,
  gateType: 'SLIDING',
  gateWidth: 4,
  hasWicket: true,
  wicketWidth: 1.2,
};

const defaultProps = {
  isOpen: true,
  onClose: jest.fn(),
  onSuccess: jest.fn(),
  fenceParameters,
};

function fillValidPhone() {
  const phoneInput = screen.getByPlaceholderText('+7 (___) ___-__-__');
  fireEvent.change(phoneInput, { target: { value: '+7 (999) 123-45-67' } });
}

describe('NomenclatureNotFoundModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns null when isOpen is false', () => {
    const { container } = render(<NomenclatureNotFoundModal {...defaultProps} isOpen={false} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders form and fence parameters when open', () => {
    render(<NomenclatureNotFoundModal {...defaultProps} />);

    expect(screen.getByText('Индивидуальный расчёт')).toBeInTheDocument();
    expect(screen.getByText('Штакетник')).toBeInTheDocument();
    expect(screen.getByText('25 м')).toBeInTheDocument();
    expect(screen.getByText('2 м')).toBeInTheDocument();
    expect(screen.getByText(/Откатные, 4 м/)).toBeInTheDocument();
    expect(screen.getByText('1.2 м')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Иван Петров')).toBeInTheDocument();
  });

  it('renders coating label from mapping', () => {
    render(<NomenclatureNotFoundModal {...defaultProps} />);
    expect(screen.getByText('Полимерное (одностороннее)')).toBeInTheDocument();
  });

  it('shows validation errors on empty submit', async () => {
    render(<NomenclatureNotFoundModal {...defaultProps} />);

    await userEvent.click(screen.getByRole('button', { name: /Отправить заявку/i }));

    expect(screen.getByText('Имя должно содержать минимум 2 символа')).toBeInTheDocument();
    expect(screen.getByText(/Введите телефон в формате/)).toBeInTheDocument();
  });

  it('calls onClose when close button clicked', async () => {
    render(<NomenclatureNotFoundModal {...defaultProps} />);

    await userEvent.click(screen.getByLabelText('Закрыть'));

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when backdrop is clicked', async () => {
    render(<NomenclatureNotFoundModal {...defaultProps} />);

    const backdrop = document.querySelector('.fixed.inset-0') as HTMLElement;
    await userEvent.click(backdrop);

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('closes on Escape key press', async () => {
    render(<NomenclatureNotFoundModal {...defaultProps} />);

    fireEvent.keyDown(document, { key: 'Escape' });

    await waitFor(() => {
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  it('submits successfully and shows success state', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global.fetch as any) = (jest.fn() as any).mockResolvedValue({
      ok: true,
      json: async () => ({ orderId: 'ord-1' }),
    });

    render(<NomenclatureNotFoundModal {...defaultProps} />);

    await userEvent.type(screen.getByPlaceholderText('Иван Петров'), 'Иван Петров');
    fillValidPhone();

    const form = screen.getByRole('button', { name: /Отправить заявку/i }).closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('Заявка отправлена!')).toBeInTheDocument();
    });

    expect(screen.getByText('Мы свяжемся с вами в ближайшее время')).toBeInTheDocument();
  });

  it('shows error on rate limit exceeded', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global.fetch as any) = (jest.fn() as any).mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'RATE_LIMIT_EXCEEDED' }),
    });

    render(<NomenclatureNotFoundModal {...defaultProps} />);

    await userEvent.type(screen.getByPlaceholderText('Иван Петров'), 'Иван Петров');
    fillValidPhone();
    await userEvent.click(screen.getByRole('button', { name: /Отправить заявку/i }));

    await waitFor(() => {
      expect(screen.getByText(/Слишком много запросов/)).toBeInTheDocument();
    });
  });

  it('sends isIndividualRequest and fenceParameters in request body', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global.fetch as any) = (jest.fn() as any).mockResolvedValue({
      ok: true,
      json: async () => ({ orderId: 'ord-1' }),
    });

    render(<NomenclatureNotFoundModal {...defaultProps} />);

    await userEvent.type(screen.getByPlaceholderText('Иван Петров'), 'Иван Петров');
    fillValidPhone();
    await userEvent.click(screen.getByRole('button', { name: /Отправить заявку/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/orders', expect.objectContaining({ method: 'POST' }));
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const callBody = JSON.parse((global.fetch as any).mock.calls[0][1].body as string);
    expect(callBody.isIndividualRequest).toBe(true);
    expect(callBody.fenceParameters.fenceTypeName).toBe('Штакетник');
  });

  it('renders mesh-specific parameters', () => {
    render(
      <NomenclatureNotFoundModal
        {...defaultProps}
        fenceParameters={{
          ...fenceParameters,
          fenceTypeName: 'Сетка-рабица',
          coating: undefined,
          meshCoating: 'GALVANIZED',
          meshCellSize: 50,
          meshWireThickness: 2.5,
        }}
      />
    );

    expect(screen.getByText('Оцинковка')).toBeInTheDocument();
    expect(screen.getByText('50 мм')).toBeInTheDocument();
    expect(screen.getByText('2.5 мм')).toBeInTheDocument();
  });
});
