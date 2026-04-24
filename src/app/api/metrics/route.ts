import { NextRequest, NextResponse } from 'next/server';
import { getMetricsString } from '@/lib/prometheus';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    if (process.env.NODE_ENV === 'production') {
      const authHeader = req.headers.get('authorization');
      const metricsToken = process.env.METRICS_BEARER_TOKEN;

      if (!metricsToken) {
        return new NextResponse('Not Found', { status: 404 });
      }

      if (authHeader !== `Bearer ${metricsToken}`) {
        return new NextResponse('Unauthorized', { status: 401 });
      }
    }

    const metrics = await getMetricsString();
    return new NextResponse(metrics, {
      headers: {
        'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Metrics error:', error);
    return NextResponse.json(
      { error: 'Failed to generate metrics' },
      { status: 500 }
    );
  }
}
