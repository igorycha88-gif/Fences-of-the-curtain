import Link from 'next/link';
import { Metadata } from 'next';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import JsonLdScript from '@/components/seo/JsonLdScript';
import TrackedPhoneLink from '@/components/seo/TrackedPhoneLink';
import FaqAccordion from '@/components/geo/FaqAccordion';
import LeadForm from '@/components/seo/LeadForm';
import MontageInDayBanner from '@/components/seo/MontageInDayBanner';
import { LEAD_PLOT_OPTIONS } from '@/lib/zabor/pogMetry';
import {
  generateBreadcrumbJsonLd,
  generateServiceJsonLd,
  generateFaqPageJsonLd,
} from '@/lib/seo/jsonld';
import { generatePageMetadata } from '@/lib/seo/metadata';
import { PAGE_METADATA } from '@/lib/seo/constants';
import { SMETA_MATERIALS, SMETA_PERIMETERS, SMETA_STRUCTURE, SMETA_STEPS, SMETA_CHECKLIST, SMETA_FAQ } from '@/lib/zabor/smeta';
import { Calculator, ArrowRight, Phone, ClipboardList, CheckCircle2 } from 'lucide-react';

export const revalidate = 86400;

const M = PAGE_METADATA.smetaNaZabor;

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

export default function SmetaNaZaborPage() {
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: 'Главная', url: '/' },
    { name: 'Смета на забор', url: '/smeta-na-zabor' },
  ]);

  const serviceJsonLd = generateServiceJsonLd(
    'Смета на забор — расчёт стоимости под ключ',
    'Как сделать смету на забор: состав расчёта, примеры смет по 3 материалам на 6–15 соток, чек-лист подрядчика. Бесплатный замер в Московской области.',
    'замер и смета — бесплатно'
  );

  const faqJsonLd = generateFaqPageJsonLd(SMETA_FAQ);

  return (
    <div className="min-h-screen bg-background">
      <JsonLdScript data={[breadcrumbJsonLd, serviceJsonLd, faqJsonLd]} />
      <Header />

      <main className="pt-24">
        <section className="py-16 px-4 relative overflow-hidden">
          <div className="absolute inset-0 gradient-mesh opacity-50" />
          <div className="container mx-auto relative z-10">
            <Breadcrumbs items={[{ label: 'Смета на забор' }]} />
            <div className="max-w-4xl">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Смета на забор: как рассчитать стоимость под ключ
              </h1>
              <p className="text-lg text-muted-foreground mb-6">
                Сделать смету на забор можно за 30 секунд — если знать, из чего она состоит.
                Показываем структуру расчёта по пунктам, готовые примеры смет по трём
                материалам на участках 6–15 соток и чек-лист, по которому легко проверить
                предложение любого подрядчика Московской области.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/calculator/fence"
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors"
                >
                  <Calculator className="w-5 h-5" />
                  Рассчитать смету в калькуляторе
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
              <ClipboardList className="w-6 h-6 text-primary" />
              Из чего состоит смета под ключ
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border rounded-xl overflow-hidden bg-background" data-testid="smeta-structure-table">
                <thead>
                  <tr className="bg-secondary text-left">
                    <th className="px-4 py-3 font-semibold">Пункт сметы</th>
                    <th className="px-4 py-3 font-semibold">Что входит</th>
                    <th className="px-4 py-3 font-semibold">Доля цены</th>
                  </tr>
                </thead>
                <tbody>
                  {SMETA_STRUCTURE.map((row) => (
                    <tr key={row.item} className="border-t">
                      <td className="px-4 py-3 font-medium">{row.item}</td>
                      <td className="px-4 py-3 text-muted-foreground">{row.detail}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-primary font-semibold">{row.share}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Доли ориентировочные для забора высотой 2 м на ровном участке. Замер и
              составление сметы у нас бесплатны — в цену работ они не входят.
            </p>
          </div>
        </section>

        <section className="py-12 px-4 bg-secondary/30">
          <div className="container mx-auto max-w-5xl">
            <h2 className="text-2xl font-bold mb-6">Примеры готовых смет</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border rounded-xl overflow-hidden bg-background" data-testid="smeta-examples-table">
                <thead>
                  <tr className="bg-secondary text-left">
                    <th className="px-4 py-3 font-semibold">Материал</th>
                    <th className="px-4 py-3 font-semibold">Цена за пог. м</th>
                    {SMETA_PERIMETERS.map((p) => (
                      <th key={p.label} className="px-4 py-3 font-semibold whitespace-nowrap">{p.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SMETA_MATERIALS.map((row) => (
                    <tr key={row.material} className="border-t">
                      <td className="px-4 py-3 font-medium">{row.material}</td>
                      <td className="px-4 py-3 whitespace-nowrap font-semibold">{formatRub(row.ratePerMeter)}</td>
                      {SMETA_PERIMETERS.map((p) => (
                        <td key={p.label} className="px-4 py-3 whitespace-nowrap text-primary font-semibold">
                          {formatRub(p.perimeterM * row.ratePerMeter)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Сметы «под ключ» — с материалом, столбами, лагами, крепежом, доставкой и
              монтажом, цены на 09.2026. Ворота и калитка считаются отдельно: откатные
              ворота 4 м добавляют к смете от 45 000 ₽.
            </p>
          </div>
        </section>

        <section className="py-12 px-4">
          <div className="container mx-auto max-w-5xl">
            <h2 className="text-2xl font-bold mb-6">Как рассчитать смету на забор самостоятельно</h2>
            <div className="grid md:grid-cols-2 gap-4" data-testid="smeta-steps">
              {SMETA_STEPS.map((item) => (
                <div key={item.step} className="card-modern p-5" data-testid="smeta-step">
                  <div className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">{item.step}</div>
                  <h3 className="font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-12 px-4 bg-secondary/30">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-2xl font-bold mb-6">Что должно быть в смете подрядчика</h2>
            <ul className="space-y-3" data-testid="smeta-checklist">
              {SMETA_CHECKLIST.map((item) => (
                <li key={item} className="flex items-start gap-3 card-modern p-4">
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">{item}</span>
                </li>
              ))}
            </ul>
            <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
              Нет хотя бы одного пункта — просите дополнить смету до подписания договора.
              Больше разборов цен — на странице{' '}
              <Link href="/skolko-stoit-zabor-sravnenie" className="text-primary hover:underline">
                «Сколько стоит забор: сравнение цен»
              </Link>
              .
            </p>
          </div>
        </section>

        <section className="py-12 px-4">
          <div className="container mx-auto max-w-5xl">
            <div className="grid md:grid-cols-2 gap-6 items-start">
              <LeadForm
                source="smeta-na-zabor"
                plotOptions={LEAD_PLOT_OPTIONS}
                title="Сделать смету с выездом замерщика — бесплатно"
              />
              <div className="card-modern p-6">
                <h3 className="text-lg font-bold mb-3">Предпочитаете посчитать сами?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Калькулятор забора учтёт материал, высоту, ворота и калитку —
                  предварительная смета за 30 секунд. Периметр подскажет таблица
                  «сотки → погонные метры», а цены подрядчиков МО — страница «Забор под ключ».
                </p>
                <div className="flex flex-col gap-3">
                  <Link
                    href="/calculator/fence"
                    className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors"
                  >
                    <Calculator className="w-5 h-5" />
                    Калькулятор сметы забора
                  </Link>
                  <Link
                    href="/skolko-pogonnyh-metrov-v-sotkah"
                    className="inline-flex items-center justify-center gap-2 border border-primary/30 text-primary px-6 py-3 rounded-xl font-semibold hover:bg-primary/5 transition-colors"
                  >
                    Таблица: сотки → метры
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <MontageInDayBanner mode="fence" />

        <section className="py-12 px-4">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-2xl font-bold mb-6">Частые вопросы про смету на забор</h2>
            <FaqAccordion items={SMETA_FAQ} />
          </div>
        </section>

        <section className="py-16 px-4 bg-primary text-primary-foreground">
          <div className="container mx-auto max-w-3xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Рассчитайте смету на свой забор
            </h2>
            <p className="text-xl opacity-90 mb-8">
              Онлайн — за 30 секунд в калькуляторе, точно — после бесплатного выезда
              замерщика. Или позвоните: +7 (499) 390-15-95
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="/calculator/fence"
                className="inline-flex items-center gap-2 bg-white text-primary px-8 py-4 rounded-xl font-semibold hover:bg-white/90 transition-colors"
              >
                <Calculator className="w-5 h-5" />
                Смета в калькуляторе
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
