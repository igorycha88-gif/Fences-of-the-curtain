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
  RATE_PROFNASTIL,
  SOTKI_PERIMETER_TABLE,
  MATERIALS_TABLE,
  ESTIMATE_RATES,
  POG_METRY_FAQ,
  LEAD_PLOT_OPTIONS,
} from '@/lib/zabor/pogMetry';
import { Calculator, ArrowRight, Phone, Ruler, Fence, Sigma } from 'lucide-react';

export const revalidate = 86400;

const M = PAGE_METADATA.zaborPogMetry;

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

export default function SkolkoPogonnyhMetrovPage() {
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: 'Главная', url: '/' },
    { name: 'Сотки → погонные метры забора: таблица', url: '/skolko-pogonnyh-metrov-v-sotkah' },
  ]);

  const serviceJsonLd = generateServiceJsonLd(
    'Расчёт забора по соткам участка: периметр, материалы, смета',
    'Таблица перевода соток в погонные метры забора для участков 4–50 соток, расчёт столбов и листов, ориентировочная смета под ключ. Бесплатный выезд замерщика — Москва и МО.',
    'от 550 RUB за погонный метр под ключ'
  );

  const faqJsonLd = generateFaqPageJsonLd(POG_METRY_FAQ);

  return (
    <div className="min-h-screen bg-background">
      <JsonLdScript data={[breadcrumbJsonLd, serviceJsonLd, faqJsonLd]} />
      <Header />

      <main className="pt-24">
        <section className="py-16 px-4 relative overflow-hidden">
          <div className="absolute inset-0 gradient-mesh opacity-50" />
          <div className="container mx-auto relative z-10">
            <Breadcrumbs items={[{ label: 'Сотки → погонные метры забора' }]} />
            <div className="max-w-4xl">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Сотки → погонные метры забора: таблица
              </h1>
              <p className="text-lg text-muted-foreground mb-6">
                Участки измеряют в сотках, а забор считают в метрах. Ниже — готовая таблица для
                4–50 соток: периметр при стандартных пропорциях и для квадратного участка, плюс
                расчёт столбов, лаг и листов и примерная смета под ключ. Актуально на 2026 год,
                Москва и МО.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/calculator/fence"
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors"
                >
                  <Calculator className="w-5 h-5" />
                  Точная цена в калькуляторе
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
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Ruler className="w-6 h-6 text-primary" />
              Таблица: сотки → периметр → погонные метры забора
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border rounded-xl overflow-hidden bg-background" data-testid="sotki-perimeter-table">
                <thead>
                  <tr className="bg-secondary text-left">
                    <th className="px-4 py-3 font-semibold">Участок</th>
                    <th className="px-4 py-3 font-semibold">Типовые размеры</th>
                    <th className="px-4 py-3 font-semibold">Периметр (стандарт)</th>
                    <th className="px-4 py-3 font-semibold">Если квадрат</th>
                    <th className="px-4 py-3 font-semibold">Профнастил от</th>
                  </tr>
                </thead>
                <tbody>
                  {SOTKI_PERIMETER_TABLE.map((row) => (
                    <tr key={row.sotki} className="border-t">
                      <td className="px-4 py-3 font-medium whitespace-nowrap">{row.sotki}</td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{row.plotSize}</td>
                      <td className="px-4 py-3 whitespace-nowrap font-semibold">{row.perimeterM} м</td>
                      <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                        {row.perimeterSquareM} м
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-primary font-semibold">
                        от {formatRub(row.perimeterM * RATE_PROFNASTIL)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Периметр зависит от формы: квадратная 10-сотка — это 126 м, вытянутая 20 × 50 — те
              же 140 м, что и стандартная 25 × 40. Чем вытянутее участок, тем длиннее забор при
              равной площади.
            </p>
          </div>
        </section>

        <section className="py-12 px-4 bg-secondary/30">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Fence className="w-6 h-6 text-primary" />
              Сколько нужно столбов и листов на N соток
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Материальный расчёт в четыре шага: (1) берём периметр из таблицы; (2) делим на шаг
              столбов 2,5 м и прибавляем 1 — получаем количество столбов; (3) умножаем периметр
              на 2 — метраж лаг в два ряда; (4) делим периметр на полезную ширину листа 1,1 м и
              округляем вверх — число листов профнастила.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border rounded-xl overflow-hidden bg-background" data-testid="materials-table">
                <thead>
                  <tr className="bg-secondary text-left">
                    <th className="px-4 py-3 font-semibold">Участок</th>
                    <th className="px-4 py-3 font-semibold">Периметр</th>
                    <th className="px-4 py-3 font-semibold">Столбы (шаг 2,5 м)</th>
                    <th className="px-4 py-3 font-semibold">Лаги (2 ряда)</th>
                    <th className="px-4 py-3 font-semibold">Листов профнастила</th>
                  </tr>
                </thead>
                <tbody>
                  {MATERIALS_TABLE.map((row) => (
                    <tr key={row.sotki} className="border-t">
                      <td className="px-4 py-3 font-medium whitespace-nowrap">{row.sotki}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{row.perimeterM} м</td>
                      <td className="px-4 py-3 whitespace-nowrap">{row.posts} шт</td>
                      <td className="px-4 py-3 whitespace-nowrap">{row.lagsM} м</td>
                      <td className="px-4 py-3 whitespace-nowrap">{row.sheets} шт</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Расчёт для забора высотой 2 метра. К листам добавьте 2–3 запасных на подрезку по
              рельефу; для евроштакетника вместо листов считается штакетина с шагом и рядами.
            </p>
          </div>
        </section>

        <section className="py-12 px-4">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-2xl font-bold mb-6">Примерная смета под ключ по материалам</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border rounded-xl overflow-hidden bg-background" data-testid="estimate-table">
                <thead>
                  <tr className="bg-secondary text-left">
                    <th className="px-4 py-3 font-semibold">Материал</th>
                    <th className="px-4 py-3 font-semibold">Цена за пог. метр</th>
                    <th className="px-4 py-3 font-semibold">Что входит</th>
                    <th className="px-4 py-3 font-semibold">10 соток (130 м)</th>
                  </tr>
                </thead>
                <tbody>
                  {ESTIMATE_RATES.map((row) => (
                    <tr key={row.material} className="border-t">
                      <td className="px-4 py-3 font-medium">{row.material}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-primary font-semibold">
                        от {formatRub(row.ratePerMeter)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{row.includes}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-primary font-semibold">
                        от {formatRub(130 * row.ratePerMeter)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Ориентировочные цены «под ключ» на 09.2026, высота забора 2 м. Ворота и калитка
              считаются отдельно в калькуляторе ворот. Больше размеров и цен — в
              расчётном хабе «Сколько стоит забор на участок».
            </p>

            <div className="grid md:grid-cols-2 gap-6 mt-10 items-start">
              <LeadForm source="skolko-pogonnyh-metrov-v-sotkah" plotOptions={LEAD_PLOT_OPTIONS} />
              <div className="card-modern p-6">
                <h3 className="text-lg font-bold mb-3">Не хотите считать руками?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Калькулятор забора учтёт материал, высоту, ворота и калитку — точная цена за 30
                  секунд. Либо сравните предложения подрядчиков МО на странице «Сколько стоит
                  забор: сравнение цен».
                </p>
                <div className="flex flex-col gap-3">
                  <Link
                    href="/calculator/fence"
                    className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors"
                  >
                    <Calculator className="w-5 h-5" />
                    Рассчитать забор
                  </Link>
                  <Link
                    href="/skolko-stoit-zabor-sravnenie"
                    className="inline-flex items-center justify-center gap-2 border border-primary/30 text-primary px-6 py-3 rounded-xl font-semibold hover:bg-primary/5 transition-colors"
                  >
                    Сравнение цен подрядчиков
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 px-4 bg-secondary/30">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Sigma className="w-6 h-6 text-primary" />
              Как посчитать периметр участка нестандартной формы
            </h2>
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="card-modern p-5">
                <h3 className="font-semibold mb-2">Прямоугольник</h3>
                <p className="text-sm text-muted-foreground">
                  P = 2 × (длина + ширина). Участок 30 × 60 м (18 соток) → 2 × (30 + 60) = 180 м.
                </p>
              </div>
              <div className="card-modern p-5">
                <h3 className="font-semibold mb-2">Квадрат</h3>
                <p className="text-sm text-muted-foreground">
                  P = 4 × √площади. 15 соток (1500 м²) → 4 × 38,7 ≈ 155 м — минимально возможный
                  забор для этой площади.
                </p>
              </div>
              <div className="card-modern p-5">
                <h3 className="font-semibold mb-2">Произвольная форма</h3>
                <p className="text-sm text-muted-foreground">
                  Сложите длины всех сторон по меже — по межевому плану или замером на месте.
                  Сумма сторон и есть длина забора.
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              «15 соток — это сколько метров по периметру?» — от 155 м (квадрат ~39 × 39 м) до
              190 м и больше для вытянутого надела 25 × 60 м. Поэтому по телефону мы называем
              вилку, а точную цифру фиксирует бесплатный выезд замерщика — с точностью до
              сантиметра по фактическим границам, а не по документам.
            </p>
          </div>
        </section>

        <section className="py-12 px-4">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-2xl font-bold mb-6">Частые вопросы: сотки и погонные метры</h2>
            <FaqAccordion items={POG_METRY_FAQ} />
          </div>
        </section>

        <section className="py-16 px-4 bg-primary text-primary-foreground">
          <div className="container mx-auto max-w-3xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Точный расчёт с выездом — бесплатно
            </h2>
            <p className="text-xl opacity-90 mb-8">
              Замерщик зафиксирует реальный периметр и привезёт смету. Или позвоните:
              +7 (499) 390-15-95
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="/calculator/fence"
                className="inline-flex items-center gap-2 bg-white text-primary px-8 py-4 rounded-xl font-semibold hover:bg-white/90 transition-colors"
              >
                <Calculator className="w-5 h-5" />
                Рассчитать стоимость
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
