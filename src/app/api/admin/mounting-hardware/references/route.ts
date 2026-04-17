import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { mountingHardwareService } from '@/services/admin/mountingHardwareService';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request, 'materials');
    if (authResult instanceof NextResponse) return authResult;

    const referenceOptions = await mountingHardwareService.getReferenceOptions();

    const referenceTypes = [
      { value: 'LAG', label: 'Лаги' },
      { value: 'POST', label: 'Столбы' },
      { value: 'PROFNASTIL', label: 'Профнастил' },
      { value: 'PICKET', label: 'Евроштакетник' },
      { value: 'GATE', label: 'Ворота' },
      { value: 'WICKET', label: 'Калитки' },
      { value: 'PANEL_3D', label: '3D-панели' },
      { value: 'MESH', label: 'Сетка-рабица' },
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
