import { prisma } from '@/lib/prisma';
import { roundUp } from '@/lib/utils/roundUp';
import { cache } from '@/lib/cache';
import { CACHE_KEYS, CACHE_TTL } from '@/lib/cache-keys';

export interface Panel3DCalculationResult {
  category: 'panel3d';
  nomenclatureId: string;
  nomenclatureName: string;
  quantity: number;
  unit: 'шт';
  pricePerUnit: number;
  totalPrice: number;
}

export interface Panel3DCalculationError {
  error: 'NO_PANEL_3D_FOUND';
  message: string;
  details: {
    requiredHeight: number;
    requiredWidth: number;
    suggestion: string;
  };
}

async function getActivePanel3D() {
  return cache.getOrSet(
    CACHE_KEYS.PANEL_3D_ACTIVE,
    async () => {
      const now = new Date();
      return prisma.panel3D.findMany({
        where: {
          active: true,
          OR: [
            { validUntil: null },
            { validUntil: { gt: now } },
          ],
        },
        orderBy: [
          { priority: 'asc' },
          { panelHeight: 'asc' },
          { panelWidth: 'asc' },
        ],
      });
    },
    CACHE_TTL.REFERENCE_DATA
  );
}

export async function calculatePanel3D(
  fenceLengthM: number,
  fenceHeightM: number
): Promise<Panel3DCalculationResult> {
  const fenceHeightMm = Math.round(fenceHeightM * 1000);
  const fenceLengthMm = fenceLengthM * 1000;

  const panels = await getActivePanel3D();

  const matchingPanels = panels.filter(
    (p: any) => p.panelHeight >= fenceHeightMm
  );

  if (matchingPanels.length === 0) {
    const error: Panel3DCalculationError = {
      error: 'NO_PANEL_3D_FOUND',
      message: 'Не найдены 3D-панели подходящей высоты',
      details: {
        requiredHeight: fenceHeightMm,
        requiredWidth: fenceLengthMm,
        suggestion: 'Попробуйте выбрать меньшую высоту забора или свяжитесь с нами',
      },
    };
    throw error;
  }

  const selectedPanel = matchingPanels[0];
  const panelWidthMm = selectedPanel.panelWidth;

  const panelsCount = roundUp(fenceLengthMm / panelWidthMm) + 2;
  const pricePerUnit = selectedPanel.retailPricePerUnit;
  const totalPrice = panelsCount * pricePerUnit;

  return {
    category: 'panel3d',
    nomenclatureId: selectedPanel.id,
    nomenclatureName: selectedPanel.name,
    quantity: panelsCount,
    unit: 'шт',
    pricePerUnit,
    totalPrice,
  };
}

export async function findPanel3DByHeightAndWidth(
  heightMm: number,
  widthMm: number
): Promise<Panel3DCalculationResult | null> {
  const panels = await getActivePanel3D();

  const matchingPanel = panels.find(
    (p: any) => p.panelHeight === heightMm && p.panelWidth === widthMm
  );

  if (!matchingPanel) {
    return null;
  }

  return {
    category: 'panel3d',
    nomenclatureId: matchingPanel.id,
    nomenclatureName: matchingPanel.name,
    quantity: 1,
    unit: 'шт',
    pricePerUnit: matchingPanel.retailPricePerUnit,
    totalPrice: matchingPanel.retailPricePerUnit,
  };
}