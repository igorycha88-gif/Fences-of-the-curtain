import { Metadata } from 'next';
import React from 'react';
import JsonLdScript from '@/components/seo/JsonLdScript';
import { generateContactPageJsonLd, generateBreadcrumbJsonLd } from '@/lib/seo/jsonld';
import { generatePageMetadata } from '@/lib/seo/metadata';
import { PAGE_METADATA } from '@/lib/seo/constants';

export const metadata: Metadata = generatePageMetadata({
  title: PAGE_METADATA.contacts.title,
  description: PAGE_METADATA.contacts.description,
  keywords: PAGE_METADATA.contacts.keywords,
  ogImage: PAGE_METADATA.contacts.ogImage,
});

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
