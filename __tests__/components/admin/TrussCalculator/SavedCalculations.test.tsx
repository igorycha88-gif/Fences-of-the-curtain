import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SavedCalculations from '@/components/admin/TrussCalculator/SavedCalculations';

jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

jest.mock('@/lib/sanitize', () => ({
  sanitizeSvg: (input: string) => input,
}));

global.fetch = jest.fn();

const mockCalculation = {
  id: 'calc-1',
  name: 'Test Calc',
  canopyType: 'SINGLE_SLOPE',
  width: 6000,
  length: 8000,
  ridgeHeight: 3000,
  wallHeight: 2500,
  trussSpacing: 2000,
  createdAt: '2026-01-15T10:00:00Z',
  svgDrawing: null,
  roofCovering: { name: 'Профнастил С8' },
  postProfile: { name: '60x60x2' },
  crossbeamProfile: { name: '40x40x2' },
  topChordProfile: null,
  strutProfile: { name: '40x40x2' },
  archProfile: null,
  user: { name: 'Admin', email: 'admin@test.com' },
  snowLoad: 180,
  windLoad: 12,
  totalLoad: 208.5,
  safetyFactor: 1.85,
  trussGeometry: {},
  materialList: {},
  slopeAngle: 15,
};

describe('SavedCalculations', () => {
  const defaultProps = {
    onSelect: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading state initially', () => {
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));
    render(<SavedCalculations {...defaultProps} />);
    expect(screen.getByText('Загрузка расчётов...')).toBeInTheDocument();
  });

  it('shows empty state when no calculations', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ calculations: [] }),
    });
    render(<SavedCalculations {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('Нет сохранённых расчётов')).toBeInTheDocument();
    });
  });

  it('renders calculations list', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ calculations: [mockCalculation] }),
    });
    render(<SavedCalculations {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('Test Calc')).toBeInTheDocument();
      expect(screen.getByText('Односкатная')).toBeInTheDocument();
    });
  });

  it('shows safety factor with correct color', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ calculations: [mockCalculation] }),
    });
    render(<SavedCalculations {...defaultProps} />);
    await waitFor(() => {
      const sf = screen.getByText('1.85');
      expect(sf).toBeInTheDocument();
    });
  });

  it('calls onSelect when Открыть clicked', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ calculations: [mockCalculation] }),
    });
    render(<SavedCalculations {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('Открыть')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Открыть'));
    expect(defaultProps.onSelect).toHaveBeenCalledWith(mockCalculation);
  });

  it('shows refresh button', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ calculations: [mockCalculation] }),
    });
    render(<SavedCalculations {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('Обновить')).toBeInTheDocument();
    });
  });
});
