import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

jest.mock('lucide-react', () => ({
  X: () => <span data-testid="x-icon">X</span>,
  ArrowRight: () => <span data-testid="arrow-icon">→</span>,
}));

jest.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));

import { EstimateComparisonView } from '@/components/admin/Orders/EstimateComparisonView';

const sourceEstimate = {
  length: 30,
  height: 2,
  lagRows: 2,
  coating: 'POLYMER_SINGLE',
  coatingLabel: 'Полимер (односторонний)',
  hasGate: false,
  gateType: null,
  gateTypeLabel: null,
  gateLength: null,
  hasWicket: false,
  wicketWidth: null,
  items: [
    { nomenclatureId: 'post-1', nomenclatureName: 'Столб 60x60', quantity: 13, unit: 'шт', pricePerUnit: 1200, totalPrice: 15600 },
    { nomenclatureId: 'lag-1', nomenclatureName: 'Лага 40x20', quantity: 60, unit: 'м.п.', pricePerUnit: 300, totalPrice: 18000 },
  ],
  materialsTotal: 33600,
  installationTotal: 24000,
  grandTotal: 57600,
};

const adminEstimate = {
  length: 30,
  height: 2,
  lagRows: 2,
  coating: 'POLYMER_SINGLE',
  coatingLabel: 'Полимер (односторонний)',
  hasGate: false,
  gateType: null,
  gateTypeLabel: null,
  gateLength: null,
  hasWicket: false,
  wicketWidth: null,
  items: [
    { nomenclatureId: 'post-1', nomenclatureName: 'Столб 60x60', quantity: 15, unit: 'шт', pricePerUnit: 1200, totalPrice: 18000 },
    { nomenclatureId: 'lag-1', nomenclatureName: 'Лага 40x20', quantity: 60, unit: 'м.п.', pricePerUnit: 300, totalPrice: 18000 },
  ],
  materialsTotal: 36000,
  installationTotal: 24000,
  grandTotal: 60000,
  editedAt: '2026-01-15T10:00:00Z',
  editComment: 'Увеличено кол-во столбов',
  user: { name: 'Админ' },
};

describe('EstimateComparisonView', () => {
  const onClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render comparison view with items', () => {
    render(
      <EstimateComparisonView
        sourceEstimate={sourceEstimate}
        adminEstimate={adminEstimate}
        onClose={onClose}
      />
    );

    expect(screen.getByText('Столб 60x60')).toBeInTheDocument();
  });

  it('should call onClose when close button clicked', () => {
    render(
      <EstimateComparisonView
        sourceEstimate={sourceEstimate}
        adminEstimate={adminEstimate}
        onClose={onClose}
      />
    );

    const closeButtons = screen.getAllByRole('button');
    fireEvent.click(closeButtons[0]);

    expect(onClose).toHaveBeenCalled();
  });

  it('should render with no differences when items are same', () => {
    const same = {
      ...sourceEstimate,
      items: [
        { nomenclatureId: 'p1', nomenclatureName: 'Столб', quantity: 10, unit: 'шт', pricePerUnit: 1000, totalPrice: 10000 },
      ],
    };
    const adminSame = {
      ...adminEstimate,
      items: [
        { nomenclatureId: 'p1', nomenclatureName: 'Столб', quantity: 10, unit: 'шт', pricePerUnit: 1000, totalPrice: 10000 },
      ],
      editedAt: null,
      editComment: null,
      user: null,
    };

    render(
      <EstimateComparisonView
        sourceEstimate={same}
        adminEstimate={adminSame}
        onClose={onClose}
      />
    );

    expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
  });

  it('should show added items in admin estimate', () => {
    const sourceShort = {
      ...sourceEstimate,
      items: [
        { nomenclatureId: 'p1', nomenclatureName: 'Столб', quantity: 10, unit: 'шт', pricePerUnit: 1000, totalPrice: 10000 },
      ],
    };
    const adminWithExtra = {
      ...adminEstimate,
      items: [
        { nomenclatureId: 'p1', nomenclatureName: 'Столб', quantity: 10, unit: 'шт', pricePerUnit: 1000, totalPrice: 10000 },
        { nomenclatureId: 'g1', nomenclatureName: 'Ворота', quantity: 1, unit: 'шт', pricePerUnit: 15000, totalPrice: 15000 },
      ],
    };

    render(
      <EstimateComparisonView
        sourceEstimate={sourceShort}
        adminEstimate={adminWithExtra}
        onClose={onClose}
      />
    );

    expect(screen.getByText('Ворота')).toBeInTheDocument();
  });
});
