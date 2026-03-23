import React from 'react';
import JsonLdScript from '@/components/seo/JsonLdScript';
import { generateWebApplicationJsonLd } from '@/lib/seo/jsonld';
import { PAGE_METADATA } from '@/lib/seo/constants';

export default function FenceCalculatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const webAppJsonLd = generateWebApplicationJsonLd(
    PAGE_METADATA.calculatorFence.title,
    PAGE_METADATA.calculatorFence.description,
    '/calculator/fence'
  );

  return (
    <>
      <JsonLdScript data={webAppJsonLd} />
      {children}
    </>
  );
}
