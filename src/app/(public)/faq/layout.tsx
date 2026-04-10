import React from 'react';
import { Metadata } from 'next';
import { generateStaticPageMetadata } from '@/lib/seo/metadata';
import { PAGE_METADATA } from '@/lib/seo/constants';

export const metadata: Metadata = generateStaticPageMetadata(
  PAGE_METADATA.faq.title,
  PAGE_METADATA.faq.description,
  PAGE_METADATA.faq.keywords,
  PAGE_METADATA.faq.ogImage,
  PAGE_METADATA.faq.path,
);

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
