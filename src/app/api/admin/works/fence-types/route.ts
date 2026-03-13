import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { workService } from '@/services/admin/workService';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const fenceTypes = await workService.getFenceTypes();

    return NextResponse.json(fenceTypes);
  } catch (error) {
    console.error('Error fetching fence types:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
