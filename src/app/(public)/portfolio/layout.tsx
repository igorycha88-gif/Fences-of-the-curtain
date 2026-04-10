import React from 'react';
import { Metadata } from 'next';
import JsonLdScript from '@/components/seo/JsonLdScript';
import { generateBreadcrumbJsonLd } from '@/lib/seo/jsonld';
import { generateStaticPageMetadata } from '@/lib/seo/metadata';
import { PAGE_METADATA } from '@/lib/seo/constants';

export const metadata: Metadata = generateStaticPageMetadata(
  PAGE_METADATA.portfolio.title,
  PAGE_METADATA.portfolio.description,
  PAGE_METADATA.portfolio.keywords,
  PAGE_METADATA.portfolio.ogImage,
  PAGE_METADATA.portfolio.path,
);

export default function PortfolioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: 'Главная', url: '/' },
    { name: 'Портфолио', url: '/portfolio' },
  ]);

  return (
    <>
      <JsonLdScript data={breadcrumbJsonLd} />
      {children}
    </>
  );
}
