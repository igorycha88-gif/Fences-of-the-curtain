import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import JsonLdScript from '@/components/seo/JsonLdScript';
import { generateBreadcrumbJsonLd, generateServiceJsonLd } from '@/lib/seo/jsonld';
import { generatePageMetadata } from '@/lib/seo/metadata';
import { SEO_CONFIG } from '@/lib/seo/constants';
import { Calculator, ArrowRight } from 'lucide-react';

export const revalidate = 3600;

export async function generateMetadata({ params }: ServicePageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await prisma.pageContent.findFirst({
    where: { slug, category: { not: null }, isActive: true },
    select: { title: true, seoTitle: true, seoDescription: true, seoKeywords: true },
  });

  if (!page) return {};

  return generatePageMetadata({
    title: page.seoTitle || page.title,
    description: page.seoDescription || SEO_CONFIG.DEFAULT_DESCRIPTION,
    keywords: page.seoKeywords ? page.seoKeywords.split(',').map(k => k.trim()) : [],
    path: `/services/${slug}`,
  });
}

interface ServicePageProps {
  params: Promise<{ slug: string }>;
}

export default async function ServicePage({ params }: ServicePageProps) {
  const { slug } = await params;

  const page = await prisma.pageContent.findFirst({
    where: {
      slug,
      category: { not: null },
      isActive: true,
    },
  });

  if (!page) {
    notFound();
  }

  const content =
    typeof page.content === 'string'
      ? JSON.parse(page.content)
      : page.content;

  const calculatorLink =
    page.category === 'canopy' ? '/calculator/canopy' : '/calculator/fence';

  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: 'Главная', url: '/' },
    { name: 'Услуги', url: '/services' },
    { name: page.title, url: `/services/${slug}` },
  ]);

  const serviceJsonLd = generateServiceJsonLd(
    page.title,
    page.seoDescription || page.title,
    page.priceRange || undefined
  );

  return (
    <div className="min-h-screen bg-background">
      <JsonLdScript data={[breadcrumbJsonLd, serviceJsonLd]} />
      <Header />

      <main className="pt-24">
        <section className="py-16 px-4 relative overflow-hidden">
          <div className="absolute inset-0 gradient-mesh opacity-50" />
          <div className="container mx-auto relative z-10">
            <Breadcrumbs
              items={[
                { label: 'Услуги', href: '/services' },
                { label: page.title },
              ]}
            />
            <div className="max-w-4xl">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                {page.title}
              </h1>
              {page.priceRange && (
                <p className="text-2xl text-primary font-semibold mb-4">
                  {page.priceRange}
                </p>
              )}
              {page.seoDescription && (
                <p className="text-lg text-muted-foreground mb-8">
                  {page.seoDescription}
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="py-16 px-4">
          <div className="container mx-auto max-w-4xl">
            {content.description && (
              <div className="prose prose-lg max-w-none mb-12">
                <p>{content.description}</p>
              </div>
            )}

            {content.sections && Array.isArray(content.sections) && (
              <div className="space-y-12">
                {content.sections.map(
                  (section: { title?: string; text?: string }, index: number) => (
                    <div key={index}>
                      {section.title && (
                        <h2 className="text-2xl font-bold mb-4">
                          {section.title}
                        </h2>
                      )}
                      {section.text && (
                        <div className="text-muted-foreground leading-relaxed">
                          {section.text}
                        </div>
                      )}
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </section>

        <section className="py-16 px-4 bg-primary text-primary-foreground">
          <div className="container mx-auto max-w-3xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Рассчитать стоимость
            </h2>
            <p className="text-xl opacity-90 mb-8">
              Узнайте точную цену за несколько секунд — бесплатно и без обязательств
            </p>
            <Link
              href={calculatorLink}
              className="inline-flex items-center justify-center gap-2 bg-white text-primary px-8 py-4 rounded-xl font-semibold hover:bg-white/90 transition-colors"
            >
              <Calculator className="w-5 h-5" />
              Рассчитать стоимость
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
