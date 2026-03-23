import { Metadata } from 'next';
import React from 'react';
import JsonLdScript from '@/components/seo/JsonLdScript';
import { generateBreadcrumbJsonLd, generateItemListJsonLd } from '@/lib/seo/jsonld';
import { generatePageMetadata } from '@/lib/seo/metadata';
import { PAGE_METADATA } from '@/lib/seo/constants';

export const metadata: Metadata = generatePageMetadata({
  title: PAGE_METADATA.portfolio.title,
  description: PAGE_METADATA.portfolio.description,
  keywords: PAGE_METADATA.portfolio.keywords,
  ogImage: PAGE_METADATA.portfolio.ogImage,
});

export default function PortfolioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: 'Главная', url: '/' },
    { name: 'Портфолио', url: '/portfolio' },
  ]);

  const portfolioJsonLd = generateItemListJsonLd(
    'Портфолио работ',
    [
      {
        name: 'Заборы из профнастила',
        description: 'Профессиональный монтаж заборов из профнастила',
      },
      {
        name: 'Навесы для автомобилей',
        description: 'Навесы из поликарбоната и профнастила',
      },
      {
        name: 'Евроштакетник',
        description: 'Стильные заборы из евроштакетника',
      },
    ]
  );

  return (
    <>
      <JsonLdScript data={[breadcrumbJsonLd, portfolioJsonLd]} />
      {children}
    </>
  );
}
