import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { positionCollector } from '@/services/seo/positionCollector';

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
    console.log('[Cron] Starting SEO position collection...');
    const result = await positionCollector.collectAll();
    console.log(
      `[Cron] SEO position collection complete: checked=${result.checked}, errors=${result.errors}, skipped=${result.skipped}`
    );

    return NextResponse.json({
      success: true,
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
