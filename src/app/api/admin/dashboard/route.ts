import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { statisticsService } from '@/services/admin/statisticsService';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request, 'dashboard');
    if (authResult instanceof NextResponse) return authResult;
    const { session } = authResult;

    const searchParams = request.nextUrl.searchParams;
    const period = (searchParams.get('period') as 'day' | 'week' | 'month' | 'quarter' | 'year') || 'month';

    const chartPeriod = (period === 'quarter' || period === 'year') ? 'month' : period as 'day' | 'week' | 'month';

    const [stats, recentOrders, ordersByDay, ordersByType] = await Promise.all([
      statisticsService.getDashboardStats(period),
      statisticsService.getRecentOrders(5),
      statisticsService.getOrdersByDay(chartPeriod || undefined),
      statisticsService.getOrdersByType(),
    ]);

    return NextResponse.json({
      stats,
      recentOrders,
      charts: {
        ordersByDay,
        ordersByType,
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
