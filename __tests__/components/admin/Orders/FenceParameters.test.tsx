import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { FenceParameters } from '@/components/admin/Orders/FenceParameters';

const defaultProps = {
  fenceType: { id: 'ft1', name: 'Профнастил' },
  fenceTypeName: 'Профнастил',
  length: 50,
  height: 2,
  lagRows: 3,
  coating: 'polyester',
  coatingLabel: 'Полиэстер',
  hasGate: false,
  gateType: null,
  gateTypeLabel: null,
  gateLength: null,
  gateNomenclatureName: null,
  hasWicket: false,
  wicketWidth: null,
  wicketNomenclatureName: null,
  city: null,
};

describe('FenceParameters', () => {
  it('renders fence type, length, and height', () => {
    render(<FenceParameters {...defaultProps} />);
    expect(screen.getByText('Профнастил')).toBeInTheDocument();
    expect(screen.getByText('50 м')).toBeInTheDocument();
    expect(screen.getByText('2 м')).toBeInTheDocument();
  });

  it('renders lag rows', () => {
    render(<FenceParameters {...defaultProps} />);
    expect(screen.getByText('3 ряда')).toBeInTheDocument();
  });

  it('renders coating when not mesh type', () => {
    render(<FenceParameters {...defaultProps} />);
    expect(screen.getByText('Полиэстер')).toBeInTheDocument();
  });

  it('hides coating for mesh type', () => {
    render(<FenceParameters {...defaultProps} fenceTypeName="Сетка-рабица" />);
    expect(screen.queryByText('Полиэстер')).not.toBeInTheDocument();
  });

  it('renders gate info when hasGate is true', () => {
    render(
      <FenceParameters
        {...defaultProps}
        hasGate={true}
        gateTypeLabel="Распашные"
        gateLength={4}
      />
    );
    expect(screen.getByText('Ворота')).toBeInTheDocument();
    expect(screen.getByText(/Распашные/)).toBeInTheDocument();
    expect(screen.getByText(/4 м/)).toBeInTheDocument();
  });

  it('renders wicket info when hasWicket is true', () => {
    render(
      <FenceParameters
        {...defaultProps}
        hasWicket={true}
        wicketWidth={1.2}
      />
    );
    expect(screen.getByText('Калитка')).toBeInTheDocument();
  });

  it('renders city when provided', () => {
    render(<FenceParameters {...defaultProps} city="Москва" />);
    expect(screen.getByText('Москва')).toBeInTheDocument();
  });

  it('does not render city when null', () => {
    render(<FenceParameters {...defaultProps} city={null} />);
    expect(screen.queryByText('Город')).not.toBeInTheDocument();
  });
});
