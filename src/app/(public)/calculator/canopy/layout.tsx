import React from 'react';
import JsonLdScript from '@/components/seo/JsonLdScript';
import { generateWebApplicationJsonLd } from '@/lib/seo/jsonld';
import { PAGE_METADATA } from '@/lib/seo/constants';

export default function CanopyCalculatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const webAppJsonLd = generateWebApplicationJsonLd(
    PAGE_METADATA.calculatorCanopy.title,
    PAGE_METADATA.calculatorCanopy.description,
    '/calculator/canopy'
  );

  return (
    <>
      <JsonLdScript data={webAppJsonLd} />
      {children}
    </>
  );
}
