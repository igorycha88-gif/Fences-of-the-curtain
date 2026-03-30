import { NextRequest, NextResponse } from 'next/server';
import { fenceTypeCalculatorService } from '@/services/calculator/fenceTypeCalculatorService';
import { fenceTypesQuerySchema } from '@/lib/validators';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

function generateETag(data: unknown): string {
  const hash = crypto
    .createHash('md5')
    .update(JSON.stringify(data))
    .digest('hex');
  return `"${hash}"`;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = Object.fromEntries(searchParams.entries());

    const validatedData = fenceTypesQuerySchema.parse(query);

    const result = await fenceTypeCalculatorService.getActiveWithMaterials({
      onlyWithMaterials: validatedData.onlyWithMaterials,
    });

    const etag = generateETag(result);
    const ifNoneMatch = req.headers.get('if-none-match');
    
    if (ifNoneMatch === etag) {
      return new NextResponse(null, { status: 304 });
    }

    return NextResponse.json(result, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'ETag': etag,
      }
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error('Fence types API error:', error);
      return NextResponse.json(
        { error: 'Не удалось загрузить типы заборов' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Не удалось загрузить типы заборов' },
      { status: 500 }
    );
  }
}
