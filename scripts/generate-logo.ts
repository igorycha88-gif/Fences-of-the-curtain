/**
 * Одноразовый скрипт генерации /public/logo.png (ЧТЗ SEO P0 1.1).
 * Запуск: npx tsx scripts/generate-logo.ts
 * Файл можно перезаписать дизайнерским логотипом (600×60 PNG, прозрачный фон).
 */
import path from 'path';
import sharp from 'sharp';

const OUT = path.resolve(process.cwd(), 'public/logo.png');

const FONT_STACK =
  'DejaVu Sans Bold, Helvetica Neue, Arial, sans-serif';

const svg = `
<svg width="600" height="60" viewBox="0 0 600 60" xmlns="http://www.w3.org/2000/svg">
  <rect x="2" y="10" width="40" height="40" rx="6" fill="#EA580C"/>
  <rect x="10" y="18" width="8" height="24" rx="2" fill="#FFFFFF"/>
  <rect x="22" y="18" width="8" height="24" rx="2" fill="#FFFFFF"/>
  <text x="56" y="41" font-family="${FONT_STACK}" font-size="30" font-weight="700" fill="#1E293B">Заборы и Навесы</text>
</svg>`;

async function main() {
  await sharp(Buffer.from(svg))
    .resize(600, 60)
    .png({ compressionLevel: 9 })
    .toFile(OUT);
  const meta = await sharp(OUT).metadata();
  console.log(`[generate-logo] OK: ${OUT} ${meta.width}x${meta.height} ${meta.format}`);
}

main().catch((error) => {
  console.error('[generate-logo] FAILED', error);
  process.exit(1);
});
