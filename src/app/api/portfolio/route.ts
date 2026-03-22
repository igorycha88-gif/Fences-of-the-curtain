import { NextRequest, NextResponse } from 'next/server';
import { portfolioService } from '@/services/admin/portfolioService';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') as 'fence' | 'canopy' | null;

    const items = await portfolioService.getPublicList(category || undefined);

    return NextResponse.json(
      { items },
      { 
        headers: { 
          'Cache-Control': 'public, max-age=300, stale-while-revalidate=60' 
        } 
      }
    );
  } catch (error) {
    console.error('Error fetching public portfolio:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
