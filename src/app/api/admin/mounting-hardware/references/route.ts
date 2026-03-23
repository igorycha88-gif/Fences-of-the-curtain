import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { mountingHardwareService } from '@/services/admin/mountingHardwareService';
import { hasPermission } from '@/lib/permissions/rbac';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !hasPermission(session.user.role as any, 'materials')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const referenceOptions = await mountingHardwareService.getReferenceOptions();

    const referenceTypes = [
      { value: 'LAG', label: 'Лаги' },
      { value: 'POST', label: 'Столбы' },
      { value: 'PROFNASTIL', label: 'Профнастил' },
      { value: 'PICKET', label: 'Евроштакетник' },
      { value: 'GATE', label: 'Ворота' },
      { value: 'WICKET', label: 'Калитки' },
    ];

    return NextResponse.json({
      referenceTypes,
      options: referenceOptions,
    });
  } catch (error) {
    console.error('Error fetching reference options:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
