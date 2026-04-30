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

  console.log('[findPanelByHeight] Required height:', requiredHeightMm, 'Rounded:', requiredHeightMmRounded);
  console.log('[findPanelByHeight] Available panels:', panels.map(p => ({ id: p.id, name: p.name, height: p.panelHeight, priority: p.priority })));

  if (panels.length === 0) {
    console.log('[findPanelByHeight] No panels available');
    return null;
  }

  const exactMatches = panels.filter(
    p => Math.round(p.panelHeight) === requiredHeightMmRounded
  );

  console.log('[findPanelByHeight] Exact matches count:', exactMatches.length);
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

    console.log('[findPanelByHeight] Selected exact match:', sortedByPriority[0]);
    return sortedByPriority[0];
  }

  const higherPanels = panels.filter(
    p => Math.round(p.panelHeight) >= requiredHeightMmRounded
  );

  console.log('[findPanelByHeight] Higher panels found:', higherPanels.length);

  if (higherPanels.length === 0) {
    console.log('[findPanelByHeight] No higher panels found');
    return null;
  }

  const sortedByHeight = higherPanels.sort((a, b) => {
    const aHeight = Math.round(a.panelHeight);
    const bHeight = Math.round(b.panelHeight);
    if (aHeight !== bHeight) {
      return aHeight - bHeight;
    }
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }
    return a.id.localeCompare(b.id);
  });

  console.log('[findPanelByHeight] Sorted higher panels:', sortedByHeight.map(p => ({ id: p.id, name: p.name, height: p.panelHeight, priority: p.priority })));

  return sortedByHeight[0];
}

export async function calculatePanel3D(
  fenceLengthM: number,
  fenceHeightM: number
): Promise<Panel3DCalculationResult> {
  const fenceHeightMm = Math.round(fenceHeightM * 1000);
  const fenceLengthMm = fenceLengthM * 1000;

  const selectedPanel = await findPanelByHeight(fenceHeightMm);

  if (!selectedPanel) {
    throw {
      error: 'NO_PANEL_3D_FOUND',
      message: 'Не найдена 3D-панель требуемой высоты',
      details: {
        requiredHeight: fenceHeightMm,
        requiredWidth: fenceLengthMm,
        suggestion: 'Попробуйте выбрать другую высоту забора или свяжитесь с нами',
      },
    } as Panel3DCalculationError;
  }

  const usefulWidth = selectedPanel.panelWidth;

  const panelsCount = roundUp(fenceLengthMm / usefulWidth) + 2;
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