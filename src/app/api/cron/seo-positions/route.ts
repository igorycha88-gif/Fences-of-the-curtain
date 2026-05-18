import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { positionCollector } from '@/services/seo/positionCollector';
import { seoChangeNotifier } from '@/services/seo/seoChangeNotifier';

function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (
    !process.env.CRON_SECRET ||
    !authHeader ||
    !safeCompare(authHeader, `Bearer ${process.env.CRON_SECRET}`)
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    let body: { action?: string } = {};
    try {
      body = await request.json();
    } catch {
      body = { action: 'start' };
    }

    const action = body.action || 'start';

    if (action === 'status') {
      const session = await positionCollector.getSessionStatus();
      return NextResponse.json({
        success: true,
        action: 'status',
        session,
      });
    }

    console.log(`[Cron] Starting SEO position collection (action: ${action})...`);
    const result = await positionCollector.startBatchSession();
    console.log(
      `[Cron] SEO position collection complete: checked=${result.checked}, errors=${result.errors}, skipped=${result.skipped}, batches=${result.completedBatches}/${result.totalBatches}`
    );

    if (result.completedBatches === result.totalBatches) {
      await seoChangeNotifier.sendReport(result);
    }

    return NextResponse.json({
      success: true,
      action,
      ...result,
    });
  } catch (error) {
    console.error('[Cron] SEO position collection error:', error);
    return NextResponse.json(
      { error: 'Collection failed', details: String(error) },
      { status: 500 }
    );
  }
}
