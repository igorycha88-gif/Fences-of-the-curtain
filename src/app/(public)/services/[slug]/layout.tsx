import React from 'react';
import JsonLdScript from '@/components/seo/JsonLdScript';
import { generateBreadcrumbJsonLd, generateServiceJsonLd } from '@/lib/seo/jsonld';
import { prisma } from '@/lib/prisma';

interface ServiceSlugLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export default async function ServiceSlugLayout({
  children,
  params,
}: ServiceSlugLayoutProps) {
  const { slug } = await params;

  const page = await prisma.pageContent.findFirst({
    where: {
      slug,
      category: { not: null },
      isActive: true,
    },
  });

  const serviceName = page?.title || 'Услуга';

  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: 'Главная', url: '/' },
    { name: 'Услуги', url: '/services' },
    { name: serviceName },
  ]);

  const serviceJsonLd = generateServiceJsonLd(
    serviceName,
    page?.seoDescription || ''
  );

  return (
    <>
      <JsonLdScript data={[breadcrumbJsonLd, serviceJsonLd]} />
      {children}
    </>
  );
}
