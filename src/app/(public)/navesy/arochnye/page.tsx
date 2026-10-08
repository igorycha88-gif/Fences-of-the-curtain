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
  AROCHNYE_NAVESY_TYPES,
  AROCHNYE_NAVESY_FEATURES,
  AROCHNYE_NAVESY_FAQ,
  NAVES_PLOT_OPTIONS,
} from '@/lib/landing/navesyKonstrukcii';
import { ArrowUpRight, Phone, Ruler, Coins, CheckCircle2, ArrowRight } from 'lucide-react';

export const revalidate = 86400;

const M = PAGE_METADATA.navesyArochnye;

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

export default function NavesyArochnyePage() {
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: 'Главная', url: '/' },
    { name: 'Навесы', url: '/navesy-pod-klyuch' },
    { name: 'Арочные навесы', url: '/navesy/arochnye' },
  ]);

  const serviceJsonLd = generateServiceJsonLd(
    'Арочные навесы для автомобилей из поликарбоната под ключ',
    'Арочный навес для авто от 70 000 ₽ под ключ в Москве и МО: гнутые фермы из профильной трубы, сотовый поликарбонат 8–10 мм, расчёт под снеговую нагрузку МО, монтаж за 1–2 дня. Гарантия 1 год.',
    `от ${formatRub(AROCHNYE_NAVESY_TYPES[0].priceFrom)} за навес 6×3 м под ключ`
  );

  const faqJsonLd = generateFaqPageJsonLd(AROCHNYE_NAVESY_FAQ);

  return (
    <div className="min-h-screen bg-background">
      <JsonLdScript data={[breadcrumbJsonLd, serviceJsonLd, faqJsonLd]} />
      <Header />

      <main className="pt-24">
        <section className="py-16 px-4 relative overflow-hidden">
          <div className="absolute inset-0 gradient-mesh opacity-50" />
          <div className="container mx-auto relative z-10">
            <Breadcrumbs items={[{ label: 'Навесы', href: '/navesy-pod-klyuch' }, { label: 'Арочные навесы' }]} />
            <div className="max-w-3xl">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Арочный навес для автомобиля из поликарбоната
              </h1>
              <p className="text-lg text-muted-foreground mb-4">
                Классическая дуга: снег скатывается по кровле на две стороны сам — чистить навес
                зимой не нужно. Гнутые фермы, поликарбонат без стыков по арке, монтаж за 1–2 дня.
              </p>
              <p className="text-2xl font-bold text-primary mb-6" data-testid="arochnye-rate">
                От {formatRub(AROCHNYE_NAVESY_TYPES[0].priceFrom)} за навес 6×3 м под ключ
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href="#arochnye-lead"
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors"
                >
                  <ArrowUpRight className="w-5 h-5" />
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

        <section className="py-12 px-4" data-testid="arochnye-sizes">
          <div className="container mx-auto max-w-5xl">
            <h2 className="text-3xl font-bold mb-8">Размеры и цены арочных навесов</h2>
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full text-sm" data-testid="arochnye-price-table">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-4 font-semibold">Навес</th>
                    <th className="text-left p-4 font-semibold">Назначение</th>
                    <th className="text-left p-4 font-semibold">Цена под ключ</th>
                  </tr>
                </thead>
                <tbody>
                  {AROCHNYE_NAVESY_TYPES.map((row) => (
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

        <section className="py-12 px-4 bg-muted/30" data-testid="arochnye-features">
          <div className="container mx-auto max-w-5xl">
            <h2 className="text-3xl font-bold mb-8">Конструкция арочного навеса</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {AROCHNYE_NAVESY_FEATURES.map((feature) => (
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

        <section className="py-12 px-4" data-testid="arochnye-calc-cta">
          <div className="container mx-auto max-w-3xl text-center">
            <Ruler className="w-10 h-10 text-primary mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-4">Рассчитайте арочный навес в калькуляторе</h2>
            <p className="text-muted-foreground mb-6">
              Точная цена на ваш размер с кровлей по выбору — за 1 минуту, без звонка.
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

        <section className="py-12 px-4 bg-muted/30" data-testid="arochnye-faq">
          <div className="container mx-auto max-w-3xl">
            <h2 className="text-3xl font-bold mb-8">Частые вопросы про арочные навесы</h2>
            <FaqAccordion items={AROCHNYE_NAVESY_FAQ} />
          </div>
        </section>

        <section className="py-12 px-4 bg-primary text-primary-foreground" id="arochnye-lead">
          <div className="container mx-auto max-w-2xl">
            <h2 className="text-3xl font-bold mb-8 text-center">Заказать арочный навес</h2>
            <div className="rounded-2xl bg-background text-foreground p-6 md:p-8">
              <LeadForm
                source="navesy-arochnye"
                plotOptions={NAVES_PLOT_OPTIONS}
                title="Замер навеса с расчётом под снеговую нагрузку — бесплатно"
                subtitle="Замерщик приедет с образцами поликарбоната, зафиксирует размер парковки и уклон участка. Смета бесплатная и ни к чему не обязывает."
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
