import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import LoadReport from '@/components/admin/TrussCalculator/LoadReport';

const mockLoads = {
  snowLoadNormative: 128.6,
  snowLoadDesign: 180.0,
  windLoadNormative: 8.6,
  windLoadDesign: 12.0,
  deadLoadNormative: 15.0,
  deadLoadDesign: 16.5,
  totalLoadNormative: 152.1,
  totalLoadDesign: 208.5,
  loadPerTruss: 1251.0,
  loadPerMeter: 208.5,
  slopeAngle: 15.0,
  snowCoeffMu: 1.0,
  windCoeffC: 0.8,
  windHeightCoeff: 1.0,
};

const defaultProps = {
  loads: mockLoads,
  safetyFactor: 1.85,
  allPassed: true,
};

describe('LoadReport', () => {
  it('renders load table with all load types', () => {
    render(<LoadReport {...defaultProps} />);
    expect(screen.getByText('Расчёт нагрузок')).toBeInTheDocument();
    expect(screen.getByText('Снеговая (район III)')).toBeInTheDocument();
    expect(screen.getByText('Ветровая (район I)')).toBeInTheDocument();
    expect(screen.getByText('Собственный вес')).toBeInTheDocument();
    expect(screen.getByText('ИТОГО')).toBeInTheDocument();
  });

  it('renders safety factor with checkmark when passed', () => {
    render(<LoadReport {...defaultProps} allPassed={true} />);
    expect(screen.getByText(/1.85/)).toBeInTheDocument();
    expect(screen.getByText(/✓/)).toBeInTheDocument();
  });

  it('renders safety factor with cross when failed', () => {
    render(<LoadReport {...defaultProps} allPassed={false} />);
    expect(screen.getByText(/✗/)).toBeInTheDocument();
  });

  it('renders load per truss value', () => {
    render(<LoadReport {...defaultProps} />);
    expect(screen.getByText(/1251\.0 кг/)).toBeInTheDocument();
  });

  it('renders normative and design values', () => {
    render(<LoadReport {...defaultProps} />);
    expect(screen.getByText('180.0')).toBeInTheDocument();
    expect(screen.getByText('12.0')).toBeInTheDocument();
  });
});
