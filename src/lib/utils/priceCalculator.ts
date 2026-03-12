export function calculatePricePerUnit(
  usefulWidthMm: number,
  lengthMm: number,
  pricePerMeter: number | null | undefined
): number | null {
  if (pricePerMeter === null || pricePerMeter === undefined) {
    return null;
  }

  const widthInMeters = usefulWidthMm / 1000;
  const lengthInMeters = lengthMm / 1000;
  
  const price = widthInMeters * lengthInMeters * pricePerMeter;
  
  return Math.round(price * 100) / 100;
}

export function calculateProfnastilMargin(
  retailPricePerMeter: number,
  purchasePricePerMeter: number | null | undefined,
  usefulWidthMm: number,
  lengthMm: number
): {
  marginPerMeterPercent: number | null;
  marginPerMeterAbsolute: number | null;
  marginPerUnitPercent: number | null;
  marginPerUnitAbsolute: number | null;
} {
  if (purchasePricePerMeter === null || purchasePricePerMeter === undefined) {
    return {
      marginPerMeterPercent: null,
      marginPerMeterAbsolute: null,
      marginPerUnitPercent: null,
      marginPerUnitAbsolute: null,
    };
  }

  const marginPerMeterAbsolute = retailPricePerMeter - purchasePricePerMeter;
  const marginPerMeterPercent = retailPricePerMeter > 0 
    ? (marginPerMeterAbsolute / retailPricePerMeter) * 100 
    : 0;

  const purchasePricePerUnit = calculatePricePerUnit(usefulWidthMm, lengthMm, purchasePricePerMeter);
  const retailPricePerUnit = calculatePricePerUnit(usefulWidthMm, lengthMm, retailPricePerMeter);

  const marginPerUnitAbsolute = retailPricePerUnit !== null && purchasePricePerUnit !== null
    ? retailPricePerUnit - purchasePricePerUnit
    : null;
  const marginPerUnitPercent = retailPricePerUnit !== null && retailPricePerUnit > 0 && marginPerUnitAbsolute !== null
    ? (marginPerUnitAbsolute / retailPricePerUnit) * 100
    : null;

  return {
    marginPerMeterPercent: marginPerMeterPercent !== null ? Math.round(marginPerMeterPercent * 100) / 100 : null,
    marginPerMeterAbsolute: marginPerMeterAbsolute !== null ? Math.round(marginPerMeterAbsolute * 100) / 100 : null,
    marginPerUnitPercent: marginPerUnitPercent !== null ? Math.round(marginPerUnitPercent * 100) / 100 : null,
    marginPerUnitAbsolute: marginPerUnitAbsolute !== null ? Math.round(marginPerUnitAbsolute * 100) / 100 : null,
  };
}

export function calculatePicketMargin(
  retailPricePerMeter: number,
  purchasePricePerMeter: number | null | undefined,
  widthMm: number,
  lengthMm: number
): {
  marginPerMeterPercent: number | null;
  marginPerMeterAbsolute: number | null;
  marginPerUnitPercent: number | null;
  marginPerUnitAbsolute: number | null;
} {
  if (purchasePricePerMeter === null || purchasePricePerMeter === undefined) {
    return {
      marginPerMeterPercent: null,
      marginPerMeterAbsolute: null,
      marginPerUnitPercent: null,
      marginPerUnitAbsolute: null,
    };
  }

  const marginPerMeterAbsolute = retailPricePerMeter - purchasePricePerMeter;
  const marginPerMeterPercent = retailPricePerMeter > 0 
    ? (marginPerMeterAbsolute / retailPricePerMeter) * 100 
    : 0;

  const purchasePricePerUnit = calculatePricePerUnit(widthMm, lengthMm, purchasePricePerMeter);
  const retailPricePerUnit = calculatePricePerUnit(widthMm, lengthMm, retailPricePerMeter);

  const marginPerUnitAbsolute = retailPricePerUnit !== null && purchasePricePerUnit !== null
    ? retailPricePerUnit - purchasePricePerUnit
    : null;
  const marginPerUnitPercent = retailPricePerUnit !== null && retailPricePerUnit > 0 && marginPerUnitAbsolute !== null
    ? (marginPerUnitAbsolute / retailPricePerUnit) * 100
    : null;

  return {
    marginPerMeterPercent: marginPerMeterPercent !== null ? Math.round(marginPerMeterPercent * 100) / 100 : null,
    marginPerMeterAbsolute: marginPerMeterAbsolute !== null ? Math.round(marginPerMeterAbsolute * 100) / 100 : null,
    marginPerUnitPercent: marginPerUnitPercent !== null ? Math.round(marginPerUnitPercent * 100) / 100 : null,
    marginPerUnitAbsolute: marginPerUnitAbsolute !== null ? Math.round(marginPerUnitAbsolute * 100) / 100 : null,
  };
}
