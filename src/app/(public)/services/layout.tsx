import React from 'react';
import { Metadata } from 'next';
import JsonLdScript from '@/components/seo/JsonLdScript';
import { SERVICES_JSON_LD } from '@/lib/seo/jsonld';
import { generateStaticPageMetadata } from '@/lib/seo/metadata';
import { PAGE_METADATA } from '@/lib/seo/constants';

export const metadata: Metadata = generateStaticPageMetadata(
  PAGE_METADATA.services.title,
  PAGE_METADATA.services.description,
  PAGE_METADATA.services.keywords,
  PAGE_METADATA.services.ogImage,
  PAGE_METADATA.services.path,
);

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
