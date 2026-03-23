import { Metadata } from 'next';
import React from 'react';
import JsonLdScript from '@/components/seo/JsonLdScript';
import { SERVICES_JSON_LD } from '@/lib/seo/jsonld';
import { generatePageMetadata } from '@/lib/seo/metadata';
import { PAGE_METADATA } from '@/lib/seo/constants';

export const metadata: Metadata = generatePageMetadata({
  title: PAGE_METADATA.services.title,
  description: PAGE_METADATA.services.description,
  keywords: PAGE_METADATA.services.keywords,
  ogImage: PAGE_METADATA.services.ogImage,
});

export default function ServicesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <JsonLdScript data={SERVICES_JSON_LD} />
      {children}
    </>
  );
}
