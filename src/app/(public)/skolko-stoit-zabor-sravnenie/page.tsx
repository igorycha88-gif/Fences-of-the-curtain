import Link from 'next/link';
import { Metadata } from 'next';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import JsonLdScript from '@/components/seo/JsonLdScript';
import TrackedPhoneLink from '@/components/seo/TrackedPhoneLink';
import FaqAccordion from '@/components/geo/FaqAccordion';
import MontageInDayBanner from '@/components/seo/MontageInDayBanner';
import {
  generateBreadcrumbJsonLd,
  generateServiceJsonLd,
  generateFaqPageJsonLd,
} from '@/lib/seo/jsonld';
import { generatePageMetadata } from '@/lib/seo/metadata';
import { PAGE_METADATA } from '@/lib/seo/constants';
import {
  RATE_PROFNASTIL,
  RATE_EVROSHTAKETNIK,
  RATE_RABICA,
  MATERIAL_RATES,
  SOTKI_EXAMPLES,
  CONTRACTORS_COMPARISON,
  PRICE_TRAPS,
  SRAVNENIE_FAQ,
} from '@/lib/zabor/sravnenie';
import { Calculator, ArrowRight, Phone, Scale, AlertTriangle } from 'lucide-react';

export const revalidate = 86400;

const M = PAGE_METADATA.zaborStoitSravnenie;

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

