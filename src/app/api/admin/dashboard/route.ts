import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { statisticsService } from '@/services/admin/statisticsService';
import { hasPermission } from '@/lib/permissions/rbac';

export async function GET(request: NextRequest) {
  try {
    console.log('[DASHBOARD API] Fetching session...');
    const session = await getServerSession(authOptions);
    
    console.log('[DASHBOARD API] Session:', session ? 'Found' : 'Not found');
    console.log('[DASHBOARD API] Session user:', session?.user ? 'authenticated' : 'null');
    console.log('[DASHBOARD API] Session role:', session?.user?.role);

    if (!session?.user) {
      console.log('[DASHBOARD API] No session found, returning 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user.role as any, 'dashboard')) {
      console.log('[DASHBOARD API] User does not have dashboard permission:', session.user.role);
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

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
