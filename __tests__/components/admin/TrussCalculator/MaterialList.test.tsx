import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MaterialList from '@/components/admin/TrussCalculator/MaterialList';

const mockMaterials = [
  { name: 'Столбы', profileName: '60x60x2', profileCategory: 'POST' as const, length: 3000, count: 6, totalLength: 18.0, weightPerMeter: 3.56, totalWeight: 64.1, pricePerMeter: 280, totalPrice: 5040 },
  { name: 'Нижний пояс', profileName: '40x40x2', profileCategory: 'CROSSBEAM' as const, length: 6000, count: 2, totalLength: 12.0, weightPerMeter: 2.31, totalWeight: 27.7, pricePerMeter: 200, totalPrice: 2400 },
];

const mockElementDetails = [
  { elementType: 'bottom_chord' as const, elementLabel: 'НП1', length: 5980, bottomCutAngle: 0, topCutAngle: 0, profileName: '40x40x2', profileThickness: '2 мм', quantity: 1 },
  { elementType: 'vertical' as const, elementLabel: 'В1', length: 500, bottomCutAngle: 90, topCutAngle: 75, profileName: '40x40x2', profileThickness: '2 мм', quantity: 2 },
];

const defaultProps = {
  materials: mockMaterials,
  totalWeight: 91.8,
  totalPrice: 7440,
  recommendations: [],
  elementDetails: mockElementDetails,
  canopyType: 'SINGLE_SLOPE' as const,
};

describe('MaterialList', () => {
  it('renders material specification table', () => {
    render(<MaterialList {...defaultProps} />);
    expect(screen.getByText('Спецификация материалов')).toBeInTheDocument();
    expect(screen.getByText('Столбы')).toBeInTheDocument();
    expect(screen.getByText('Нижний пояс')).toBeInTheDocument();
  });

  it('renders total weight and price', () => {
    render(<MaterialList {...defaultProps} />);
    expect(screen.getByText('ИТОГО')).toBeInTheDocument();
    expect(screen.getByText('91.8')).toBeInTheDocument();
    expect(screen.getByText('7 440')).toBeInTheDocument();
  });

  it('toggles element details section', () => {
    render(<MaterialList {...defaultProps} />);
    expect(screen.queryByText('Детализация элементов фермы')).toBeInTheDocument();
    expect(screen.queryByText('НП1')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Детализация элементов фермы'));
    expect(screen.getByText('НП1')).toBeInTheDocument();
  });

  it('renders recommendations when provided', () => {
    const recommendations = [{
      category: 'POST' as const,
      currentProfileName: '60x60x2',
      currentUtilization: 1.2,
      recommendedProfileId: 'p2',
      recommendedProfileName: '80x80x3',
      reason: 'Столбы перегружены',
    }];
    render(<MaterialList {...defaultProps} recommendations={recommendations} />);
    expect(screen.getByText('Рекомендации по профилям')).toBeInTheDocument();
    expect(screen.getByText(/Столбы перегружены/)).toBeInTheDocument();
  });

  it('shows total elements count when details expanded', () => {
    render(<MaterialList {...defaultProps} />);
    fireEvent.click(screen.getByText('Детализация элементов фермы'));
    expect(screen.getByText(/3/)).toBeInTheDocument();
  });
});
