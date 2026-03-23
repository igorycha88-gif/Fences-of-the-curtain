import React from 'react';
import JsonLdScript from '@/components/seo/JsonLdScript';
import { generateBreadcrumbJsonLd } from '@/lib/seo/jsonld';

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
