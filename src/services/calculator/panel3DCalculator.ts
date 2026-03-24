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
  panelHeight: number;
  panelWidth: number;
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
        ],
      });
    },
    CACHE_TTL.REFERENCE_DATA
  );
}

async function findPanelByHeight(requiredHeightMm: number) {
  const panels = await getActivePanel3D();

  const requiredHeightMmRounded = Math.round(requiredHeightMm);

  const exactMatches = panels.filter(
    p => Math.round(p.panelHeight) === requiredHeightMmRounded
  );

  if (exactMatches.length > 0) {
    const sortedByPriority = exactMatches.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      if (a.panelHeight !== b.panelHeight) {
        return Math.round(a.panelHeight) - Math.round(b.panelHeight);
      }
      return a.id.localeCompare(b.id);
    });

    return sortedByPriority[0];
  }

  const higherPanels = panels.filter(
    p => Math.round(p.panelHeight) > requiredHeightMmRounded
  );

  if (higherPanels.length === 0) {
    const error: Panel3DCalculationError = {
      error: 'NO_PANEL_3D_FOUND',
      message: 'Не найдена 3D-панель требуемой высоты',
      details: {
        requiredHeight: requiredHeightMmRounded,
        requiredWidth: 0,
        suggestion: 'Попробуйте выбрать другую высоту забора или свяжитесь с нами',
      },
    };
    throw error;
  }

  const sortedByPriority = higherPanels.sort((a, b) => {
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }
    if (Math.round(a.panelHeight) !== Math.round(b.panelHeight)) {
      return Math.round(a.panelHeight) - Math.round(b.panelHeight);
    }
    return a.id.localeCompare(b.id);
  });

  return sortedByPriority[0];
}

export async function calculatePanel3D(
  fenceLengthM: number,
  fenceHeightM: number
): Promise<Panel3DCalculationResult> {
  const fenceHeightMm = Math.round(fenceHeightM * 1000);
  const fenceLengthMm = fenceLengthM * 1000;

  const selectedPanel = await findPanelByHeight(fenceHeightMm);
  const usefulWidth = selectedPanel.panelWidth;

  const panelsCount = roundUp(fenceLengthMm / usefulWidth);
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
    panelHeight: selectedPanel.panelHeight,
    panelWidth: selectedPanel.panelWidth,
  };
}