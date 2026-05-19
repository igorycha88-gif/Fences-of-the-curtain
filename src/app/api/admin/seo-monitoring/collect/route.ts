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

    const existing = await positionCollector.getSessionStatus();
    if (existing && existing.completedBatches < existing.totalBatches) {
      return NextResponse.json(
        { error: 'Сбор уже запущен. Дождитесь завершения текущей сессии.' },
        { status: 409 }
      );
    }

    console.log('[Admin] Starting SEO position collection (background batch session)...');

    positionCollector
      .startBatchSession()
      .then((result) => {
        console.log(
          `[Admin] SEO background collection complete: checked=${result.checked}, errors=${result.errors}, batches=${result.completedBatches}/${result.totalBatches}`
        );
        if (result.completedBatches === result.totalBatches) {
          return seoChangeNotifier.sendReport(result);
        }
      })
      .catch((error) => {
        console.error('[Admin] SEO background collection error:', error);
      });

    return NextResponse.json(
      {
        success: true,
        message: 'Сбор позиций запущен в фоновом режиме',
      },
      { status: 202 }
    );
  } catch (error) {
    console.error('[Admin] SEO position collection start error:', error);
    return safeErrorResponse(error, 500);
  }
}
