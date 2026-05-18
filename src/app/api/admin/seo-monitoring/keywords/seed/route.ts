import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { seoMonitoringService } from '@/services/admin/seoMonitoringService';
import { safeErrorResponse } from '@/lib/api-error';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request, 'content');
    if (authResult instanceof NextResponse) return authResult;

    const result = await seoMonitoringService.seedFromConfig();

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error seeding SEO keywords:', error);
    return safeErrorResponse(error, 500);
  }
}
