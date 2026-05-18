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
    const result = await seoMonitoringService.getSummary(
      searchParams.get('searchEngine') || undefined
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching SEO summary:', error);
    return safeErrorResponse(error, 500);
  }
}
