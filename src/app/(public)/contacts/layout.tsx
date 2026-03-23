import React from 'react';
import JsonLdScript from '@/components/seo/JsonLdScript';
import { generateContactPageJsonLd } from '@/lib/seo/jsonld';

export default function ContactsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const contactPageJsonLd = generateContactPageJsonLd();

  return (
    <>
      <JsonLdScript data={contactPageJsonLd} />
      {children}
    </>
  );
}
