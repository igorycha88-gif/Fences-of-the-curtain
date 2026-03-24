import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions/rbac';

export const dynamic = 'force-dynamic';

const VALID_REFERENCE_TYPES = ['LAG', 'POST', 'PROFNASTIL', 'PICKET', 'GATE', 'WICKET', 'PANEL_3D'] as const;
type ReferenceType = typeof VALID_REFERENCE_TYPES[number];

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user.role as any, 'materials')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const referenceType = searchParams.get('referenceType') as ReferenceType | null;
    const referenceId = searchParams.get('referenceId');

    if (!referenceType || !referenceId) {
      return NextResponse.json(
        { error: 'Параметры referenceType и referenceId обязательны' },
        { status: 400 }
      );
    }

    if (!VALID_REFERENCE_TYPES.includes(referenceType)) {
      return NextResponse.json(
        { error: `Недопустимый referenceType. Допустимые значения: ${VALID_REFERENCE_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    const relations = await prisma.mountingHardwareRelation.findMany({
      where: {
        referenceType,
        referenceId,
      },
      include: {
        mountingHardware: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const items = relations
      .filter((rel) => rel.mountingHardware !== null)
      .map((rel) => ({
        id: rel.mountingHardware!.id,
        name: rel.mountingHardware!.name,
        description: rel.mountingHardware!.description,
        purchasePrice: rel.mountingHardware!.purchasePrice,
        retailPrice: rel.mountingHardware!.retailPrice,
        active: rel.mountingHardware!.active,
      }));

    return NextResponse.json({
      items,
      total: items.length,
    });
  } catch (error) {
    console.error('Error fetching related mounting hardware:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
