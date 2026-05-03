import { prisma } from '@/lib/prisma';
import { cache } from '@/lib/cache';
import { CACHE_KEYS, CACHE_TTL } from '@/lib/cache-keys';

export interface AutomationLookupResult {
  id: string;
  name: string;
  retailPrice: number;
  description: string | null;
}

async function getActiveAutomation() {
  return cache.getOrSet(
    CACHE_KEYS.AUTOMATION_ACTIVE,
    async () => {
      const now = new Date();
      return prisma.automationType.findMany({
        where: {
          active: true,
          OR: [{ validFrom: null }, { validFrom: { lte: now } }],
          AND: {
            OR: [{ expirationDate: null }, { expirationDate: { gt: now } }],
          },
        },
        orderBy: [{ priority: 'asc' }, { name: 'asc' }],
      });
    },
    CACHE_TTL.REFERENCE_DATA
  );
}

export async function findAutomationById(
  automationId: string
): Promise<AutomationLookupResult> {
  const items = await getActiveAutomation();

  const found = items.find((item) => item.id === automationId);

  if (!found) {
    throw {
      error: 'NO_AUTOMATION_FOUND',
      message: 'Выбранная автоматика не найдена или недоступна',
    };
  }

  return {
    id: found.id,
    name: found.name,
    retailPrice: found.retailPrice,
    description: found.description,
  };
}

export async function getAllActiveAutomation(): Promise<AutomationLookupResult[]> {
  const items = await getActiveAutomation();

  return items.map((item) => ({
    id: item.id,
    name: item.name,
    retailPrice: item.retailPrice,
    description: item.description,
  }));
}
