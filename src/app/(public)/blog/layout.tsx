import React from 'react';
import JsonLdScript from '@/components/seo/JsonLdScript';
import { generateBreadcrumbJsonLd } from '@/lib/seo/jsonld';

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: 'Главная', url: '/' },
    { name: 'Блог', url: '/blog' },
  ]);

  return (
    <>
      <JsonLdScript data={breadcrumbJsonLd} />
      {children}
    </>
  );
}
