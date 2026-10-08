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
  POD_KLYUCH_MATERIALS,
  POD_KLYUCH_INCLUDED,
  POD_KLYUCH_SROKI,
  POD_KLYUCH_FAQ,
  POD_KLYUCH_PLOT_OPTIONS,
} from '@/lib/landing/zaboryPodKlyuch';
import { Fence, Phone, Ruler, Coins, ListChecks, CalendarClock, ArrowRight } from 'lucide-react';

export const revalidate = 86400;

const M = PAGE_METADATA.zaboryPodKlyuch;

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

export default function ZaboryPodKlyuchPage() {
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: 'Главная', url: '/' },
    { name: 'Услуги', url: '/services' },
    { name: 'Забор под ключ', url: '/zabory-pod-klyuch' },
  ]);

  const serviceJsonLd = generateServiceJsonLd(
    'Забор под ключ в Московской области: цена за погонный метр',
    'Забор под ключ от 2 600 ₽ за погонный метр в Москве и МО: материалы собственного производства, бетонирование столбов на 1,2 м, сварной каркас, монтаж за 1–3 дня, гарантия 1 год. Бесплатный замер и фиксированная смета.',
    `от ${formatRub(POD_KLYUCH_MATERIALS[0].rateFrom)} за погонный метр под ключ`
  );

  const faqJsonLd = generateFaqPageJsonLd(POD_KLYUCH_FAQ);

  return (
    <div className="min-h-screen bg-background">
      <JsonLdScript data={[breadcrumbJsonLd, serviceJsonLd, faqJsonLd]} />
      <Header />

      <main className="pt-24">
        <section className="py-16 px-4 relative overflow-hidden">
          <div className="absolute inset-0 gradient-mesh opacity-50" />
          <div className="container mx-auto relative z-10">
            <Breadcrumbs items={[{ label: 'Услуги', href: '/services' }, { label: 'Забор под ключ' }]} />
            <div className="max-w-3xl">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Забор под ключ в Московской области — цена за метр
              </h1>
              <p className="text-lg text-muted-foreground mb-4">
                Один подрядчик на весь цикл: замер, материалы собственного производства,
                бетонирование столбов на глубину промерзания, монтаж за 1–3 дня и гарантия 1 год.
                Смета фиксируется до начала работ — доплат «по факту» не будет.
              </p>
              <p className="text-2xl font-bold text-primary mb-6" data-testid="pod-klyuch-rate">
                От {formatRub(POD_KLYUCH_MATERIALS[0].rateFrom)} за погонный метр под ключ
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href="#pod-klyuch-lead"
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors"
                >
                  <Fence className="w-5 h-5" />
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

        <section className="py-12 px-4" data-testid="pod-klyuch-materials">
          <div className="container mx-auto max-w-5xl">
            <h2 className="text-3xl font-bold mb-8">Цены под ключ по материалам (высота 2 м)</h2>
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full text-sm" data-testid="pod-klyuch-price-table">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-4 font-semibold">Материал</th>
                    <th className="text-left p-4 font-semibold">Цена за метр под ключ</th>
                    <th className="text-left p-4 font-semibold">Кому подходит</th>
                  </tr>
                </thead>
                <tbody>
                  {POD_KLYUCH_MATERIALS.map((row) => (
                    <tr key={row.material} className="border-t">
                      <td className="p-4 font-medium">{row.material}</td>
                      <td className="p-4 font-bold text-primary" data-testid="rate">
                        от {formatRub(row.rateFrom)}
                      </td>
                      <td className="p-4 text-muted-foreground">{row.highlight}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Не знаете, что выбрать? Сравнение видов — в статье{' '}
              <Link href="/blog/kakoy-zabor-vybrat" className="text-primary font-medium hover:underline">
                «Какой забор выбрать для частного дома»
              </Link>
              .
            </p>
          </div>
        </section>

        <section className="py-12 px-4 bg-muted/30" data-testid="pod-klyuch-included">
          <div className="container mx-auto max-w-5xl">
            <h2 className="text-3xl font-bold mb-8">Что входит в «под ключ»</h2>
            <div className="grid gap-4">
              {POD_KLYUCH_INCLUDED.map((item) => (
                <div key={item.item} className="flex gap-4 rounded-xl border bg-background p-5">
                  <ListChecks className="w-6 h-6 text-primary shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold">{item.item}</h3>
                    <p className="text-sm text-muted-foreground">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-12 px-4" data-testid="pod-klyuch-sroki">
          <div className="container mx-auto max-w-5xl">
            <div className="flex items-center gap-3 mb-8">
              <CalendarClock className="w-8 h-8 text-primary" />
              <h2 className="text-3xl font-bold">Сроки установки</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {POD_KLYUCH_SROKI.map((row) => (
                <div key={row.plot} className="rounded-xl border p-6 text-center">
                  <p className="font-medium mb-2">{row.plot}</p>
                  <p className="text-2xl font-bold text-primary">{row.days}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-12 px-4 bg-muted/30" data-testid="pod-klyuch-calc-cta">
          <div className="container mx-auto max-w-3xl text-center">
            <Ruler className="w-10 h-10 text-primary mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-4">Рассчитайте забор в калькуляторе</h2>
            <p className="text-muted-foreground mb-6">
              Цена на ваш периметр за 1 минуту — по всем материалам из таблицы, без звонка.
            </p>
            <Link
              href="/calculator/fence"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-xl font-semibold hover:bg-primary/90 transition-colors"
            >
              <Coins className="w-5 h-5" />
              Калькулятор забора
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>

        <section className="py-12 px-4" data-testid="pod-klyuch-faq">
          <div className="container mx-auto max-w-3xl">
            <h2 className="text-3xl font-bold mb-8">Частые вопросы про забор под ключ</h2>
            <FaqAccordion items={POD_KLYUCH_FAQ} />
          </div>
        </section>

        <section className="py-12 px-4 bg-primary text-primary-foreground" id="pod-klyuch-lead">
          <div className="container mx-auto max-w-2xl">
            <h2 className="text-3xl font-bold mb-8 text-center">Заказать забор под ключ</h2>
            <div className="rounded-2xl bg-background text-foreground p-6 md:p-8">
              <LeadForm
                source="zabory-pod-klyuch"
                plotOptions={POD_KLYUCH_PLOT_OPTIONS}
                title="Замер периметра и фиксация сметы — бесплатно"
                subtitle="Замерщик приедет с рулеткой и образцами материалов, зафиксирует точный периметр до сантиметра. Смета бесплатная и ни к чему не обязывает."
              />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
