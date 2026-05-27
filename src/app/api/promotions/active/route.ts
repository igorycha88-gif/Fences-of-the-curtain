import { NextResponse } from 'next/server';
import { promotionService } from '@/services/calculator/promotionService';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export async function GET() {
  try {
    const promotions = await promotionService.getActivePromotionsForBanner();

    return NextResponse.json({ promotions });
  } catch (error) {
    console.error('[Promotions Active GET] Error:', error);
    return NextResponse.json({ promotions: [] }, { status: 200 });
  }
}
