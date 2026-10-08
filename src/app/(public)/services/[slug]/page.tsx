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
import EvroshtaketnikPhotos from '@/components/seo/EvroshtaketnikPhotos';
import {
  SHAHMATKA_NOTE,
  SHAHMATKA_VARIANTS,
  SHTAKETNIK_NOTE,
  SHTAKETNIK_PER_PIECE_PRICES,
  PROFLIST_2000x1150_PRICES,
  PROFLIST_SHEET_NOTE,
} from '@/lib/landing/servicesSections';
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
    page.seoDescription || page.title
  );

  const otherServices = await prisma.pageContent.findMany({
    where: {
      isActive: true,
      category: { not: null },
      slug: { not: slug },
    },
    select: { slug: true, title: true, category: true },
    take: 4,
  });

  const relatedServices = otherServices.filter(
    (s) => s.category === page.category
  );
  const crossServices = otherServices.filter(
    (s) => s.category !== page.category
  );
  const displayServices = relatedServices.length >= 2
    ? relatedServices.slice(0, 4)
    : [...relatedServices, ...crossServices].slice(0, 4);

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
              <Link
                href={calculatorLink}
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors mb-6"
              >
                <Calculator className="w-5 h-5" />
                Рассчитать стоимость
                <ArrowRight className="w-5 h-5" />
              </Link>
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
                        <div className="text-muted-foreground leading-relaxed whitespace-pre-line">
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

        {slug === 'zabor-iz-evroshtaketnika' && <EvroshtaketnikPhotos />}

        {/* ЧТЗ_SEO_расширение_Wordstat (TASK-FRT-005): подкластер «шахматка» (4 937 показов/мес) */}
        {slug === 'zabor-iz-evroshtaketnika' && (
          <section className="py-12 px-4" data-testid="shahmatka-section">
            <div className="container mx-auto max-w-4xl">
              <h2 className="text-2xl font-bold mb-4">Забор шахматка из евроштакетника</h2>
              <p className="text-muted-foreground leading-relaxed mb-6">{SHAHMATKA_NOTE}</p>
              <div className="overflow-x-auto rounded-xl border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-4 font-semibold">Вариант монтажа</th>
                      <th className="text-left p-4 font-semibold">Особенности</th>
                      <th className="text-left p-4 font-semibold">Цена под ключ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SHAHMATKA_VARIANTS.map((row) => (
                      <tr key={row.variant} className="border-t">
                        <td className="p-4 font-medium">{row.variant}</td>
                        <td className="p-4 text-muted-foreground">{row.detail}</td>
                        <td className="p-4 font-bold text-primary">{row.price}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* ЧТЗ_SEO_расширение_Wordstat (TASK-FRT-005): подкластер «штакетник цена за штуку» (3 686) */}
        {slug === 'zabor-iz-evroshtaketnika' && (
          <section className="py-12 px-4 bg-muted/30" data-testid="shtaketnik-price-section">
            <div className="container mx-auto max-w-4xl">
              <h2 className="text-2xl font-bold mb-4">Цена евроштакетника за штуку</h2>
              <div className="overflow-x-auto rounded-xl border bg-background">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-4 font-semibold">Планка</th>
                      <th className="text-left p-4 font-semibold">Цена</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SHTAKETNIK_PER_PIECE_PRICES.map((row) => (
                      <tr key={row.size} className="border-t">
                        <td className="p-4 font-medium">{row.size}</td>
                        <td className="p-4 font-bold text-primary">{row.price}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-sm text-muted-foreground mt-4">{SHTAKETNIK_NOTE}</p>
            </div>
          </section>
        )}

        {/* ЧТЗ_SEO_расширение_Wordstat (TASK-FRT-005): подкластер «профлист 2000х1150 цена» (10 261) */}
        {slug === 'zabor-iz-profnastila' && (
          <section className="py-12 px-4" data-testid="proflist-price-section">
            <div className="container mx-auto max-w-4xl">
              <h2 className="text-2xl font-bold mb-4">Цена профлиста для забора за лист 2000×1150</h2>
              <div className="overflow-x-auto rounded-xl border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-4 font-semibold">Марка и толщина</th>
                      <th className="text-left p-4 font-semibold">Покрытие</th>
                      <th className="text-left p-4 font-semibold">Цена за лист</th>
                      <th className="text-left p-4 font-semibold">Цена за м²</th>
                    </tr>
                  </thead>
                  <tbody>
                    {PROFLIST_2000x1150_PRICES.map((row) => (
                      <tr key={`${row.mark}-${row.coating}`} className="border-t">
                        <td className="p-4 font-medium">{row.mark}</td>
                        <td className="p-4 text-muted-foreground">{row.coating}</td>
                        <td className="p-4 font-bold text-primary">{row.pricePerSheet}</td>
                        <td className="p-4 text-muted-foreground">{row.pricePerSqm}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-sm text-muted-foreground mt-4">{PROFLIST_SHEET_NOTE}</p>
            </div>
          </section>
        )}

        {displayServices.length > 0 && (
          <section className="py-16 px-4 bg-secondary/30">
            <div className="container mx-auto max-w-4xl">
              <h2 className="text-2xl font-bold mb-8">Другие услуги</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {displayServices.map((s) => (
                  <Link
                    key={s.slug}
                    href={`/services/${s.slug}`}
                    className="card-modern p-5 hover-lift group flex items-center justify-between"
                  >
                    <div>
                      <h3 className="font-semibold group-hover:text-primary transition-colors">
                        {s.title}
                      </h3>
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

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
