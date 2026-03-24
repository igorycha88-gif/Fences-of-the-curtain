import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions/rbac';
import { workService } from '@/services/admin/workService';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user.role as any, 'materials')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const result = await workService.getReferenceOptions();

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching reference options:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
