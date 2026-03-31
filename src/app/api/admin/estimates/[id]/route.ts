import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/admin-auth';
import { estimatesService } from '@/services/admin/estimatesService';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('[API] ===== GET ESTIMATE REQUEST =====');
    
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;
    const { session } = authResult;
    console.log('[API] Session:', 'exists');
    console.log('[API] Session user:', 'authenticated');
    
    const userEmail = session.email;
    console.log('[API] User identified:', !!userEmail);
    
    if (!userEmail) {
      console.log('[API] ERROR: No user email in session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { role: true, email: true, name: true },
    });
    
    console.log('[API] User from DB:', user ? `role=${user.role}` : 'null');

    const isAdmin = user?.role === 'ADMIN';
    const { id } = await params;

    console.log('[API] Getting estimate:', id, 'isAdmin:', isAdmin, 'userRole:', user?.role);

    const estimate = await estimatesService.getEstimateByIdWithMargin(id, isAdmin);

    if (!estimate) {
      console.log('[API] Estimate not found:', id);
      return NextResponse.json({ error: 'Estimate not found' }, { status: 404 });
    }

    console.log('[API] Estimate items count:', estimate.items?.length);
    console.log('[API] showPurchasePrices:', isAdmin);
    console.log('[API] summary:', estimate.summary);
    console.log('[API] Items count:', estimate.items?.length);

    const response = {
      ...estimate,
      showPurchasePrices: isAdmin,
      summary: estimate.summary,
    };
    
    console.log('[API] Final response keys:', Object.keys(response));
    console.log('[API] Response showPurchasePrices:', response.showPurchasePrices);
    console.log('[API] Response summary:', response.summary);

    
    console.log('[API] summary BEFORE response:', estimate.summary);
    console.log('[API] response.summary AFTER:', response.summary);

    
    return NextResponse.json(response);
  } catch (error) {
    console.error('[API] Error fetching estimate:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
