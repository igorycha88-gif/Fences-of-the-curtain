import { Metadata } from 'next';
import React from 'react';
import JsonLdScript from '@/components/seo/JsonLdScript';
import { generateWebApplicationJsonLd } from '@/lib/seo/jsonld';
import { generatePageMetadata } from '@/lib/seo/metadata';
import { PAGE_METADATA } from '@/lib/seo/constants';

export const metadata: Metadata = generatePageMetadata({
  title: PAGE_METADATA.calculatorCanopy.title,
  description: PAGE_METADATA.calculatorCanopy.description,
  keywords: PAGE_METADATA.calculatorCanopy.keywords,
  ogImage: PAGE_METADATA.calculatorCanopy.ogImage,
});

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
