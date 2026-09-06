import React from 'react';
import { Metadata } from 'next';
import { generateStaticPageMetadata } from '@/lib/seo/metadata';
import { PAGE_METADATA } from '@/lib/seo/constants';

// Layout с title-строкой отменяет суффикс-шаблон root layout
// («| Заборы и Навесы») для размерных посадочных /navesy/* —
// их title уже содержит всё нужное и должен оставаться коротким (SEO).
export const metadata: Metadata = generateStaticPageMetadata(
  PAGE_METADATA.navesySizes.title,
  PAGE_METADATA.navesySizes.description,
  PAGE_METADATA.navesySizes.keywords,
  PAGE_METADATA.navesySizes.ogImage,
  PAGE_METADATA.navesySizes.path,
);

export default function NavesyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
