import React from 'react';
import { Metadata } from 'next';
import JsonLdScript from '@/components/seo/JsonLdScript';
import { generateBreadcrumbJsonLd } from '@/lib/seo/jsonld';
import { generatePageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = generatePageMetadata({
  title: 'Статьи о заборах и навесах — Полезные советы',
  description: 'Полезные статьи о выборе забора, навеса, материалов. Советы по установке и уходу. Москва и МО.',
  keywords: ['статьи заборы', 'советы навесы', 'как выбрать забор', 'забор из профнастила статьи', 'евроштакетник обзор'],
  path: '/blog',
  ogImage: '/og/og-main.jpg',
});

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: 'Главная', url: '/' },
    { name: 'Блог', url: '/blog' },
  ]);

  return (
    <>
      <JsonLdScript data={breadcrumbJsonLd} />
      {children}
    </>
  );
}
