import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { generatePageMetadata } from '@/lib/seo/metadata';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  const item = await prisma.portfolioItem.findUnique({
    where: { id },
    select: { title: true, description: true, images: true, active: true },
  });

  if (!item || !item.active) {
    return generatePageMetadata({
      title: 'Проект не найден',
      description: 'Запрашиваемый проект не найден',
      path: '/portfolio',
    });
  }

  const images = (item.images as string[]) || [];
  const firstImage = images[0];

  return generatePageMetadata({
    title: `${item.title} — Заборы и Навесы`,
    description:
      item.description ||
      `Проект «${item.title}» — пример нашей работы. Заборы и Навесы в Москве и МО.`,
    path: `/portfolio/${id}`,
    ogImage: firstImage || undefined,
  });
}
