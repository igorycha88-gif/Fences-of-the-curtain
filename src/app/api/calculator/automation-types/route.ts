import { NextResponse } from 'next/server';
import { getAllActiveAutomation } from '@/services/calculator/automationLookup';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const items = await getAllActiveAutomation();

    return NextResponse.json(items);
  } catch (error) {
    console.error('Error fetching automation types for calculator:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
