import React from 'react';
import { Metadata } from 'next';
import JsonLdScript from '@/components/seo/JsonLdScript';
import { generateContactPageJsonLd, generateBreadcrumbJsonLd } from '@/lib/seo/jsonld';
import { generateStaticPageMetadata } from '@/lib/seo/metadata';
import { PAGE_METADATA } from '@/lib/seo/constants';

export const metadata: Metadata = generateStaticPageMetadata(
  PAGE_METADATA.contacts.title,
  PAGE_METADATA.contacts.description,
  PAGE_METADATA.contacts.keywords,
  PAGE_METADATA.contacts.ogImage,
  PAGE_METADATA.contacts.path,
);

export default function ContactsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const contactPageJsonLd = generateContactPageJsonLd();
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: 'Главная', url: '/' },
    { name: 'Контакты', url: '/contacts' },
  ]);

  return (
    <>
      <JsonLdScript data={[contactPageJsonLd, breadcrumbJsonLd]} />
      {children}
    </>
  );
}
