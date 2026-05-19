import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { positionCollector } from '@/services/seo/positionCollector';
import { seoChangeNotifier } from '@/services/seo/seoChangeNotifier';
import { safeErrorResponse } from '@/lib/api-error';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request, 'content');
    if (authResult instanceof NextResponse) return authResult;

    console.log('[Admin] Starting SEO position collection (batch session)...');
    const result = await positionCollector.startBatchSession();
    console.log(
      `[Admin] SEO position collection complete: checked=${result.checked}, errors=${result.errors}, batches=${result.completedBatches}/${result.totalBatches}`
    );

    if (result.completedBatches === result.totalBatches) {
      await seoChangeNotifier.sendReport(result);
      console.log('[Admin] SEO change report sent to Telegram');
    }

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('[Admin] SEO position collection error:', error);
    return safeErrorResponse(error, 500);
  }
}
