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
  ZHALYUZI_RATE_FROM,
  ZHALYUZI_OPTIONS,
  ZHALYUZI_PLUSES,
  ZHALYUZI_LAMELI_DETAIL,
  ZHALYUZI_FAQ,
  ZHALYUZI_PLOT_OPTIONS,
} from '@/lib/landing/zaborZhalyuzi';
import { Blinds, Phone, Ruler, Wind, CheckCircle2, ArrowRight } from 'lucide-react';

export const revalidate = 86400;

const M = PAGE_METADATA.zaborZhalyuzi;

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

export default function ZaborZhalyuziPage() {
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: 'Главная', url: '/' },
    { name: 'Услуги', url: '/services' },
    { name: 'Забор жалюзи', url: '/zabor-zhalyuzi' },
  ]);

  const serviceJsonLd = generateServiceJsonLd(
    'Забор жалюзи из горизонтальных ламелей: цена за метр под ключ',
    'Забор жалюзи от 4 500 ₽ за погонный метр под ключ в Москве и МО: горизонтальные стальные ламели с полимерным покрытием, столбы 60×60, бетонирование и монтаж за 1 день. Не парусит, приватный, двусторонний вид. Гарантия 1 год.',
    `от ${formatRub(ZHALYUZI_RATE_FROM)} за погонный метр под ключ`
  );

  const faqJsonLd = generateFaqPageJsonLd(ZHALYUZI_FAQ);

  return (
    <div className="min-h-screen bg-background">
      <JsonLdScript data={[breadcrumbJsonLd, serviceJsonLd, faqJsonLd]} />
      <Header />

      <main className="pt-24">
        <section className="py-16 px-4 relative overflow-hidden">
          <div className="absolute inset-0 gradient-mesh opacity-50" />
          <div className="container mx-auto relative z-10">
            <Breadcrumbs items={[{ label: 'Услуги', href: '/services' }, { label: 'Забор жалюзи' }]} />
            <div className="max-w-3xl">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Забор жалюзи — цена за метр под ключ
              </h1>
              <p className="text-lg text-muted-foreground mb-4">
                Горизонтальные стальные ламели под углом: забор не парусит при штормовом ветре,
                закрывает участок от взглядов с улицы и выглядит одинаково аккуратно с обеих
                сторон. Монтаж за 1 день, гарантия 1 год.
              </p>
              <p className="text-2xl font-bold text-primary mb-6" data-testid="zhalyuzi-rate">
                От {formatRub(ZHALYUZI_RATE_FROM)} за погонный метр под ключ
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href="#zhalyuzi-lead"
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors"
                >
                  <Blinds className="w-5 h-5" />
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

        <section className="py-12 px-4" data-testid="zhalyuzi-pluses">
          <div className="container mx-auto max-w-5xl">
            <h2 className="text-3xl font-bold mb-8">Почему жалюзи, а не профнастил</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {ZHALYUZI_PLUSES.map((plus) => (
                <div key={plus.title} className="rounded-xl border p-6">
                  <div className="flex items-center gap-3 mb-2">
                    {plus.title === 'Не парусит' ? (
                      <Wind className="w-6 h-6 text-primary" />
                    ) : (
                      <CheckCircle2 className="w-6 h-6 text-primary" />
                    )}
                    <h3 className="font-bold text-lg">{plus.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{plus.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-12 px-4 bg-muted/30" data-testid="zhalyuzi-options">
          <div className="container mx-auto max-w-5xl">
            <h2 className="text-3xl font-bold mb-8">Варианты и цены забора жалюзи</h2>
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full text-sm" data-testid="zhalyuzi-price-table">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-4 font-semibold">Вариант (высота 2 м)</th>
                    <th className="text-left p-4 font-semibold">Особенности</th>
                    <th className="text-left p-4 font-semibold">Цена под ключ</th>
                  </tr>
                </thead>
                <tbody>
                  {ZHALYUZI_OPTIONS.map((row) => (
                    <tr key={row.option} className="border-t">
                      <td className="p-4 font-medium">{row.option}</td>
                      <td className="p-4 text-muted-foreground">{row.detail}</td>
                      <td className="p-4 font-bold text-primary">{row.price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="py-12 px-4" data-testid="zhalyuzi-lameli">
          <div className="container mx-auto max-w-5xl">
            <h2 className="text-3xl font-bold mb-8">Ламели и каркас: из чего сделан забор</h2>
            <ul className="space-y-3">
              {ZHALYUZI_LAMELI_DETAIL.map((item) => (
                <li key={item} className="flex gap-3 rounded-xl border p-4">
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="py-12 px-4 bg-muted/30" data-testid="zhalyuzi-calc-cta">
          <div className="container mx-auto max-w-3xl text-center">
            <Ruler className="w-10 h-10 text-primary mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-4">Сравните с другими заборами в калькуляторе</h2>
            <p className="text-muted-foreground mb-6">
              Посчитайте профнастил, евроштакетник и жалюзи на ваш периметр — разница станет
              наглядной за 1 минуту.
            </p>
            <Link
              href="/calculator/fence"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-xl font-semibold hover:bg-primary/90 transition-colors"
            >
              Калькулятор забора
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>

        <section className="py-12 px-4" data-testid="zhalyuzi-faq">
          <div className="container mx-auto max-w-3xl">
            <h2 className="text-3xl font-bold mb-8">Частые вопросы про забор жалюзи</h2>
            <FaqAccordion items={ZHALYUZI_FAQ} />
          </div>
        </section>

        <section className="py-12 px-4 bg-primary text-primary-foreground" id="zhalyuzi-lead">
          <div className="container mx-auto max-w-2xl">
            <h2 className="text-3xl font-bold mb-8 text-center">Заказать забор жалюзи</h2>
            <div className="rounded-2xl bg-background text-foreground p-6 md:p-8">
              <LeadForm
                source="zabor-zhalyuzi"
                plotOptions={ZHALYUZI_PLOT_OPTIONS}
                title="Замер и смета на забор жалюзи — бесплатно"
                subtitle="Замерщик приедет с образцами ламелей и каталогом цветов RAL, зафиксирует периметр до сантиметра. Смета бесплатная и ни к чему не обязывает."
              />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
