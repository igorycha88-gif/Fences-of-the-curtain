import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { generatePageMetadata } from '@/lib/seo/metadata';
import { portfolioHref } from '@/lib/seo/portfolioUrl';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  // ЧТЗ SEO P1 2.5: двойной lookup — slug-URL и legacy cuid-URL (canonical ведёт на slug)
  const item = await prisma.portfolioItem.findUnique({
    where: { slug },
    select: { id: true, slug: true, title: true, description: true, images: true, active: true },
  });

  const resolved =
    item ??
    (await prisma.portfolioItem.findUnique({
      where: { id: slug },
      select: { id: true, slug: true, title: true, description: true, images: true, active: true },
    }));

  if (!resolved || !resolved.active) {
    return generatePageMetadata({
      title: 'Проект не найден',
      description: 'Запрашиваемый проект не найден',
      path: '/portfolio',
    });
  }

  const images = (resolved.images as string[]) || [];
  const firstImage = images[0];

  return generatePageMetadata({
    title: `${resolved.title} — Заборы и Навесы`,
    description:
      resolved.description ||
      `Проект «${resolved.title}» — пример нашей работы. Заборы и Навесы в Москве и МО.`,
    path: portfolioHref(resolved),
    ogImage: firstImage || undefined,
  });
}
