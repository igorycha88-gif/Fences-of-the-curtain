import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { validateImageFile, saveImage } from '@/lib/utils/fileUpload';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['ADMIN', 'CONTENT_MANAGER'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const validation = validateImageFile(file);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { url, thumbnailUrl } = await saveImage(file);

    return NextResponse.json({
      url,
      thumbnailUrl,
      filename: file.name,
      size: file.size,
      mimeType: file.type,
    });
  } catch (error: any) {
    console.error('Error uploading image:', error);
    
    if (error.message === 'Invalid file type') {
      return NextResponse.json({ 
        error: 'Invalid file type', 
        message: 'Only JPEG, PNG, WebP, GIF are allowed' 
      }, { status: 400 });
    }
    
    if (error.message.includes('Minimum dimensions')) {
      return NextResponse.json({ 
        error: 'Invalid dimensions', 
        message: error.message 
      }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
