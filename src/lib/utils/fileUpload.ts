import sharp from 'sharp';
import { mkdir, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MIN_DIMENSIONS = { width: 200, height: 200 };
const THUMBNAIL_SIZE = { width: 400, height: 300 };

const MAGIC_BYTES: Record<string, number[]> = {
  'image/jpeg': [0xff, 0xd8, 0xff],
  'image/png': [0x89, 0x50, 0x4e, 0x47],
  'image/webp': [0x52, 0x49, 0x46, 0x46],
  'image/gif': [0x47, 0x49, 0x46, 0x38],
};

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return { valid: false, error: 'Поддерживаются только форматы: JPEG, PNG, WebP, GIF' };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'Размер файла не должен превышать 5 MB' };
  }

  return { valid: true };
}

export function sanitizeFilename(filename: string): string {
  const ext = path.extname(filename);
  const name = path.basename(filename, ext);
  const sanitized = name
    .replace(/[^a-zA-Z0-9а-яА-Я_-]/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 50);
  return `${sanitized}${ext}`;
}

export function generateUniqueFilename(ext: string): string {
  return `${randomUUID()}${ext}`;
}

export function getUploadPath(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return path.join(process.cwd(), 'public', 'uploads', 'portfolio', String(year), month);
}

export async function saveImage(file: File): Promise<{ url: string; thumbnailUrl: string }> {
  const buffer = Buffer.from(await file.arrayBuffer());
  
  const mimeType = detectMimeType(buffer);
  if (!mimeType || !ALLOWED_MIME_TYPES.includes(mimeType)) {
    throw new Error('Invalid file type');
  }

  const metadata = await sharp(buffer).metadata();
  if (!metadata?.width || !metadata?.height) {
    throw new Error('Unable to read image metadata');
  }
  
  if (metadata.width < MIN_DIMENSIONS.width || metadata.height < MIN_DIMENSIONS.height) {
    throw new Error(`Minimum dimensions: ${MIN_DIMENSIONS.width}x${MIN_DIMENSIONS.height}`);
  }

  const ext = path.extname(file.name) || `.${metadata.format}`;
  const filename = generateUniqueFilename(ext);
  const uploadPath = getUploadPath();
  const filePath = path.join(uploadPath, filename);

  if (!existsSync(uploadPath)) {
    await mkdir(uploadPath, { recursive: true });
  }

  await sharp(buffer)
    .rotate()
    .withMetadata({ exif: undefined })
    .toFile(filePath);

  const thumbFilename = filename.replace(/(\.\w+)$/, '_thumb$1');
  const thumbPath = path.join(uploadPath, thumbFilename);
  
  await sharp(buffer)
    .rotate()
    .resize(THUMBNAIL_SIZE.width, THUMBNAIL_SIZE.height, { fit: 'cover', position: 'center' })
    .withMetadata({ exif: undefined })
    .toFile(thumbPath);

  const publicUrl = filePath.replace(path.join(process.cwd(), 'public'), '');
  const thumbnailUrl = thumbPath.replace(path.join(process.cwd(), 'public'), '');

  return { url: publicUrl, thumbnailUrl };
}

export async function deleteImage(url: string): Promise<void> {
  const filePath = path.join(process.cwd(), 'public', url);
  const thumbPath = filePath.replace(/(\.\w+)$/, '_thumb$1');
  
  if (existsSync(filePath)) {
    await unlink(filePath);
  }
  
  if (existsSync(thumbPath)) {
    await unlink(thumbPath);
  }
}

function detectMimeType(buffer: Buffer): string | null {
  for (const [mimeType, bytes] of Object.entries(MAGIC_BYTES)) {
    const matches = bytes.every((byte, index) => buffer[index] === byte);
    if (matches) return mimeType;
  }
  return null;
}
