import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { trussProfileCreateSchema } from '@/lib/validators/trussCalculator';
import { ZodError } from 'zod';
import { safeErrorResponse } from '@/lib/api-error';

export const dynamic = 'force-dynamic';

function buildValidityWhere(validityFilter: string, now: Date) {
  switch (validityFilter) {
    case 'active':
      return {
        OR: [
          { expirationDate: null },
          { expirationDate: { gt: now } },
        ],
      };
    case 'expired':
      return { expirationDate: { not: null, lte: now } };
    case 'expiring_soon': {
      const soon = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      return {
        expirationDate: { not: null, gt: now, lte: soon },
      };
    }
    default:
      return {};
  }
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request, 'materials');
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const active = searchParams.get('active');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
    const search = searchParams.get('search') || '';
    const validityFilter = searchParams.get('validityFilter') || 'all';

    const where: any = {};
    if (category) where.category = category;
    if (active === null || active === '' || active === 'all') {
      // no isActive filter
    } else {
      where.isActive = active === 'true';
    }
    if (search) where.name = { contains: search, mode: 'insensitive' };

    const now = new Date();
    if (validityFilter !== 'all') {
      Object.assign(where, buildValidityWhere(validityFilter, now));
    }

    const [profiles, total] = await Promise.all([
      prisma.trussProfileType.findMany({
        where,
        orderBy: [{ priority: 'asc' }, { name: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.trussProfileType.count({ where }),
    ]);

    return NextResponse.json({ profiles, total, page, pageSize });
  } catch (error) {
    console.error('[TRUSS-PROFILES GET] Error:', error);
    return safeErrorResponse(error, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request, 'materials');
    if (authResult instanceof NextResponse) return authResult;
    if (authResult.session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = trussProfileCreateSchema.parse(body);

    const existing = await prisma.trussProfileType.findFirst({
      where: {
        category: parsed.category,
        sectionWidth: parsed.sectionWidth,
        sectionHeight: parsed.sectionHeight,
        wallThickness: parsed.wallThickness,
      },
    });
    if (existing) {
      return NextResponse.json({
        warning: {
          type: 'duplicate',
          message: 'Профиль с такими параметрами уже существует',
          duplicates: [{
            id: existing.id,
            name: existing.name,
            retailPricePerUnit: existing.retailPricePerUnit,
            validFrom: existing.validFrom,
            expirationDate: existing.expirationDate,
            active: existing.isActive,
          }],
        },
      }, { status: 200 });
    }

    const data: any = { ...parsed };
    if (data.validFrom) data.validFrom = new Date(data.validFrom);
    else delete data.validFrom;
    if (data.expirationDate) data.expirationDate = new Date(data.expirationDate);
    else delete data.expirationDate;

    const maxPriority = await prisma.trussProfileType.aggregate({
      where: { category: parsed.category },
      _max: { priority: true },
    });
    data.priority = (maxPriority._max.priority ?? -1) + 1;

    const profile = await prisma.trussProfileType.create({ data });
    return NextResponse.json({ id: profile.id }, { status: 201 });
  } catch (error: any) {
    if (error instanceof ZodError) {
      console.error('[TRUSS-PROFILES POST] Validation failed:', JSON.stringify(error.errors));
      return NextResponse.json({ error: error.errors.map((e: any) => ({
        path: e.path,
        message: e.message,
      })) }, { status: 400 });
    }
    console.error('[TRUSS-PROFILES POST] Error:', error);
    return safeErrorResponse(error, 500);
  }
}
