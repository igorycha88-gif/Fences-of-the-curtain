import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function replaceInJson(obj: any, patterns: [RegExp, string | ((substring: string) => string)][]): any {
  if (typeof obj === 'string') {
    let result = obj;
    for (const [pattern, replacement] of patterns) {
      if (typeof replacement === 'function') {
        result = result.replace(pattern, replacement);
      } else {
        result = result.replace(pattern, replacement);
      }
    }
    return result;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => replaceInJson(item, patterns));
  }
  if (obj && typeof obj === 'object') {
    const result: any = {};
    for (const key of Object.keys(obj)) {
      result[key] = replaceInJson(obj[key], patterns);
    }
    return result;
  }
  return obj;
}

const contentPatterns: [RegExp, string | ((substring: string) => string)][] = [
  [/от \d[\d\s]+руб\. за погонный метр[^.]*\./gi, ''],
  [/от \d[\d\s]+руб\/м\.?п\.?/gi, ''],
  [/от \d[\d\s]+руб\/м\b/gi, ''],
  [/от \d[\d\s]+руб\/м²/gi, ''],
  [/от \d[\d\s]+руб\. за метр[^.]*\./gi, ''],
  [/цена за погонный метр[^.]*\./gi, ''],
  [/стоимость за погонный метр[^.]*\./gi, ''],
  [/\d+ погонных метров/gi, (match: string) => match.replace(' погонных метров', ' метров')],
  [/\d+ погонный метр/gi, (match: string) => match.replace(' погонный метр', ' метр')],
];

async function cleanupServicePages() {
  const pages = await prisma.pageContent.findMany({
    where: { category: { not: null } },
  });

  for (const page of pages) {
    const content = replaceInJson(page.content, contentPatterns);
    const seoTitle = replaceInJson(page.seoTitle, [
      [/ — цена за метр,/gi, ' —'],
      [/ — цена,/gi, ' —'],
      [/цена за погонный метр/gi, ''],
    ]) as string;
    const seoDescription = replaceInJson(page.seoDescription, [
      [/от \d[\d\s]+руб\/м²?\.?\s*/gi, ''],
      [/от \d[\d\s]+руб\.?\s*/gi, ''],
      [/цена за метр/gi, ''],
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

async function cleanupFaqItems() {
  const items = await prisma.faqItem.findMany();

  for (const item of items) {
    const answer = replaceInJson(item.answer, [
      [/от \d[\d\s]+руб\. за погонный метр[^.]*\./gi, ''],
      [/от \d[\d\s]+руб\/м\.?п\.?[^,.]*/gi, ''],
      [/от \d[\d\s]+руб\/м\b[^,.]*/gi, ''],
      [/от \d[\d\s]+руб\/м²[^,.]*/gi, ''],
      [/цена за погонный метр[^.]*\./gi, ''],
      [/погонных метров/gi, 'метров'],
      [/погонный метр/gi, 'метр'],
    ]) as string;

    await prisma.faqItem.update({
      where: { id: item.id },
      data: { answer },
    });
    console.log(`  [OK] FAQ: ${item.question.substring(0, 50)}...`);
  }
}

async function cleanupBlogPosts() {
  const posts = await prisma.blogPost.findMany();

  for (const post of posts) {
    const content = replaceInJson(post.content, contentPatterns);
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
    const excerpt = replaceInJson(post.excerpt, contentPatterns) as string;

    await prisma.blogPost.update({
      where: { id: post.id },
      data: { content, seoTitle, seoDescription, excerpt },
    });
    console.log(`  [OK] Blog post: ${post.slug}`);
  }
}

async function main() {
  console.log('=== Cleanup: removing prices per linear meter ===\n');

  console.log('1. Service pages (set priceRange=null, clean content):');
  await cleanupServicePages();

  console.log('\n2. FAQ items:');
  await cleanupFaqItems();

  console.log('\n3. Blog posts:');
  await cleanupBlogPosts();

  console.log('\n=== Done! ===');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
