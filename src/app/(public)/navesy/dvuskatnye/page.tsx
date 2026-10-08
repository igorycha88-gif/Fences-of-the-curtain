import Link from 'next/link';
import { Metadata } from 'next';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import JsonLdScript from '@/components/seo/JsonLdScript';
import TrackedPhoneLink from '@/components/seo/TrackedPhoneLink';
import FaqAccordion from '@/components/geo/FaqAccordion';
import LeadForm from '@/components/seo/LeadForm';
import {
  generateBreadcrumbJsonLd,
  generateServiceJsonLd,
  generateFaqPageJsonLd,
} from '@/lib/seo/jsonld';
import { generatePageMetadata } from '@/lib/seo/metadata';
import { PAGE_METADATA } from '@/lib/seo/constants';
import {
  DVUSKATNYE_NAVESY_TYPES,
  DVUSKATNYE_NAVESY_FEATURES,
  DVUSKATNYE_NAVESY_FAQ,
  NAVES_PLOT_OPTIONS,
} from '@/lib/landing/navesyKonstrukcii';
import { Warehouse, Phone, Ruler, Coins, CheckCircle2, ArrowRight } from 'lucide-react';

export const revalidate = 86400;

const M = PAGE_METADATA.navesyDvuskatnye;

export const metadata: Metadata = {
  ...generatePageMetadata({
    title: M.title,
    description: M.description,
    keywords: M.keywords,
    path: M.path,
    ogImage: M.ogImage,
  }),
  title: { absolute: M.title },
};

function formatRub(value: number): string {
  return `${value.toLocaleString('ru-RU')} ₽`;
}

export default function NavesyDvuskatnyePage() {
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: 'Главная', url: '/' },
    { name: 'Навесы', url: '/navesy-pod-klyuch' },
    { name: 'Двускатные навесы', url: '/navesy/dvuskatnye' },
  ]);

  const serviceJsonLd = generateServiceJsonLd(
    'Двускатные навесы для автомобилей и дачи под ключ',
    'Двускатный навес от 68 000 ₽ под ключ в Москве и МО: крыша-«домик» с коньком, кровля из поликарбоната, профлиста или металлочерепицы, монтаж за 1–2 дня. Гарантия 1 год.',
    `от ${formatRub(DVUSKATNYE_NAVESY_TYPES[0].priceFrom)} за навес 6×3 м под ключ`
  );

  const faqJsonLd = generateFaqPageJsonLd(DVUSKATNYE_NAVESY_FAQ);

  return (
    <div className="min-h-screen bg-background">
      <JsonLdScript data={[breadcrumbJsonLd, serviceJsonLd, faqJsonLd]} />
      <Header />

      <main className="pt-24">
        <section className="py-16 px-4 relative overflow-hidden">
          <div className="absolute inset-0 gradient-mesh opacity-50" />
          <div className="container mx-auto relative z-10">
            <Breadcrumbs items={[{ label: 'Навесы', href: '/navesy-pod-klyuch' }, { label: 'Двускатные навесы' }]} />
            <div className="max-w-3xl">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Двускатный навес для авто и дачи
              </h1>
              <p className="text-lg text-muted-foreground mb-4">
                Крыша-«домик» с коньком: снег и вода уходят на две стороны, навес смотрится как
                самостоятельное строение. Кровля — поликарбонат, профлист или металлочерепица под
                стиль дома. Монтаж за 1–2 дня.
              </p>
              <p className="text-2xl font-bold text-primary mb-6" data-testid="dvuskatnye-rate">
                От {formatRub(DVUSKATNYE_NAVESY_TYPES[0].priceFrom)} за навес 6×3 м под ключ
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href="#dvuskatnye-lead"
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors"
                >
                  <Warehouse className="w-5 h-5" />
                  Бесплатный замер
                  <ArrowRight className="w-5 h-5" />
                </a>
                <TrackedPhoneLink
                  href="tel:+74993901595"
                  className="inline-flex items-center gap-2 border border-primary/30 text-primary px-6 py-3 rounded-xl font-semibold hover:bg-primary/5 transition-colors"
                >
                  <Phone className="w-5 h-5" />
                  +7 (499) 390-15-95
                </TrackedPhoneLink>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 px-4" data-testid="dvuskatnye-sizes">
          <div className="container mx-auto max-w-5xl">
            <h2 className="text-3xl font-bold mb-8">Размеры и цены двускатных навесов</h2>
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full text-sm" data-testid="dvuskatnye-price-table">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-4 font-semibold">Навес</th>
                    <th className="text-left p-4 font-semibold">Назначение</th>
                    <th className="text-left p-4 font-semibold">Цена под ключ</th>
                  </tr>
                </thead>
                <tbody>
                  {DVUSKATNYE_NAVESY_TYPES.map((row) => (
                    <tr key={row.type} className="border-t">
                      <td className="p-4 font-medium">{row.type}</td>
                      <td className="p-4 text-muted-foreground">{row.purpose}</td>
                      <td className="p-4 font-bold text-primary">от {formatRub(row.priceFrom)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="py-12 px-4 bg-muted/30" data-testid="dvuskatnye-features">
          <div className="container mx-auto max-w-5xl">
            <h2 className="text-3xl font-bold mb-8">Конструкция двускатного навеса</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {DVUSKATNYE_NAVESY_FEATURES.map((feature) => (
                <div key={feature.title} className="rounded-xl border bg-background p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <CheckCircle2 className="w-6 h-6 text-primary" />
                    <h3 className="font-bold text-lg">{feature.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{feature.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-12 px-4" data-testid="dvuskatnye-calc-cta">
          <div className="container mx-auto max-w-3xl text-center">
            <Ruler className="w-10 h-10 text-primary mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-4">Рассчитайте двускатный навес в калькуляторе</h2>
            <p className="text-muted-foreground mb-6">
              Точная цена на ваш размер с выбором кровли — за 1 минуту, без звонка.
            </p>
            <Link
              href="/calculator/canopy"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-xl font-semibold hover:bg-primary/90 transition-colors"
            >
              <Coins className="w-5 h-5" />
              Калькулятор навеса
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>

        <section className="py-12 px-4 bg-muted/30" data-testid="dvuskatnye-faq">
          <div className="container mx-auto max-w-3xl">
            <h2 className="text-3xl font-bold mb-8">Частые вопросы про двускатные навесы</h2>
            <FaqAccordion items={DVUSKATNYE_NAVESY_FAQ} />
          </div>
        </section>

        <section className="py-12 px-4 bg-primary text-primary-foreground" id="dvuskatnye-lead">
          <div className="container mx-auto max-w-2xl">
            <h2 className="text-3xl font-bold mb-8 text-center">Заказать двускатный навес</h2>
            <div className="rounded-2xl bg-background text-foreground p-6 md:p-8">
              <LeadForm
                source="navesy-dvuskatnye"
                plotOptions={NAVES_PLOT_OPTIONS}
                title="Замер навеса с выбором кровли — бесплатно"
                subtitle="Замерщик приедет с образцами поликарбоната и металлочерепицы, зафиксирует размер парковки. Смета бесплатная и ни к чему не обязывает."
                selectLabel="Размер навеса"
              />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
