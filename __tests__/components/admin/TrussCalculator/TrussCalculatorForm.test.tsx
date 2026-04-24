import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TrussCalculatorForm from '@/components/admin/TrussCalculator/TrussCalculatorForm';

global.fetch = jest.fn();

describe('TrussCalculatorForm', () => {
  const defaultProps = {
    onCalculate: jest.fn(),
    loading: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      json: async () => ({ coverings: [{ id: 'c1', name: 'Профнастил С8' }], profiles: [{ id: 'p1', name: '60x60x2', category: 'POST' }] }),
    });
  });

  it('renders form fields', async () => {
    render(<TrussCalculatorForm {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('Параметры навеса')).toBeInTheDocument();
    });
    expect(screen.getByText(/Ширина навеса/)).toBeInTheDocument();
    expect(screen.getByText(/Длина навеса/)).toBeInTheDocument();
    expect(screen.getByText(/Высота в коньке/)).toBeInTheDocument();
    expect(screen.getByText(/Шаг установки ферм/)).toBeInTheDocument();
  });

  it('renders submit button with correct text', async () => {
    render(<TrussCalculatorForm {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('Рассчитать')).toBeInTheDocument();
    });
  });

  it('renders submit button as loading when loading prop is true', async () => {
    render(<TrussCalculatorForm {...defaultProps} loading={true} />);
    await waitFor(() => {
      expect(screen.getByText('Расчёт...')).toBeInTheDocument();
    });
  });

  it('fetches roof coverings and profiles on mount', async () => {
    render(<TrussCalculatorForm {...defaultProps} />);
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/admin/truss-roof-coverings');
      expect(global.fetch).toHaveBeenCalledWith('/api/admin/truss-profiles');
    });
  });

  it('shows wall height field for SINGLE_SLOPE type', async () => {
    render(<TrussCalculatorForm {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('Параметры навеса')).toBeInTheDocument();
    });
    expect(screen.getByText(/Высота у низкой стены/)).toBeInTheDocument();
  });

  it('calls onCalculate when form is submitted', async () => {
    render(<TrussCalculatorForm {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('Рассчитать')).toBeInTheDocument();
    });
    const form = document.querySelector('form')!;
    fireEvent.submit(form);
    expect(defaultProps.onCalculate).toHaveBeenCalled();
  });

  it('renders canopy type select with options', async () => {
    render(<TrussCalculatorForm {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('Параметры навеса')).toBeInTheDocument();
    });
    expect(screen.getByText('Односкатная')).toBeInTheDocument();
    expect(screen.getByText('Двухскатная')).toBeInTheDocument();
    expect(screen.getByText('Арочная')).toBeInTheDocument();
  });
});
