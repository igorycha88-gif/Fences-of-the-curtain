import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { positionCollector } from '@/services/seo/positionCollector';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request, 'content');
    if (authResult instanceof NextResponse) return authResult;

    const session = await positionCollector.getSessionStatus();

    if (!session) {
      return NextResponse.json({ active: false });
    }

    const isRunning = session.completedBatches < session.totalBatches;
    const checked = session.batchResults.reduce((s, r) => s + r.checked, 0);
    const errors = session.batchResults.reduce((s, r) => s + r.errors, 0);
    const skipped = session.batchResults.reduce((s, r) => s + r.skipped, 0);
    const blocked = session.batchResults.reduce((s, r) => s + r.blocked, 0);

    return NextResponse.json({
      active: isRunning,
      completed: !isRunning,
      totalBatches: session.totalBatches,
      completedBatches: session.completedBatches,
      totalKeywords: session.totalKeywords,
      checked,
      errors,
      skipped,
      blocked,
      startedAt: session.startedAt,
      duration: Date.now() - session.startedAt,
      torEnabled: session.torStats?.enabled ?? false,
      torRotations: session.torStats?.rotations ?? 0,
      captchaHits: session.torStats?.captchaHits ?? 0,
    });
  } catch (error) {
    console.error('[Admin] SEO session status error:', error);
    return NextResponse.json(
      { error: 'Failed to get session status' },
      { status: 500 }
    );
  }
}
