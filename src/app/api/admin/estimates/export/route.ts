import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { estimatesService } from '@/services/admin/estimatesService';
import * as XLSX from 'xlsx';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const dateFrom = searchParams.get('dateFrom') || undefined;
    const dateTo = searchParams.get('dateTo') || undefined;
    const fenceTypeId = searchParams.get('fenceTypeId') || undefined;
    const minCost = searchParams.get('minCost') ? parseFloat(searchParams.get('minCost')!) : undefined;
    const maxCost = searchParams.get('maxCost') ? parseFloat(searchParams.get('maxCost')!) : undefined;
    const hasGate = searchParams.get('hasGate') ? searchParams.get('hasGate') === 'true' : undefined;
    const hasWicket = searchParams.get('hasWicket') ? searchParams.get('hasWicket') === 'true' : undefined;
    const deviceType = searchParams.get('deviceType') as 'desktop' | 'mobile' | null;
    const search = searchParams.get('search') || undefined;

    const estimates = await estimatesService.getEstimatesForExport({
      dateFrom,
      dateTo,
      fenceTypeId,
      minCost,
      maxCost,
      hasGate,
      hasWicket,
      deviceType: deviceType || undefined,
      search,
    });

    const data = estimates.map((e: any) => ({
      'ID': e.id.slice(0, 8),
      'Дата': new Date(e.createdAt).toLocaleDateString('ru-RU'),
      'Тип забора': e.fenceType?.name || '-',
      'Длина (м)': e.length,
      'Высота (м)': e.height,
      'Стоимость (₽)': e.grandTotal,
      'Ворота': e.hasGate ? 'Да' : 'Нет',
      'Калитка': e.hasWicket ? 'Да' : 'Нет',
      'Город': e.city || '-',
      'Устройство': e.deviceType === 'mobile' ? 'Мобильный' : 'Десктоп',
      'Пользователь': e.user?.name || 'Гость',
      'Email': e.user?.email || '-',
      'Телефон': e.user?.phone || '-',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Расчеты');

    const colWidths = [
      { wch: 10 },
      { wch: 12 },
      { wch: 15 },
      { wch: 10 },
      { wch: 10 },
      { wch: 15 },
      { wch: 8 },
      { wch: 8 },
      { wch: 15 },
      { wch: 12 },
      { wch: 15 },
      { wch: 20 },
      { wch: 15 },
    ];
    worksheet['!cols'] = colWidths;

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    const date = new Date().toISOString().split('T')[0];
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="estimates_${date}.xlsx"`,
      },
    });
  } catch (error) {
    console.error('[API] Error exporting estimates:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
