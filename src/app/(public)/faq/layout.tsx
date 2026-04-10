import React from 'react';
import { Metadata } from 'next';
import JsonLdScript from '@/components/seo/JsonLdScript';
import { generateBreadcrumbJsonLd, generateFaqPageJsonLd } from '@/lib/seo/jsonld';
import { generateStaticPageMetadata } from '@/lib/seo/metadata';
import { PAGE_METADATA } from '@/lib/seo/constants';
import { prisma } from '@/lib/prisma';

export const metadata: Metadata = generateStaticPageMetadata(
  PAGE_METADATA.faq.title,
  PAGE_METADATA.faq.description,
  PAGE_METADATA.faq.keywords,
  PAGE_METADATA.faq.ogImage,
  PAGE_METADATA.faq.path,
);

export default async function FaqLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: 'Главная', url: '/' },
    { name: 'FAQ', url: '/faq' },
  ]);

  const faqItems = await prisma.faqItem.findMany({
    where: { isActive: true },
    select: { question: true, answer: true },
    orderBy: { sortOrder: 'asc' },
  });

  const faqPageJsonLd = faqItems.length > 0
    ? generateFaqPageJsonLd(faqItems.map(i => ({ question: i.question, answer: i.answer })))
    : null;

  const jsonLdData = faqPageJsonLd
    ? [breadcrumbJsonLd, faqPageJsonLd]
    : [breadcrumbJsonLd];

  return (
    <>
      <JsonLdScript data={jsonLdData} />
      {children}
    </>
  );
}
