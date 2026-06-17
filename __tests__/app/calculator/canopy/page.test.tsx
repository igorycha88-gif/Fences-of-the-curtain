import '@testing-library/jest-dom';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

jest.mock('next/link', () => ({
  __esModule: true,
  default: function MockLink({ children, href, ...props }: any) {
    return <a href={href} {...props}>{children}</a>;
  },
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), refresh: jest.fn() }),
  usePathname: () => '/',
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: function MockImage(props: any) {
    return <img {...props} />;
  },
}));

const trackEventMock = jest.fn();
const metrikaCompleteMock = jest.fn();

jest.mock('@/lib/analytics', () => ({
  __esModule: true,
  trackEvent: (...args: unknown[]) => trackEventMock(...args),
}));

jest.mock('@/lib/seo/metrika', () => ({
  __esModule: true,
  metrikaEvents: {
    calculatorComplete: (...args: unknown[]) => metrikaCompleteMock(...args),
  },
}));

jest.mock('@/components/layout/Header', () => ({
  __esModule: true,
  default: function MockHeader() {
    return <div data-testid="mock-header" />;
  },
}));

jest.mock('@/components/calculator/CanopyNomenclatureNotFoundModal', () => ({
  __esModule: true,
  default: function MockModal() {
    return <div data-testid="mock-modal" />;
  },
}));

import CanopyCalculatorPage from '@/app/(public)/calculator/canopy/page';

const roofCoverings = [
  { id: 'rc-1', name: 'Поликарбонат', retailPricePerSqm: 1000, thickness: 8 },
];

function renderPage() {
  return render(<CanopyCalculatorPage />);
}

function getFieldByLabel(labelText: string): HTMLInputElement {
  const label = screen.getByText(labelText);
  const input = label.parentElement?.querySelector('input');
  if (!input) {
    throw new Error(`Input for label "${labelText}" not found`);
  }
  return input as HTMLInputElement;
}

async function loadCatalogs() {
  await waitFor(() => {
    expect(getFieldByLabel('Длина (м)')).toBeInTheDocument();
  });
  await waitFor(() => {
    expect(
      screen.getByRole('button', { name: /Рассчитать стоимость/i }),
    ).not.toBeDisabled();
  });
}

describe('CanopyCalculatorPage — numeric input fields', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as any) = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => roofCoverings,
    }) as any;
  });

  it('renders initial numeric values in fields', async () => {
    await act(async () => {
      renderPage();
    });
    await loadCatalogs();

    expect((getFieldByLabel('Высота (м)')).value).toBe('2.5');
    expect((getFieldByLabel('Длина (м)')).value).toBe('6');
    expect((getFieldByLabel('Ширина (м)')).value).toBe('4');
  });

  it('allows fully clearing the Height field (no forced zero)', async () => {
    await act(async () => {
      renderPage();
    });
    await loadCatalogs();

    const heightInput = getFieldByLabel('Высота (м)');
    fireEvent.change(heightInput, { target: { value: '' } });

    expect(heightInput.value).toBe('');
  });

  it('allows fully clearing the Length field and shows error on calculate', async () => {
    await act(async () => {
      renderPage();
    });
    await loadCatalogs();

    const lengthInput = getFieldByLabel('Длина (м)');
    fireEvent.change(lengthInput, { target: { value: '' } });

    expect(lengthInput.value).toBe('');

    fireEvent.click(screen.getByRole('button', { name: /Рассчитать стоимость/i }));

    await waitFor(() => {
      expect(
        screen.getByText('Длина и ширина должны быть положительными числами'),
      ).toBeInTheDocument();
    });
  });

  it('allows fully clearing the Width field and shows error on calculate', async () => {
    await act(async () => {
      renderPage();
    });
    await loadCatalogs();

    const widthInput = getFieldByLabel('Ширина (м)');
    fireEvent.change(widthInput, { target: { value: '' } });

    expect(widthInput.value).toBe('');

    fireEvent.click(screen.getByRole('button', { name: /Рассчитать стоимость/i }));

    await waitFor(() => {
      expect(
        screen.getByText('Длина и ширина должны быть положительными числами'),
      ).toBeInTheDocument();
    });
  });

  it('accepts decimal values and calculates successfully', async () => {
    await act(async () => {
      renderPage();
    });
    await loadCatalogs();

    const lengthInput = getFieldByLabel('Длина (м)');
    const widthInput = getFieldByLabel('Ширина (м)');

    fireEvent.change(lengthInput, { target: { value: '5.5' } });
    fireEvent.change(widthInput, { target: { value: '3.2' } });

    fireEvent.click(screen.getByRole('button', { name: /Рассчитать стоимость/i }));

    await waitFor(() => {
      expect(metrikaCompleteMock).toHaveBeenCalledWith('canopy', expect.any(Number));
    });
  });

  it('allows typing a new value after fully clearing the field', async () => {
    await act(async () => {
      renderPage();
    });
    await loadCatalogs();

    const lengthInput = getFieldByLabel('Длина (м)');

    fireEvent.change(lengthInput, { target: { value: '' } });
    expect(lengthInput.value).toBe('');

    fireEvent.change(lengthInput, { target: { value: '7' } });
    expect(lengthInput.value).toBe('7');

    fireEvent.click(screen.getByRole('button', { name: /Рассчитать стоимость/i }));

    await waitFor(() => {
      expect(
        screen.queryByText('Длина и ширина должны быть положительными числами'),
      ).not.toBeInTheDocument();
    });
  });

  it('calculates successfully with default values', async () => {
    await act(async () => {
      renderPage();
    });
    await loadCatalogs();

    fireEvent.click(screen.getByRole('button', { name: /Рассчитать стоимость/i }));

    await waitFor(() => {
      expect(metrikaCompleteMock).toHaveBeenCalled();
    });
  });
});

describe('CanopyCalculatorPage — layout offset for fixed header', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as any) = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => roofCoverings,
    }) as any;
  });

  it('main content has top padding to avoid fixed-header overlap', async () => {
    await act(async () => {
      renderPage();
    });
    await loadCatalogs();

    const heading = screen.getByRole('heading', { level: 1, name: 'Калькулятор навеса' });
    const main = heading.closest('main');

    expect(main).not.toBeNull();
    expect(main?.className).toContain('pt-24');
    expect(main?.className).not.toContain('py-10');
  });

  it('loading state main has top padding to avoid fixed-header overlap', async () => {
    let resolveFetch: (value: unknown) => void = () => {};
    (global.fetch as any) = jest.fn(
      () => new Promise((resolve) => { resolveFetch = resolve; }),
    ) as any;

    await act(async () => {
      renderPage();
    });

    const loadingText = screen.getByText('Загрузка справочников...');
    const main = loadingText.closest('main');

    expect(main).not.toBeNull();
    expect(main?.className).toContain('pt-24');
    expect(main?.className).not.toContain('py-10');

    await act(async () => {
      resolveFetch({ ok: true, json: async () => roofCoverings });
      await new Promise((r) => setTimeout(r, 0));
    });
  });
});
