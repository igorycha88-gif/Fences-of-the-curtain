import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Калькулятор навесов: price = length × width × 8500 ₽/м²
// Стандартные размеры:
//   3×6м (1 авто) = 18м²  → 153 000 ₽
//   3.5×6м (1 внедорожник) = 21м² → 178 500 ₽
//   6×6м (2 авто) = 36м²  → 306 000 ₽
//   4×4м (беседка) = 16м² → 136 000 ₽
//   4×8м (терраса) = 32м² → 272 000 ₽
//   5×6м (крупный) = 30м² → 255 000 ₽

const replacements: [RegExp, string][] = [
  // Предыдущие (уже исправленные) → правильные по калькулятору
  [/60 000-90 000 ₽/g, '130 000-200 000 ₽'],
  [/75 000-120 000 ₽/g, '150 000-260 000 ₽'],
  [/65 000-95 000 ₽/g, '130 000-200 000 ₽'],
  [/95 000-150 000 ₽/g, '200 000-310 000 ₽'],
  [/35 000-80 000 ₽/g, '130 000-260 000 ₽'],
  
  // Упоминания "за навес 3×6 метра"
  [/130 000-200 000 ₽ за навес 3×6 метра/g, '150 000-180 000 ₽ за навес 3×6 метра'],
  
  // "50 900-52 900 ₽" — старый расчёт материалов → убрать или заменить
  [/50 900-52 900 ₽/g, '150 000-160 000 ₽'],
  
  // Цена за м² материала — оставляем реальную из БД
  // Поликарбонат 10мм: 950 ₽/м², профнастил: ~1000 ₽/м²
  // Эти НЕ меняем — они корректны
  
  // Оставшиеся старые паттерны цен навесов
  [/35 000-55 000 ₽/g, '130 000-180 000 ₽'],
  [/50 000-80 000 ₽/g, '150 000-260 000 ₽'],
  [/45 000-70 000 ₽/g, '130 000-200 000 ₽'],
  [/70 000-110 000 ₽/g, '200 000-310 000 ₽'],
  
  // "8 500 ₽" → "8 500 ₽/м²" если ещё не исправлено
  // (это упоминания ставки калькулятора)
  
  // Примеры расчётов в статьях
  [/32 900 ₽/g, '150 000 ₽'],
  [/15 000 ₽\.\s*Итого навес/g, '150 000-160 000 ₽. Итого навес'],
  
  // "Цена под ключ: 35 000-55 000" → правильная
  [/Цена под ключ: 130 000-200 000 ₽/g, 'Цена под ключ: 150 000-180 000 ₽'],
  
  // Указываем ставку калькулятора
  [/CANOPY_PRICE_PER_SQM/g, '8 500 ₽/м²'],
  
  // "40 000-51 000 ₽" — старый расчёт
  [/40 000-51 000 ₽/g, '150 000-160 000 ₽'],
];

async function main() {
  const posts = await prisma.blogPost.findMany({
    where: { published: true },
    select: { id: true, slug: true, title: true, excerpt: true, content: true, seoTitle: true, seoDescription: true },
  });

  let totalReplacements = 0;

  for (const post of posts) {
    let changed = false;
    let contentStr = JSON.stringify(post.content);
    const updates: Record<string, unknown> = {};

    for (const field of ['title', 'excerpt', 'seoTitle', 'seoDescription'] as const) {
      let val = post[field] as string | null;
      if (!val) continue;
      for (const [pattern, replacement] of replacements) {
        const matches = val.match(pattern);
        if (matches) {
          totalReplacements += matches.length;
          val = val.replace(pattern, replacement);
          changed = true;
        }
      }
      updates[field] = val;
    }

    for (const [pattern, replacement] of replacements) {
      const matches = contentStr.match(pattern);
      if (matches) {
        totalReplacements += matches.length;
        contentStr = contentStr.replace(pattern, replacement);
        changed = true;
      }
    }

    if (changed) {
      updates.content = JSON.parse(contentStr);
      await prisma.blogPost.update({ where: { id: post.id }, data: updates });
      console.log('Updated: ' + post.slug);
    }
  }

  console.log('\nTotal replacements: ' + totalReplacements);
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
