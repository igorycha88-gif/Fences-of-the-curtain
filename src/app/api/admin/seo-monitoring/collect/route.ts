import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { positionCollector } from '@/services/seo/positionCollector';
import { safeErrorResponse } from '@/lib/api-error';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request, 'content');
    if (authResult instanceof NextResponse) return authResult;

    console.log('[Admin] Starting SEO position collection...');
    const result = await positionCollector.collectAll();
    console.log(
      `[Admin] SEO position collection complete: checked=${result.checked}, errors=${result.errors}, skipped=${result.skipped}`
    );

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('[Admin] SEO position collection error:', error);
    return safeErrorResponse(error, 500);
  }
}
