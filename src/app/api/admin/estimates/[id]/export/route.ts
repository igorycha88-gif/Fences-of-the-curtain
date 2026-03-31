import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/admin-auth';
import { estimatesService } from '@/services/admin/estimatesService';
import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';

export const dynamic = 'force-dynamic';

const categoryLabels: Record<string, string> = {
  posts: 'Столбы',
  lags: 'Лаги',
  profnastil: 'Профнастил',
  picket: 'Евроштакетник',
  gates: 'Ворота',
  wickets: 'Калитки',
  mountingHardware: 'Монтажная фурнитура',
  mounting_hardware: 'Монтажная фурнитура',
  installation: 'Работы',
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;
    const { session } = authResult;

    const userEmail = session.email;
    if (!userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { role: true },
    });

    const isAdmin = user?.role === 'ADMIN';
    const { id } = await params;

    const estimate = await estimatesService.getEstimateByIdWithMargin(id, isAdmin);

    if (!estimate) {
      return NextResponse.json({ error: 'Estimate not found' }, { status: 404 });
    }

    const items = estimate.items;
    const summary = estimate.summary;

    let data: Record<string, string | number>[];

    if (isAdmin && summary) {
      data = items.map((item, index) => ({
        '№': index + 1,
        'Категория': categoryLabels[item.category] || item.category,
        'Наименование': item.nomenclatureName,
        'Ед. изм.': item.unit,
        'Кол-во': item.quantity,
        'Цена розн. за ед.': item.pricePerUnit,
        'Сумма розн.': item.totalPrice,
        'Цена закуп. за ед.': item.purchasePricePerUnit ?? '—',
        'Сумма закуп.': item.purchaseTotal ?? '—',
        'Маржа (₽)': item.marginRub ?? '—',
        'Маржа (%)': item.marginPercent !== null && item.marginPercent !== undefined 
          ? item.marginPercent.toFixed(2) + '%' 
          : '—',
      }));

      data.push({
        '№': '',
        'Категория': '',
        'Наименование': '',
        'Ед. изм.': '',
        'Кол-во': '',
        'Цена розн. за ед.': '',
        'Сумма розн.': 'ИТОГО:',
        'Цена закуп. за ед.': '',
        'Сумма закуп.': summary.purchaseTotal,
        'Маржа (₽)': summary.marginTotalRub,
        'Маржа (%)': summary.marginTotalPercent.toFixed(2) + '%',
      });
    } else {
      data = items.map((item, index) => ({
        '№': index + 1,
        'Категория': categoryLabels[item.category] || item.category,
        'Наименование': item.nomenclatureName,
        'Ед. изм.': item.unit,
        'Кол-во': item.quantity,
        'Сумма': item.totalPrice,
      }));

      data.push({
        '№': '',
        'Категория': '',
        'Наименование': '',
        'Ед. изм.': '',
        'Кол-во': '',
        'Сумма': estimate.grandTotal,
      });
    }

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Смета');

    const colWidths = isAdmin && summary
      ? [
          { wch: 5 },
          { wch: 20 },
          { wch: 40 },
          { wch: 10 },
          { wch: 10 },
          { wch: 15 },
          { wch: 15 },
          { wch: 15 },
          { wch: 15 },
          { wch: 15 },
          { wch: 12 },
        ]
      : [
          { wch: 5 },
          { wch: 20 },
          { wch: 40 },
          { wch: 10 },
          { wch: 10 },
          { wch: 15 },
        ];
    worksheet['!cols'] = colWidths;

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="estimate_${id.slice(0, 8)}.xlsx"`,
      },
    });
  } catch (error) {
    console.error('[API] Error exporting estimate:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
