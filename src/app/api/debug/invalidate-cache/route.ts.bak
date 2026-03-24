import { NextResponse } from 'next/server';
import { fenceTypeCalculatorService } from '@/services/calculator/fenceTypeCalculatorService';

export async function POST() {
  try {
    await fenceTypeCalculatorService.invalidateCache();
    return NextResponse.json({ success: true, message: 'Cache invalidated' });
  } catch (error) {
    console.error('Error invalidating cache:', error);
    return NextResponse.json({ success: false, error: 'Failed to invalidate cache' }, { status: 500 });
  }
}