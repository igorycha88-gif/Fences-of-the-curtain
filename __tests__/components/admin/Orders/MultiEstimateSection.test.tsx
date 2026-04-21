import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MultiEstimateSection } from '@/components/admin/Orders/MultiEstimateSection';

const baseEstimate = {
  id: 'est-1',
  fenceType: { id: 'ft-1', name: 'Профнастил' },
  length: 30,
  height: 2,
  lagRows: 2,
  coating: 'POLYMER_SINGLE',
  coatingLabel: 'Полимер (односторонний)',
  hasGate: false,
  gateType: null,
  gateTypeLabel: null,
  gateLength: null,
  gateNomenclatureName: null,
  hasWicket: false,
  wicketWidth: null,
  wicketNomenclatureName: null,
  city: null,
  items: [
    { category: 'posts', nomenclatureId: 'post-1', nomenclatureName: 'Столб 60x60', quantity: 13, unit: 'шт', pricePerUnit: 1200, totalPrice: 15600 },
    { category: 'installation', nomenclatureId: 'work-1', nomenclatureName: 'Монтаж', quantity: 30, unit: 'м.п.', pricePerUnit: 800, totalPrice: 24000 },
  ],
  materialsTotal: 15600,
  installationTotal: 24000,
  grandTotal: 39600,
  adminCorrection: null,
};

describe('MultiEstimateSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return null when estimates is empty', () => {
    const { container } = render(<MultiEstimateSection estimates={[]} />);
    expect(container.innerHTML).toBe('');
  });

  it('should render estimate cards', () => {
    render(<MultiEstimateSection estimates={[baseEstimate]} />);

    expect(screen.getByText('Итого по всем типам заборов')).toBeInTheDocument();
  });

  it('should render multiple estimate cards', () => {
    const secondEstimate = {
      ...baseEstimate,
      id: 'est-2',
      fenceType: { id: 'ft-2', name: 'Евроштакетник' },
      grandTotal: 50000,
    };

    render(<MultiEstimateSection estimates={[baseEstimate, secondEstimate]} />);

    expect(screen.getByText(/1\. Профнастил/)).toBeInTheDocument();
    expect(screen.getByText(/2\. Евроштакетник/)).toBeInTheDocument();
  });

  it('should show materials and works sections', () => {
    render(<MultiEstimateSection estimates={[baseEstimate]} />);

    const headings = screen.getAllByText('Материалы');
    expect(headings.length).toBeGreaterThan(0);
    const works = screen.getAllByText('Работы');
    expect(works.length).toBeGreaterThan(0);
  });

  it('should display items in tables', () => {
    render(<MultiEstimateSection estimates={[baseEstimate]} />);

    expect(screen.getByText('Столб 60x60')).toBeInTheDocument();
    expect(screen.getByText('Монтаж')).toBeInTheDocument();
  });

  it('should handle estimate with admin correction', () => {
    const correctedEstimate = {
      ...baseEstimate,
      adminCorrection: {
        id: 'corr-1',
        fenceType: { id: 'ft-1', name: 'Профнастил' },
        length: 30,
        height: 2,
        lagRows: 2,
        coating: 'POLYMER_SINGLE',
        coatingLabel: 'Полимер (односторонний)',
        hasGate: false,
        gateType: null,
        gateTypeLabel: null,
        gateLength: null,
        gateNomenclatureName: null,
        hasWicket: false,
        wicketWidth: null,
        wicketNomenclatureName: null,
        items: [
          { category: 'posts', nomenclatureId: 'post-1', nomenclatureName: 'Столб 60x60', quantity: 15, unit: 'шт', pricePerUnit: 1200, totalPrice: 18000 },
        ],
        materialsTotal: 18000,
        installationTotal: 0,
        grandTotal: 18000,
        editedAt: '2026-01-15T10:00:00Z',
        editComment: 'Увеличено количество',
        editedByAdmin: { id: 'admin-1', name: 'Админ', role: 'ADMIN' },
        manualQuantityOverrides: { 'post-1': { auto: 13, manual: 15 } },
      },
    };

    render(<MultiEstimateSection estimates={[correctedEstimate]} />);

    expect(screen.getByText('Скорректированная смета')).toBeInTheDocument();
    expect(screen.getByText('Исходная смета')).toBeInTheDocument();
  });

  it('should show fallback message for fallback estimates', () => {
    const fallbackEstimate = {
      ...baseEstimate,
      id: 'fallback-ft-1',
      items: [],
    };

    render(<MultiEstimateSection estimates={[fallbackEstimate]} />);

    expect(screen.getByText('Детали сметы недоступны')).toBeInTheDocument();
  });

  it('should show margin info when showPurchasePrices is true', () => {
    const estimateWithMargin = {
      ...baseEstimate,
      purchaseTotal: 10000,
      materialMarginRub: 5600,
      materialMarginPercent: 35.9,
    };

    render(
      <MultiEstimateSection
        estimates={[estimateWithMargin]}
        showPurchasePrices={true}
      />
    );

    expect(screen.getByText('Маржа (материалы)')).toBeInTheDocument();
  });

  it('should call onEditEstimate callback', () => {
    const onEdit = jest.fn();
    render(
      <MultiEstimateSection
        estimates={[baseEstimate]}
        onEditEstimate={onEdit}
      />
    );

    const editBtn = screen.getByTitle('Редактировать');
    fireEvent.click(editBtn);

    expect(onEdit).toHaveBeenCalledWith('est-1');
  });
});
