import React from 'react';
import JsonLdScript from '@/components/seo/JsonLdScript';
import { generateContactPageJsonLd, generateBreadcrumbJsonLd } from '@/lib/seo/jsonld';

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
