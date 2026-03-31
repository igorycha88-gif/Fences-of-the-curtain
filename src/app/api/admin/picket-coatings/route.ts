import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAdmin(req, 'materials');
    if (authResult instanceof NextResponse) return authResult;

    const coatings = await prisma.picketCoating.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json(coatings);
  } catch (error) {
    console.error('Error fetching picket coatings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
