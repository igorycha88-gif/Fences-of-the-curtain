import { prisma } from '@/lib/prisma';

export interface MarginResult {
  marginPercent: number;
  marginAbsolute: number;
}

export interface EstimateItem {
  category: string;
  nomenclatureId: string;
  nomenclatureName: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  totalPrice: number;
}

export interface ExtendedEstimateItem extends EstimateItem {
  article?: string;
  purchasePricePerUnit?: number | null;
  purchaseTotal?: number | null;
  marginRub?: number | null;
  marginPercent?: number | null;
  vatRate?: number | null;
}

export interface EstimateSummary {
  retailTotal: number;
  purchaseTotal: number;
  marginTotalRub: number;
  marginTotalPercent: number;
  retailMaterialsTotal: number;
  purchaseMaterialsTotal: number;
  materialMarginRub: number;
  materialMarginPercent: number;
  worksTotal: number;
  grandTotal: number;
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

export function roundToTwo(num: number): number {
  return Math.round(num * 100) / 100;
}

export async function getPurchasePrice(
  category: string,
  nomenclatureId: string
): Promise<number | null> {
  console.log('[marginCalculator] getPurchasePrice called:', { category, nomenclatureId });
  
  switch (category) {
    case 'posts':
    case 'Столбы': {
      const item = await prisma.postType.findUnique({
        where: { id: nomenclatureId },
        select: { purchasePricePerUnit: true },
      });
      console.log('[marginCalculator] posts lookup result:', item);
      return item?.purchasePricePerUnit ?? null;
    }
    case 'lags':
    case 'Лаги': {
      const item = await prisma.lagType.findUnique({
        where: { id: nomenclatureId },
        select: { purchasePricePerUnit: true },
      });
      console.log('[marginCalculator] lags lookup result:', item);
      return item?.purchasePricePerUnit ?? null;
    }
    case 'profnastil':
    case 'Профнастил': {
      const item = await prisma.profnastilType.findUnique({
        where: { id: nomenclatureId },
        select: { purchasePricePerUnit: true },
      });
      console.log('[marginCalculator] profnastil lookup result:', item);
      return item?.purchasePricePerUnit ?? null;
    }
    case 'picket':
    case 'Евроштакетник': {
      const item = await prisma.picketType.findUnique({
        where: { id: nomenclatureId },
        select: { purchasePricePerMeter: true },
      });
      console.log('[marginCalculator] picket lookup result:', item);
      return item?.purchasePricePerMeter ?? null;
    }
    case 'gates':
    case 'Ворота': {
      const item = await prisma.gateType.findUnique({
        where: { id: nomenclatureId },
        select: { purchasePrice: true },
      });
      console.log('[marginCalculator] gates lookup result:', item);
      return item?.purchasePrice ?? null;
    }
    case 'wickets':
    case 'Калитки': {
      const item = await prisma.wicketType.findUnique({
        where: { id: nomenclatureId },
        select: { purchasePrice: true },
      });
      console.log('[marginCalculator] wickets lookup result:', item);
      return item?.purchasePrice ?? null;
    }
    case 'mountingHardware':
    case 'mounting_hardware':
    case 'Монтажная фурнитура': {
      const item = await prisma.mountingHardware.findUnique({
        where: { id: nomenclatureId },
        select: { purchasePrice: true },
      });
      console.log('[marginCalculator] mountingHardware lookup result:', item);
      return item?.purchasePrice ?? null;
    }
    default:
      console.log('[marginCalculator] Unknown category:', category);
      return null;
  }
}

export async function calculateExtendedItems(
  items: EstimateItem[]
): Promise<ExtendedEstimateItem[]> {
  const extendedItems: ExtendedEstimateItem[] = [];

  for (const item of items) {
    const purchasePricePerUnit = await getPurchasePrice(
      item.category,
      item.nomenclatureId
    );

    if (purchasePricePerUnit !== null) {
      const purchaseTotal = roundToTwo(purchasePricePerUnit * item.quantity);
      const marginRub = roundToTwo(item.totalPrice - purchaseTotal);
      const marginPercent =
        item.totalPrice > 0
          ? roundToTwo((marginRub / item.totalPrice) * 100)
          : 0;

      extendedItems.push({
        ...item,
        purchasePricePerUnit,
        purchaseTotal,
        marginRub,
        marginPercent,
        vatRate: null,
      });
    } else {
      extendedItems.push({
        ...item,
        purchasePricePerUnit: null,
        purchaseTotal: null,
        marginRub: null,
        marginPercent: null,
        vatRate: null,
      });
    }
  }

  return extendedItems;
}

export function calculateSummary(items: ExtendedEstimateItem[]): EstimateSummary {
  const materialItems = items.filter(item => item.category !== 'installation');
  const workItems = items.filter(item => item.category === 'installation');
  
  const retailTotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const purchaseTotal = items.reduce(
    (sum, item) => sum + (item.purchaseTotal ?? 0),
    0
  );
  const marginTotalRub = items.reduce(
    (sum, item) => sum + (item.marginRub ?? 0),
    0
  );
  const marginTotalPercent =
    retailTotal > 0 ? roundToTwo((marginTotalRub / retailTotal) * 100) : 0;

  const retailMaterialsTotal = materialItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const purchaseMaterialsTotal = materialItems.reduce(
    (sum, item) => sum + (item.purchaseTotal ?? 0),
    0
  );
  const materialMarginRub = roundToTwo(retailMaterialsTotal - purchaseMaterialsTotal);
  const materialMarginPercent =
    retailMaterialsTotal > 0 ? roundToTwo((materialMarginRub / retailMaterialsTotal) * 100) : 0;
  const worksTotal = workItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const grandTotal = roundToTwo(retailMaterialsTotal + worksTotal);

  return {
    retailTotal: roundToTwo(retailTotal),
    purchaseTotal: roundToTwo(purchaseTotal),
    marginTotalRub: roundToTwo(marginTotalRub),
    marginTotalPercent,
    retailMaterialsTotal: roundToTwo(retailMaterialsTotal),
    purchaseMaterialsTotal: roundToTwo(purchaseMaterialsTotal),
    materialMarginRub,
    materialMarginPercent,
    worksTotal: roundToTwo(worksTotal),
    grandTotal,
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
