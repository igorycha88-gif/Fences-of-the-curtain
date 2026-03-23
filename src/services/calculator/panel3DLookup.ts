import { prisma } from '@/lib/prisma';
import { cache } from '@/lib/cache';
import { CACHE_KEYS, CACHE_TTL } from '@/lib/cache-keys';

export interface Panel3DLookupResult {
  id: string;
  name: string;
  panelHeight: number;
  panelWidth: number;
  rodDiameter: number;
  cellWidth: number;
  cellHeight: number;
  retailPricePerUnit: number;
}

export interface Panel3DLookupError {
  error: string;
  message: string;
  details?: Record<string, unknown>;
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

export async function findPanel3DByHeight(
  requiredHeightMm: number
): Promise<Panel3DLookupResult> {
  console.log('[panel3DLookup] Searching for panel3D:', { requiredHeightMm });

  const panels = await getActivePanel3D();

  console.log('[panel3DLookup] Found panels from cache:', panels.map(p => ({ name: p.name, panelHeight: p.panelHeight, panelWidth: p.panelWidth, retailPricePerUnit: p.retailPricePerUnit })));

  const matchingPanels = panels.filter((p) => p.panelHeight >= requiredHeightMm);

  console.log('[panel3DLookup] Matching panels (panelHeight >= requiredHeightMm):', matchingPanels.map(p => ({ name: p.name, panelHeight: p.panelHeight })));

  if (matchingPanels.length === 0) {
    throw {
      error: 'NO_PANEL_3D_FOUND',
      message: 'Не найдены 3D-панели подходящей высоты',
      details: {
        requiredHeight: requiredHeightMm,
        suggestion: 'Попробуйте выбрать меньшую высоту забора или свяжитесь с нами',
      },
    } as Panel3DLookupError;
  }

  const selectedPanel = matchingPanels[0];

  console.log('[panel3DLookup] Selected panel3D:', { name: selectedPanel.name, panelHeight: selectedPanel.panelHeight, panelWidth: selectedPanel.panelWidth });

  return {
    id: selectedPanel.id,
    name: selectedPanel.name,
    panelHeight: selectedPanel.panelHeight,
    panelWidth: selectedPanel.panelWidth,
    rodDiameter: selectedPanel.rodDiameter,
    cellWidth: selectedPanel.cellWidth,
    cellHeight: selectedPanel.cellHeight,
    retailPricePerUnit: selectedPanel.retailPricePerUnit,
  };
}