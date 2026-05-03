import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

type NomenclatureItem = {
  id: string;
  name: string;
  retailPrice: number;
  unit: string;
  category: string;
};

const VALID_CATEGORIES = [
  'posts',
  'lags',
  'profnastil',
  'panel3d',
  'picket',
  'mesh',
  'gates',
  'wickets',
  'automation',
  'mounting_hardware',
  'installation',
] as const;

type Category = (typeof VALID_CATEGORIES)[number];

async function searchPosts(search: string): Promise<NomenclatureItem[]> {
  const items = await prisma.postType.findMany({
    where: {
      active: true,
      ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
    },
    orderBy: { priority: 'desc' },
    take: 50,
  });
  return items.map((i) => ({ id: i.id, name: i.name, retailPrice: i.retailPricePerUnit, unit: 'шт', category: 'posts' }));
}

async function searchLags(search: string): Promise<NomenclatureItem[]> {
  const items = await prisma.lagType.findMany({
    where: {
      active: true,
      ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
    },
    orderBy: { priority: 'desc' },
    take: 50,
  });
  return items.map((i) => ({ id: i.id, name: i.name, retailPrice: i.retailPricePerUnit, unit: 'шт', category: 'lags' }));
}

async function searchProfnastil(search: string): Promise<NomenclatureItem[]> {
  const items = await prisma.profnastilType.findMany({
    where: {
      active: true,
      ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
    },
    orderBy: { priority: 'desc' },
    take: 50,
  });
  return items.map((i) => ({ id: i.id, name: i.name, retailPrice: i.retailPricePerUnit, unit: 'лист', category: 'profnastil' }));
}

async function searchPanel3d(search: string): Promise<NomenclatureItem[]> {
  const items = await prisma.panel3D.findMany({
    where: {
      active: true,
      ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
    },
    orderBy: { priority: 'desc' },
    take: 50,
  });
  return items.map((i) => ({ id: i.id, name: i.name, retailPrice: i.retailPricePerUnit, unit: 'шт', category: 'panel3d' }));
}

async function searchPicket(search: string): Promise<NomenclatureItem[]> {
  const items = await prisma.picketType.findMany({
    where: {
      active: true,
      ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
    },
    orderBy: { priority: 'desc' },
    take: 50,
  });
  return items.map((i) => ({ id: i.id, name: i.name, retailPrice: i.retailPricePerUnit, unit: 'шт', category: 'picket' }));
}

async function searchMesh(search: string): Promise<NomenclatureItem[]> {
  const items = await prisma.meshType.findMany({
    where: {
      active: true,
      ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
    },
    orderBy: { priority: 'desc' },
    take: 50,
  });
  return items.map((i) => ({ id: i.id, name: i.name, retailPrice: i.retailPricePerUnit, unit: 'шт', category: 'mesh' }));
}

async function searchGates(search: string): Promise<NomenclatureItem[]> {
  const items = await prisma.gateType.findMany({
    where: {
      active: true,
      ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
    },
    orderBy: { priority: 'desc' },
    take: 50,
  });
  return items.map((i) => ({ id: i.id, name: i.name, retailPrice: i.retailPrice, unit: 'шт', category: 'gates' }));
}

async function searchWickets(search: string): Promise<NomenclatureItem[]> {
  const items = await prisma.wicketType.findMany({
    where: {
      active: true,
      ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
    },
    orderBy: { priority: 'desc' },
    take: 50,
  });
  return items.map((i) => ({ id: i.id, name: i.name, retailPrice: i.retailPrice, unit: 'шт', category: 'wickets' }));
}

async function searchMountingHardware(search: string): Promise<NomenclatureItem[]> {
  const items = await prisma.mountingHardware.findMany({
    where: {
      active: true,
      ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
    },
    orderBy: { sortOrder: 'asc' },
    take: 50,
  });
  return items.map((i) => ({ id: i.id, name: i.name, retailPrice: i.retailPrice, unit: 'шт', category: 'mounting_hardware' }));
}

async function searchInstallation(search: string): Promise<NomenclatureItem[]> {
  const items = await prisma.work.findMany({
    where: {
      active: true,
      ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
    },
    orderBy: { sortOrder: 'asc' },
    take: 50,
  });
  return items.map((i) => ({ id: i.id, name: i.name, retailPrice: i.price, unit: i.unit, category: 'installation' }));
}

async function searchAutomation(search: string): Promise<NomenclatureItem[]> {
  const items = await prisma.automationType.findMany({
    where: {
      active: true,
      ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
    },
    orderBy: { priority: 'desc' },
    take: 50,
  });
  return items.map((i) => ({ id: i.id, name: i.name, retailPrice: i.retailPrice, unit: 'шт', category: 'automation' }));
}

const searchers: Record<Category, (search: string) => Promise<NomenclatureItem[]>> = {
  posts: searchPosts,
  lags: searchLags,
  profnastil: searchProfnastil,
  panel3d: searchPanel3d,
  picket: searchPicket,
  mesh: searchMesh,
  gates: searchGates,
  wickets: searchWickets,
  automation: searchAutomation,
  mounting_hardware: searchMountingHardware,
  installation: searchInstallation,
};

const categoryLabels: Record<Category, string> = {
  posts: 'Столбы',
  lags: 'Лаги',
  profnastil: 'Профнастил',
  panel3d: '3D-панели',
  picket: 'Евроштакетник',
  mesh: 'Сетка-рабица',
  gates: 'Ворота',
  wickets: 'Калитки',
  automation: 'Автоматика',
  mounting_hardware: 'Монтажная фурнитура',
  installation: 'Работы',
};

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAdmin(req, 'orders');
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') as Category | null;
    const search = searchParams.get('search')?.trim() || '';

    if (category && !VALID_CATEGORIES.includes(category)) {
      return NextResponse.json(
        { error: 'INVALID_CATEGORY', message: `Допустимые категории: ${VALID_CATEGORIES.join(', ')}` },
        { status: 400 },
      );
    }

    const categoriesToSearch = category ? [category] : [...VALID_CATEGORIES];
    const searchPromises = categoriesToSearch.map((cat) => searchers[cat](search));
    const results = await Promise.all(searchPromises);

    const grouped = categoriesToSearch.map((cat, idx) => ({
      category: cat,
      label: categoryLabels[cat],
      items: results[idx],
    }));

    return NextResponse.json({ categories: grouped });
  } catch (error) {
    console.error('[API] Error in GET /api/admin/nomenclature/search:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
