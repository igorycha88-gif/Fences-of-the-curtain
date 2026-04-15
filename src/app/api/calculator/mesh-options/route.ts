import { NextResponse } from 'next/server';
import { getMeshOptions } from '@/services/calculator/meshCalculator';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const height = searchParams.get('height');

    const fenceHeightM = height ? parseFloat(height) : undefined;

    if (fenceHeightM !== undefined && (isNaN(fenceHeightM) || fenceHeightM < 1 || fenceHeightM > 5)) {
      return NextResponse.json(
        { error: 'Invalid height parameter' },
        { status: 400 }
      );
    }

    const options = await getMeshOptions(fenceHeightM);

    return NextResponse.json(options);
  } catch (error) {
    console.error('[mesh-options] Error:', error);
    return NextResponse.json(
      { error: 'Failed to load mesh options' },
      { status: 500 }
    );
  }
}
