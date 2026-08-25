import React from 'react';
import { Metadata } from 'next';
import { generateStaticPageMetadata } from '@/lib/seo/metadata';
import { PAGE_METADATA } from '@/lib/seo/constants';

export const metadata: Metadata = generateStaticPageMetadata(
  PAGE_METADATA.geo.title,
  PAGE_METADATA.geo.description,
  PAGE_METADATA.geo.keywords,
  PAGE_METADATA.geo.ogImage,
  PAGE_METADATA.geo.path,
);

export default function ZaboryNavesyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
