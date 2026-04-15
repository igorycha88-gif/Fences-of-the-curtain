import { NextRequest, NextResponse } from 'next/server';
import { existsSync } from 'fs';
import path from 'path';
import { requireAdmin } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request, 'content');
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');

    if (!imageUrl) {
      return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
    }

    if (!imageUrl.startsWith('/') || imageUrl.includes('..')) {
      return NextResponse.json({ error: 'Invalid image URL' }, { status: 400 });
    }

    const publicDir = path.join(process.cwd(), 'public');
    const filePath = path.join(publicDir, imageUrl);
    const resolvedPublic = path.resolve(publicDir);
    const resolvedFile = path.resolve(filePath);

    if (!resolvedFile.startsWith(resolvedPublic + path.sep) && resolvedFile !== resolvedPublic) {
      return NextResponse.json({ error: 'Invalid image URL' }, { status: 400 });
    }

    const thumbnailPath = filePath.replace(/(\.\w+)$/, '_thumb$1');

    const fileExists = existsSync(filePath);
    const thumbnailExists = existsSync(thumbnailPath);

    return NextResponse.json({
      imageUrl,
      fileExists,
      thumbnailExists,
    });
  } catch (error) {
    console.error('[CheckImage] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
