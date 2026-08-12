import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const replacements: [RegExp, string][] = [
  [/от 1\s?500 до 2\s?500/g, 'от 2 800 до 4 000'],
  [/от 1500 до 2500/g, 'от 2800 до 4000'],
  [/1500-2500 ₽/g, '2800-4000 ₽'],
  [/от 1\s?600 до 2\s?800/g, 'от 3 500 до 5 500'],
  [/от 1600 до 2800/g, 'от 3500 до 5500'],
  [/1600-2800 ₽/g, '3500-5500 ₽'],
  [/1500-1700 ₽/g, '2800-3200 ₽'],
  [/1800-2200 ₽/g, '3200-3800 ₽'],
  [/2500-3500 ₽/g, '3800-5500 ₽'],
  [/2000-3500 ₽/g, '4500-6500 ₽'],
  [/от 600 до 1000/g, 'от 900 до 1300'],
  [/600-1000 ₽/g, '900-1300 ₽'],
  [/от 1\s?200 до 2\s?000/g, 'от 2000 до 2800'],
  [/1200-2000 ₽/g, '2000-2800 ₽'],
  [/2000-2800 ₽\/погонный/g, '3500-5000 ₽/погонный'],
  [/3000-4500 ₽\/погонный/g, '5000-7000 ₽/погонный'],
  [/2800-3800 ₽\/погонный/g, '4500-6000 ₽/погонный'],
  [/3500-5000 ₽\/погонный/g, '5500-7500 ₽/погонный'],
  [/35 000-55 000 ₽/g, '60 000-90 000 ₽'],
  [/50 000-80 000 ₽/g, '75 000-120 000 ₽'],
  [/45 000-70 000 ₽/g, '65 000-95 000 ₽'],
  [/70 000-110 000 ₽/g, '95 000-150 000 ₽'],
  [/25 000-45 000 ₽/g, '20 000-28 000 ₽'],
  [/от 60 000 ₽ за ворота 4/g, 'от 115 000 ₽ за ворота 4'],
  [/от 60 000 ₽/g, 'от 115 000 ₽'],
  [/от 90 000 ₽ за ворота 5/g, 'от 135 000 ₽ за ворота 5'],
  [/от 90 000 ₽/g, 'от 135 000 ₽'],
  [/80 000-150 000 ₽/g, '115 000-150 000 ₽'],
  [/110 000-150 000 ₽/g, '115 000-150 000 ₽'],
  [/150 000-200 000 ₽/g, '160 000-220 000 ₽'],
  [/8 000-15 000 ₽/g, '7 000-10 000 ₽'],
  [/160 000-250 000 ₽/g, '280 000-400 000 ₽'],
  [/200 000-360 000 ₽/g, '320 000-500 000 ₽'],
  [/208 000 ₽/g, '364 000 ₽'],
  [/248 000 ₽/g, '394 000 ₽'],
  [/260 000 ₽/g, '416 000 ₽'],
  [/307 000 ₽/g, '463 000 ₽'],
  [/390 000 ₽/g, '520 000 ₽'],
  [/450 000 ₽/g, '580 000 ₽'],
  [/256 000 ₽/g, '448 000 ₽'],
  [/296 000 ₽/g, '488 000 ₽'],
  [/320 000 ₽/g, '512 000 ₽'],
  [/367 000 ₽/g, '559 000 ₽'],
  [/480 000 ₽/g, '640 000 ₽'],
  [/540 000 ₽/g, '700 000 ₽'],
  [/от 1\s?500₽\/м/g, 'от 2 800₽/м'],
  [/от 1500₽\/м/g, 'от 2800₽/м'],
  [/от 1 500 ₽\/м/g, 'от 2 800 ₽/м'],
  [/450-550 ₽/g, '950-1200 ₽'],
  [/450-700 ₽/g, '950-1300 ₽'],
  [/500-600 ₽/g, '1000-1200 ₽'],
  [/550-700 ₽/g, '1000-1300 ₽'],
  [/550-750 ₽/g, '1000-1400 ₽'],
  [/600-750 ₽/g, '1100-1400 ₽'],
  [/550-800 ₽/g, '650-1000 ₽'],
  [/200-350 ₽/g, '300-450 ₽'],
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

  console.log('\nTotal price replacements: ' + totalReplacements);
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
