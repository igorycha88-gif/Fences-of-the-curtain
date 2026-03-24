import { NextResponse } from 'next/server';
import { lagTypeService } from '@/services/admin/lagTypeService';
import { postTypeService } from '@/services/admin/postTypeService';
import { mountingHardwareService } from '@/services/admin/mountingHardwareService';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();

  try {
    const lagsCount = await lagTypeService.deactivateExpired();
    const postsCount = await postTypeService.deactivateExpired();
    const mountingHardwareCount = await mountingHardwareService.deactivateExpired();

    console.log(`[CRON] Deactivated ${lagsCount} lags, ${postsCount} posts, ${mountingHardwareCount} mounting hardware at ${now.toISOString()}`);

    return NextResponse.json({
      success: true,
      deactivated: {
        lags: lagsCount,
        posts: postsCount,
        mountingHardware: mountingHardwareCount,
      },
      timestamp: now,
    });
  } catch (error) {
    console.error('[CRON] Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