export default function SkolkoStoitZaborSravneniePage() {
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: 'Главная', url: '/' },
    { name: 'Сколько стоит забор: сравнение цен', url: '/skolko-stoit-zabor-sravnenie' },
  ]);

  const serviceJsonLd = generateServiceJsonLd(
    'Забор под ключ — цены и сравнение подрядчиков МО',
    'Сколько стоит забор из профлиста, евроштакетника и сетки под ключ: цены за погонный метр, сметы на 6–15 соток, сравнение подрядчиков Московской области и разбор ценовых ловушек.',
    'от 550 RUB за погонный метр под ключ'
  );

  const faqJsonLd = generateFaqPageJsonLd(SRAVNENIE_FAQ);

  return (
    <div className="min-h-screen bg-background">
      <JsonLdScript data={[breadcrumbJsonLd, serviceJsonLd, faqJsonLd]} />
      <Header />

      <main className="pt-24">
        <section className="py-16 px-4 relative overflow-hidden">
          <div className="absolute inset-0 gradient-mesh opacity-50" />
          <div className="container mx-auto relative z-10">
            <Breadcrumbs items={[{ label: 'Сколько стоит забор: сравнение цен' }]} />
            <div className="max-w-4xl">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Сколько стоит забор: сравнение цен
              </h1>
              <p className="text-lg text-muted-foreground mb-6">
                Честный разбор цен на заборы в Москве и МО в 2026 году: сколько стоит погонный
                метр по материалам, сколько выходит на 6, 10 и 15 соток, по каким критериям
                сравнивать подрядчиков — и почему «дешёвые» объявления в итоге дорожают.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/skolko-pogonnyh-metrov-v-sotkah"
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors"
                >
                  <Calculator className="w-5 h-5" />
                  Таблица: сотки → метры
                  <ArrowRight className="w-5 h-5" />
                </Link>
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

        <section className="py-12 px-4">
          <div className="container mx-auto max-w-5xl">
            <h2 className="text-2xl font-bold mb-6">Цена за погонный метр по материалам</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border rounded-xl overflow-hidden bg-background" data-testid="material-rates-table">
                <thead>
                  <tr className="bg-secondary text-left">
                    <th className="px-4 py-3 font-semibold">Материал</th>
                    <th className="px-4 py-3 font-semibold">Цена за пог. метр</th>
                    <th className="px-4 py-3 font-semibold">Что входит</th>
                    <th className="px-4 py-3 font-semibold">Срок монтажа</th>
                  </tr>
                </thead>
                <tbody>
                  {MATERIAL_RATES.map((row) => (
                    <tr key={row.material} className="border-t">
                      <td className="px-4 py-3 font-medium">{row.material}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-primary font-semibold">
                        {row.ratePerMeter ? `от ${formatRub(row.ratePerMeter)}` : 'по расчёту'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{row.includes}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{row.term}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Цены ориентировочные «под ключ» на 09.2026 для забора высотой 2 м на ровном
              участке. Точная смета под ваш рельеф и длину — в калькуляторе забора.
            </p>
          </div>
        </section>

        <section className="py-12 px-4 bg-secondary/30">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-2xl font-bold mb-6">Сколько выходит на 6, 10 и 15 соток</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border rounded-xl overflow-hidden bg-background" data-testid="sotki-costs-table">
                <thead>
                  <tr className="bg-secondary text-left">
                    <th className="px-4 py-3 font-semibold">Участок</th>
                    <th className="px-4 py-3 font-semibold">Периметр</th>
                    <th className="px-4 py-3 font-semibold">Профнастил</th>
                    <th className="px-4 py-3 font-semibold">Евроштакетник</th>
                    <th className="px-4 py-3 font-semibold">Рабица</th>
                  </tr>
                </thead>
                <tbody>
                  {SOTKI_EXAMPLES.map((row) => (
                    <tr key={row.sotki} className="border-t">
                      <td className="px-4 py-3 font-medium whitespace-nowrap">{row.sotki}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{row.perimeterM} м</td>
                      <td className="px-4 py-3 whitespace-nowrap text-primary font-semibold">
                        от {formatRub(row.perimeterM * RATE_PROFNASTIL)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-primary font-semibold">
                        от {formatRub(row.perimeterM * RATE_EVROSHTAKETNIK)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-primary font-semibold">
                        от {formatRub(row.perimeterM * RATE_RABICA)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Периметры — для стандартных пропорций участков. Как посчитать свой периметр и
              количество столбов/листов — в таблице «сотки → погонные метры».
            </p>
          </div>
        </section>

        <section className="py-12 px-4">
          <div className="container mx-auto max-w-5xl">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Scale className="w-6 h-6 text-primary" />
              Сравнение подрядчиков заборов в МО
            </h2>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              По брендовым запросам вида «забор + dostup-zabor» или «забор + zabor dlya doma»
              видно: люди сравнивают конкретные компании. Это правильно — сравнивайте, в том
              числе нас. Ниже — наши параметры против ориентира рынка Московской области.
              Упоминания коллег приведены по публичным данным их сайтов на 09.2026, без
              очернения; перед заказом запросите у каждого подрядчика актуальную смету.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border rounded-xl overflow-hidden bg-background" data-testid="zabor-contractors-table">
                <thead>
                  <tr className="bg-secondary text-left">
                    <th className="px-4 py-3 font-semibold">Критерий</th>
                    <th className="px-4 py-3 font-semibold">Заборы и Навесы</th>
                    <th className="px-4 py-3 font-semibold">Рынок МО (ориентир)</th>
                  </tr>
                </thead>
                <tbody>
                  {CONTRACTORS_COMPARISON.map((row) => (
                    <tr key={row.criteria} className="border-t">
                      <td className="px-4 py-3 font-medium">{row.criteria}</td>
                      <td className="px-4 py-3">{row.ours}</td>
                      <td className="px-4 py-3 text-muted-foreground">{row.market}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Главная рекомендация: сравнивайте не цифру «за метр», а полный состав сметы —
              тогда сравнение будет честным.
            </p>
          </div>
        </section>

        <section className="py-12 px-4 bg-secondary/30">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-primary" />
              Почему дешёвые объявления потом дорожают
            </h2>
            <div className="space-y-3" data-testid="price-traps">
              {PRICE_TRAPS.map((item) => (
                <div key={item.trap} className="card-modern p-5">
                  <h3 className="font-semibold mb-1">{item.trap}</h3>
                  <p className="text-sm text-muted-foreground">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <MontageInDayBanner mode="fence" />

        <section className="py-12 px-4">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-2xl font-bold mb-6">Частые вопросы про стоимость забора</h2>
            <FaqAccordion items={SRAVNENIE_FAQ} />
          </div>
        </section>

        <section className="py-16 px-4 bg-primary text-primary-foreground">
          <div className="container mx-auto max-w-3xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Посчитайте свой забор — и сравните с другими
            </h2>
            <p className="text-xl opacity-90 mb-8">
              Таблица «сотки → погонные метры» и калькулятор дадут точную цифру за 30 секунд.
              Или позвоните: +7 (499) 390-15-95
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="/skolko-pogonnyh-metrov-v-sotkah"
                className="inline-flex items-center gap-2 bg-white text-primary px-8 py-4 rounded-xl font-semibold hover:bg-white/90 transition-colors"
              >
                <Calculator className="w-5 h-5" />
                Таблица и смета
              </Link>
              <TrackedPhoneLink
                href="tel:+74993901595"
                className="inline-flex items-center gap-2 border border-white/40 text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/10 transition-colors"
              >
                <Phone className="w-5 h-5" />
                Позвонить
              </TrackedPhoneLink>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
