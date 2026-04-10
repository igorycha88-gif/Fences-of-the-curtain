import React from 'react';
import { Metadata } from 'next';
import JsonLdScript from '@/components/seo/JsonLdScript';
import { generateWebApplicationJsonLd, generateBreadcrumbJsonLd } from '@/lib/seo/jsonld';
import { generateStaticPageMetadata } from '@/lib/seo/metadata';
import { PAGE_METADATA } from '@/lib/seo/constants';

export const metadata: Metadata = generateStaticPageMetadata(
  PAGE_METADATA.calculatorCanopy.title,
  PAGE_METADATA.calculatorCanopy.description,
  PAGE_METADATA.calculatorCanopy.keywords,
  PAGE_METADATA.calculatorCanopy.ogImage,
  PAGE_METADATA.calculatorCanopy.path,
);

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
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: 'Главная', url: '/' },
    { name: 'Калькулятор', url: '/calculator' },
    { name: 'Калькулятор навеса', url: '/calculator/canopy' },
  ]);

  return (
    <>
      <JsonLdScript data={[webAppJsonLd, breadcrumbJsonLd]} />
      {children}
    </>
  );
}
