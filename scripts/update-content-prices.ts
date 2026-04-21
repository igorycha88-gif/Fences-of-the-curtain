import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function replaceInJson(obj: any, replacements: [RegExp, string][]): any {
  if (typeof obj === 'string') {
    let result = obj;
    for (const [pattern, replacement] of replacements) {
      result = result.replace(pattern, replacement);
    }
    return result;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => replaceInJson(item, replacements));
  }
  if (obj && typeof obj === 'object') {
    const result: any = {};
    for (const key of Object.keys(obj)) {
      result[key] = replaceInJson(obj[key], replacements);
    }
    return result;
  }
  return obj;
}

const replacements: [RegExp, string][] = [
  [/установка и бетонирование столбов/gi, 'установка столбов с бутировкой щебнем'],
  [/установка и бетонирование опор/gi, 'установка опор с бутировкой щебнем'],
  [/Установка и бетонирование столбов/gi, 'Установка столбов с бутировкой щебнем'],
  [/Установка и бетонирование опор/gi, 'Установка опор с бутировкой щебнем'],
  [/бетонирование столбов/gi, 'установка столбов с бутировкой щебнем'],
  [/бетонирование опор/gi, 'установка опор с бутировкой щебнем'],
  [/Бетонирование столбов/gi, 'Установка столбов с бутировкой щебнем'],
  [/надёжного бетонирования/gi, 'надёжной установки с бутировкой щебнем'],
  [/бетонирование/gi, 'трамбовка щебнем'],
  [/Бетонирование/gi, 'Трамбовка щебнем'],
  [/выдержка бетона \d+[–-]\d+ дней для набора прочности\.?\s*/gi, ''],
  [/выдержка 24[–-]48 часов для набора прочности бетоном\.?\s*/gi, ''],
  [/бетон набирает прочность \d+[–-]\d+ дней,?\s*/gi, ''],
  [/бетон набирает прочность 3[–-]7 дней/gi, ''],
  [/застывание бетона — обычно 3–7 дней, после чего забор полностью готов к эксплуатации\./gi, 'забор сразу готов к эксплуатации.'],
  [/антиморозных добавок и более длительного твердения бетона/gi, 'особенностей монтажа в зимних условиях'],
  [/бетон с противоморозными добавками, что обеспечивает надёжное схватывание даже в мороз/gi, 'бутировку щебнем, что обеспечивает надёжную фиксацию даже в мороз'],
  [/Зимой используются специальные антиморозные добавки для бетона\.?\s*/gi, ''],
  [/заливается бетон/gi, 'засыпается и трамбуется щебень'],
  [/замуровываются в бетон при заливке/gi, 'фиксируются с бутировкой щебнем'],
  [/столбы бетонируются в ямах/gi, 'столбы устанавливаются с бутировкой щебнем в ямах'],
  [/Столбы бетонируются в ямах/gi, 'Столбы устанавливаются с бутировкой щебнем в ямах'],
  [/и бетонируются\./gi, 'и фиксируются с бутировкой щебнем.'],
  [/бетон, доставка/gi, 'щебень, доставка'],
];

async function updateServicePages() {
  const pages = await prisma.pageContent.findMany({
    where: { category: { in: ['fence', 'canopy'] } },
  });

  for (const page of pages) {
    const content = replaceInJson(page.content, replacements);
    const seoTitle = replaceInJson(page.seoTitle, [
      [/ — цена за метр,/gi, ' —'],
      [/ — цена,/gi, ' —'],
    ]) as string;
    const seoDescription = replaceInJson(page.seoDescription, [
      [/от \d[\d\s]+руб\/м²?\.?\s*/gi, ''],
      [/от \d[\d\s]+руб\.?\s*/gi, ''],
    ]) as string;

    await prisma.pageContent.update({
      where: { id: page.id },
      data: {
        content,
        seoTitle,
        seoDescription,
        priceRange: null,
      },
    });
    console.log(`  [OK] Service page: ${page.slug}`);
  }
}

async function updateBlogPosts() {
  const posts = await prisma.blogPost.findMany();

  for (const post of posts) {
    const content = replaceInJson(post.content, replacements);
    const seoTitle = replaceInJson(post.seoTitle, [
      [/цена за метр под ключ/gi, 'что влияет на цену'],
      [/цены за метр под ключ/gi, 'что влияет на цену'],
      [/и стоимость от \d+ руб/gi, 'и расчёт стоимости'],
      [/цена под ключ/gi, 'расчёт стоимости'],
    ]) as string;
    const seoDescription = replaceInJson(post.seoDescription, [
      [/от \d[\d\s]+руб\/м²?\.?\s*/gi, ''],
      [/от \d[\d\s]+руб\.?\s*/gi, ''],
      [/расчёт стоимости от \d[\d\s]+руб\.?\s*/gi, 'расчёт стоимости.'],
    ]) as string;
    const excerpt = replaceInJson(post.excerpt, replacements) as string;

    await prisma.blogPost.update({
      where: { id: post.id },
      data: { content, seoTitle, seoDescription, excerpt },
    });
    console.log(`  [OK] Blog post: ${post.slug}`);
  }
}

async function updateFaqItems() {
  const items = await prisma.faqItem.findMany();

  for (const item of items) {
    const answer = replaceInJson(item.answer, [
      ...replacements,
      [/Цена начинается от \d[\d\s]+руб\/м\.?/gi, ''],
      [/от \d[\d\s]+руб\. за погонный метр[^.]*\./gi, ''],
      [/от \d[\d\s]+руб\/м[^,.]*/gi, ''],
      [/от \d[\d\s]+руб\/м²[^,.]*/gi, ''],
      [/начинается от \d[\d\s]+руб\/м/gi, ''],
      [/, но цена начинается от \d[\d\s]+руб\/м/gi, ''],
    ]) as string;

    await prisma.faqItem.update({
      where: { id: item.id },
      data: { answer },
    });
    console.log(`  [OK] FAQ: ${item.question.substring(0, 40)}...`);
  }
}

async function main() {
  console.log('Updating content: removing prices and replacing бетонирование...');

  console.log('\n1. Service pages:');
  await updateServicePages();

  console.log('\n2. Blog posts:');
  await updateBlogPosts();

  console.log('\n3. FAQ items:');
  await updateFaqItems();

  console.log('\nDone!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
