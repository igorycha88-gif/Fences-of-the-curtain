import { NextRequest, NextResponse } from 'next/server';
import { existsSync } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');

    if (!imageUrl) {
      return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
    }

    const filePath = path.join(process.cwd(), 'public', imageUrl);
    const thumbnailPath = filePath.replace(/(\.\w+)$/, '_thumb$1');

    const fileExists = existsSync(filePath);
    const thumbnailExists = existsSync(thumbnailPath);

    return NextResponse.json({
      imageUrl,
      fileExists,
      thumbnailExists,
      filePath,
      thumbnailPath,
    });
  } catch (error) {
    console.error('[CheckImage] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
