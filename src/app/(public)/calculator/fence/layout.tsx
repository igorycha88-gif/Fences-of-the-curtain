import { Metadata } from 'next';
import React from 'react';
import JsonLdScript from '@/components/seo/JsonLdScript';
import { generateWebApplicationJsonLd } from '@/lib/seo/jsonld';
import { generatePageMetadata } from '@/lib/seo/metadata';
import { PAGE_METADATA } from '@/lib/seo/constants';

export const metadata: Metadata = generatePageMetadata({
  title: PAGE_METADATA.calculatorFence.title,
  description: PAGE_METADATA.calculatorFence.description,
  keywords: PAGE_METADATA.calculatorFence.keywords,
  ogImage: PAGE_METADATA.calculatorFence.ogImage,
});

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
