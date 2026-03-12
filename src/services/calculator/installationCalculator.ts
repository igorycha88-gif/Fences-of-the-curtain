export interface InstallationCalculationResult {
  category: 'installation';
  nomenclatureId: null;
  nomenclatureName: string;
  quantity: number;
  unit: 'м.п.';
  pricePerUnit: number;
  totalPrice: number;
}

const INSTALLATION_PRICE_PER_METER = 1200;

export function calculateInstallation(
  fenceLengthM: number
): InstallationCalculationResult {
  const totalPrice = fenceLengthM * INSTALLATION_PRICE_PER_METER;

  return {
    category: 'installation',
    nomenclatureId: null,
    nomenclatureName: 'Монтаж забора',
    quantity: fenceLengthM,
    unit: 'м.п.',
    pricePerUnit: INSTALLATION_PRICE_PER_METER,
    totalPrice,
  };
}
