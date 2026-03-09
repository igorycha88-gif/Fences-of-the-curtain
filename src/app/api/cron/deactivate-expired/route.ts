import { NextResponse } from 'next/server';
import { lagTypeService } from '@/services/admin/lagTypeService';
import { postTypeService } from '@/services/admin/postTypeService';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();

  try {
    const lagsCount = await lagTypeService.deactivateExpired();
    const postsCount = await postTypeService.deactivateExpired();

    console.log(`[CRON] Deactivated ${lagsCount} lags, ${postsCount} posts at ${now.toISOString()}`);

    return NextResponse.json({
      success: true,
      deactivated: {
        lags: lagsCount,
        posts: postsCount,
      },
      timestamp: now,
    });
  } catch (error) {
    console.error('[CRON] Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
