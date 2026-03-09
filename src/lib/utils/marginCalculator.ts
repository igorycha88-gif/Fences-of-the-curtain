export interface MarginResult {
  marginPercent: number;
  marginAbsolute: number;
}

export function calculateMargin(
  salePrice: number,
  purchasePrice: number | null | undefined
): MarginResult | null {
  if (purchasePrice === null || purchasePrice === undefined) {
    return null;
  }

  const marginAbsolute = salePrice - purchasePrice;
  const marginPercent = salePrice > 0 ? (marginAbsolute / salePrice) * 100 : 0;

  return {
    marginPercent: Math.round(marginPercent * 100) / 100,
    marginAbsolute: Math.round(marginAbsolute * 100) / 100,
  };
}

export function getMarginColor(marginPercent: number | null): string {
  if (marginPercent === null) {
    return 'gray';
  }

  if (marginPercent >= 30) {
    return 'green';
  }

  if (marginPercent >= 10) {
    return 'yellow';
  }

  return 'red';
}

export function getMarginEmoji(marginPercent: number | null): string {
  if (marginPercent === null) {
    return '⚪';
  }

  if (marginPercent >= 30) {
    return '🟢';
  }

  if (marginPercent >= 10) {
    return '🟡';
  }

  return '🔴';
}
