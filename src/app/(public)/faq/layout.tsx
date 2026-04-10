import React from 'react';
import JsonLdScript from '@/components/seo/JsonLdScript';
import { generateBreadcrumbJsonLd } from '@/lib/seo/jsonld';

export default function FaqLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: 'Главная', url: '/' },
    { name: 'FAQ', url: '/faq' },
  ]);

  return (
    <>
      <JsonLdScript data={breadcrumbJsonLd} />
      {children}
    </>
  );
}
