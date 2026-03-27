import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions/rbac';
import { fenceTypeCalculatorService } from '@/services/calculator/fenceTypeCalculatorService';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user.role as import('@prisma/client').Role, 'settings')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await fenceTypeCalculatorService.invalidateCache();
    return NextResponse.json({ success: true, message: 'Cache invalidated' });
  } catch (error) {
    console.error('Error invalidating cache:', error);
    return NextResponse.json({ success: false, error: 'Failed to invalidate cache' }, { status: 500 });
  }
}