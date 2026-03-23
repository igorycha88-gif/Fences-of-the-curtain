import React from 'react';
import JsonLdScript from '@/components/seo/JsonLdScript';
import { SERVICES_JSON_LD } from '@/lib/seo/jsonld';

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
