import React from 'react';
import { prisma } from '@/lib/prisma';
import { SEO_CONFIG } from '@/lib/seo/constants';
import { generateBreadcrumbJsonLd } from '@/lib/seo/jsonld';
import JsonLdScript from '@/components/seo/JsonLdScript';

const PORTFOLIO_SELECT = {
  title: true,
  images: true,
} as const;

export default async function PortfolioDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // ЧТЗ SEO P1 2.5: двойной lookup — slug-URL и legacy cuid-URL
  const item =
    (await prisma.portfolioItem.findUnique({
      where: { slug },
      select: PORTFOLIO_SELECT,
    })) ??
    (await prisma.portfolioItem.findUnique({
      where: { id: slug },
      select: PORTFOLIO_SELECT,
    }));

  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: 'Главная', url: '/' },
    { name: 'Портфолио', url: '/portfolio' },
    { name: item?.title || 'Проект' },
  ]);

  const images = item ? (item.images as string[]) || [] : [];
  const imageListJsonLd =
    images.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'ItemList' as const,
          name: `Фотографии проекта «${item?.title}»`,
          numberOfItems: images.length,
          itemListElement: images.map((img: string, index: number) => ({
            '@type': 'ListItem',
            position: index + 1,
            item: {
              '@type': 'ImageObject',
              url: img.startsWith('http')
                ? img
                : `${SEO_CONFIG.BASE_URL}${img}`,
              name: `Фото ${index + 1} — ${item?.title}`,
            },
          })),
        }
      : null;

  const jsonLdData = imageListJsonLd
    ? [breadcrumbJsonLd, imageListJsonLd]
    : [breadcrumbJsonLd];

  return (
    <>
      <JsonLdScript data={jsonLdData} />
      {children}
    </>
  );
}
