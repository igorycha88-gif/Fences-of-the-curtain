import React from 'react';
import { Metadata } from 'next';
import JsonLdScript from '@/components/seo/JsonLdScript';
import { generateWebApplicationJsonLd, generateBreadcrumbJsonLd } from '@/lib/seo/jsonld';
import { generateStaticPageMetadata } from '@/lib/seo/metadata';
import { PAGE_METADATA } from '@/lib/seo/constants';

export const metadata: Metadata = generateStaticPageMetadata(
  PAGE_METADATA.calculatorGates.title,
  PAGE_METADATA.calculatorGates.description,
  PAGE_METADATA.calculatorGates.keywords,
  PAGE_METADATA.calculatorGates.ogImage,
  PAGE_METADATA.calculatorGates.path,
);

export default function GatesCalculatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const webAppJsonLd = generateWebApplicationJsonLd(
    PAGE_METADATA.calculatorGates.title,
    PAGE_METADATA.calculatorGates.description,
    '/calculator/gates'
  );
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: 'Главная', url: '/' },
    { name: 'Калькулятор', url: '/calculator' },
    { name: 'Калькулятор ворот и калиток', url: '/calculator/gates' },
  ]);

  return (
    <>
      <JsonLdScript data={[webAppJsonLd, breadcrumbJsonLd]} />
      {children}
    </>
  );
}
