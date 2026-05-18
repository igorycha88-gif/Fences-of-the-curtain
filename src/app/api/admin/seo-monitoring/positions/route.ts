import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { seoMonitoringService } from '@/services/admin/seoMonitoringService';
import { safeErrorResponse } from '@/lib/api-error';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request, 'content');
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(request.url);
    const result = await seoMonitoringService.getPositions({
      keywordId: searchParams.get('keywordId') || undefined,
      searchEngine: searchParams.get('searchEngine') || undefined,
      group: searchParams.get('group') || undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      page: parseInt(searchParams.get('page') || '1', 10),
      pageSize: parseInt(searchParams.get('pageSize') || '100', 10),
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching SEO positions:', error);
    return safeErrorResponse(error, 500);
  }
}
