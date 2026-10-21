/**
 * ЧТЗ SEO P1 2.5 + P2 3.1: бэкфилл существующих PortfolioItem.
 * Генерирует slug (ЧПУ-URL), заполняет fenceType и city для alt-текстов.
 *
 * Запуск: npx tsx prisma/scripts/backfill-portfolio-slug.ts
 * Требует: npx prisma db push (после добавления полей в schema.prisma).
 * Идемпотентен: повторный запуск не меняет уже заполненные slug.
 */
import { PrismaClient } from '@prisma/client';
import { slugify } from '../../src/lib/utils/slugify';
import logger from '../../src/lib/logger';

const prisma = new PrismaClient();

const logContext = { module: 'backfill-portfolio-slug' } as const;

const CATEGORY_LABELS: Record<string, string> = {
  fence: 'забор',
  canopy: 'навес',
  garage: 'гараж',
};

/**
 * Предложный падеж городов работы (для alt-шаблона «в {город}»).
 * Список синхронизирован с BUSINESS_INFO.areaServedCities.
 */
const CITY_PREPOSITIONAL: Record<string, string> = {
  'Москва': 'Москве',
  'Балашиха': 'Балашихе',
  'Люберцы': 'Люберцах',
  'Подольск': 'Подольске',
  'Домодедово': 'Домодедове',
  'Щёлково': 'Щёлкове',
  'Щелково': 'Щёлкове',
  'Электросталь': 'Электростали',
  'Коломна': 'Коломне',
  'Серпухов': 'Серпухове',
  'Раменское': 'Раменском',
  'Жуковский': 'Жуковском',
};

function extractCity(text: string | null | undefined): string | null {
  if (!text) return null;
  for (const [nominative, prepositional] of Object.entries(CITY_PREPOSITIONAL)) {
    if (new RegExp(`\\b${nominative}\\b`, 'i').test(text)) {
      return prepositional;
    }
  }
  return null;
}

function extractFenceType(item: { type: string | null; category: string }): string {
  return (item.type || CATEGORY_LABELS[item.category] || 'ограждение').trim();
}

async function main() {
  const items = await prisma.portfolioItem.findMany({
    select: { id: true, title: true, category: true, type: true, description: true, slug: true, fenceType: true, city: true },
    orderBy: { createdAt: 'asc' },
  });

  logger.info('start', { ...logContext, operation: 'main', total: items.length });
  const usedSlugs = new Set(items.map((i) => i.slug).filter(Boolean) as string[]);

  let updatedSlug = 0;
  let updatedMeta = 0;

  for (const item of items) {
    const data: { slug?: string; fenceType?: string; city?: string } = {};

    if (!item.slug) {
      let candidate = slugify(item.title);
      let suffix = 2;
      while (usedSlugs.has(candidate)) {
        candidate = `${slugify(item.title)}-${suffix}`;
        suffix += 1;
      }
      data.slug = candidate;
      usedSlugs.add(candidate);
    }

    if (!item.fenceType) {
      data.fenceType = extractFenceType(item);
    }

    if (!item.city) {
      const city = extractCity(`${item.title} ${item.description ?? ''}`);
      if (city) {
        data.city = city;
      }
    }

    if (Object.keys(data).length === 0) {
      continue;
    }

    await prisma.portfolioItem.update({ where: { id: item.id }, data });
    if (data.slug) updatedSlug += 1;
    if (data.fenceType || data.city) updatedMeta += 1;
    logger.info('item updated', {
      ...logContext,
      operation: 'main',
      itemId: item.id,
      slug: data.slug ?? item.slug,
      fenceType: data.fenceType ?? item.fenceType,
      city: data.city ?? item.city,
    });
  }

  logger.info('done', { ...logContext, operation: 'main', updatedSlug, updatedMeta });
}

main()
  .catch((error) => {
    logger.error('failed', { ...logContext, operation: 'main', error });
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
