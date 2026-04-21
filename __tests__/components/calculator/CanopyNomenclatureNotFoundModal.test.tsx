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

import CanopyNomenclatureNotFoundModal from '@/components/calculator/CanopyNomenclatureNotFoundModal';

const canopyParameters = {
  canopyType: 'attached',
  canopyTypeLabel: 'Пристроенный',
  purpose: 'carport',
  purposeLabel: 'Навес для авто',
  length: 6,
  width: 3,
  height: 2.5,
  installationType: 'concrete',
  installationTypeLabel: 'Бетонирование',
  roofMaterial: 'polycarbonate',
  roofMaterialLabel: 'Поликарбонат',
  hasWaterSystem: true,
};

const defaultProps = {
  isOpen: true,
  onClose: jest.fn(),
  onSuccess: jest.fn(),
  canopyParameters,
};

function fillValidPhone() {
  const phoneInput = screen.getByPlaceholderText('+7 (___) ___-__-__');
  fireEvent.change(phoneInput, { target: { value: '+7 (999) 123-45-67' } });
}

describe('CanopyNomenclatureNotFoundModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns null when isOpen is false', () => {
    const { container } = render(<CanopyNomenclatureNotFoundModal {...defaultProps} isOpen={false} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders form and canopy parameters when open', () => {
    render(<CanopyNomenclatureNotFoundModal {...defaultProps} />);

    expect(screen.getByText('Индивидуальный расчёт навеса')).toBeInTheDocument();
    expect(screen.getByText('Пристроенный')).toBeInTheDocument();
    expect(screen.getByText('Навес для авто')).toBeInTheDocument();
    expect(screen.getByText('6 м')).toBeInTheDocument();
    expect(screen.getByText('3 м')).toBeInTheDocument();
    expect(screen.getByText('2.5 м')).toBeInTheDocument();
    expect(screen.getByText('Бетонирование')).toBeInTheDocument();
    expect(screen.getByText('Поликарбонат')).toBeInTheDocument();
    expect(screen.getByText('Да')).toBeInTheDocument();
  });

  it('does not render water system when hasWaterSystem is false', () => {
    render(
      <CanopyNomenclatureNotFoundModal
        {...defaultProps}
        canopyParameters={{ ...canopyParameters, hasWaterSystem: false }}
      />
    );

    expect(screen.queryByText('Водосток:')).not.toBeInTheDocument();
  });

  it('shows validation errors on empty submit', async () => {
    render(<CanopyNomenclatureNotFoundModal {...defaultProps} />);

    await userEvent.click(screen.getByRole('button', { name: /Отправить заявку/i }));

    expect(screen.getByText('Имя должно содержать минимум 2 символа')).toBeInTheDocument();
    expect(screen.getByText(/Введите телефон в формате/)).toBeInTheDocument();
  });

  it('calls onClose when close button clicked', async () => {
    render(<CanopyNomenclatureNotFoundModal {...defaultProps} />);

    await userEvent.click(screen.getByLabelText('Закрыть'));

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when backdrop is clicked', async () => {
    render(<CanopyNomenclatureNotFoundModal {...defaultProps} />);

    const backdrop = document.querySelector('.fixed.inset-0') as HTMLElement;
    await userEvent.click(backdrop);

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('closes on Escape key press', async () => {
    render(<CanopyNomenclatureNotFoundModal {...defaultProps} />);

    fireEvent.keyDown(document, { key: 'Escape' });

    await waitFor(() => {
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  it('submits successfully and shows success state', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ orderId: 'ord-1' }),
    }) as any;

    render(<CanopyNomenclatureNotFoundModal {...defaultProps} />);

    await userEvent.type(screen.getByPlaceholderText('Иван Петров'), 'Иван Петров');
    fillValidPhone();

    const form = screen.getByRole('button', { name: /Отправить заявку/i }).closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('Заявка отправлена!')).toBeInTheDocument();
    });

    expect(screen.getByText('Мы свяжемся с вами в ближайшее время')).toBeInTheDocument();
  });

  it('sends isIndividualRequest and canopyParameters in request body', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ orderId: 'ord-1' }),
    }) as any;

    render(<CanopyNomenclatureNotFoundModal {...defaultProps} />);

    await userEvent.type(screen.getByPlaceholderText('Иван Петров'), 'Иван Петров');
    fillValidPhone();
    await userEvent.click(screen.getByRole('button', { name: /Отправить заявку/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/orders', expect.objectContaining({ method: 'POST' }));
    });

    const callBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(callBody.isIndividualRequest).toBe(true);
    expect(callBody.canopyParameters.canopyType).toBe('attached');
  });

  it('shows error on fetch failure', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error')) as any;

    render(<CanopyNomenclatureNotFoundModal {...defaultProps} />);

    await userEvent.type(screen.getByPlaceholderText('Иван Петров'), 'Иван Петров');
    fillValidPhone();
    await userEvent.click(screen.getByRole('button', { name: /Отправить заявку/i }));

    await waitFor(() => {
      expect(screen.getByText(/Ошибка отправки заявки/)).toBeInTheDocument();
    });
  });
});
