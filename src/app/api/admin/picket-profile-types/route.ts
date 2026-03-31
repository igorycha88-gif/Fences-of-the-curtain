import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAdmin(req, 'materials');
    if (authResult instanceof NextResponse) return authResult;

    const profileTypes = await prisma.picketProfileType.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json(profileTypes);
  } catch (error) {
    console.error('Error fetching picket profile types:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
