import Link from 'next/link';
import { Metadata } from 'next';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import JsonLdScript from '@/components/seo/JsonLdScript';
import TrackedPhoneLink from '@/components/seo/TrackedPhoneLink';
import FaqAccordion from '@/components/geo/FaqAccordion';
import MontageInDayBanner from '@/components/seo/MontageInDayBanner';
import { generateBreadcrumbJsonLd, generateServiceJsonLd, generateFaqPageJsonLd } from '@/lib/seo/jsonld';
import { generatePageMetadata } from '@/lib/seo/metadata';
import { PAGE_METADATA } from '@/lib/seo/constants';
import {
  PRICES_TABLE,
  TURNKEY_CHECKLIST,
  CONTRACTOR_QUESTIONS,
  COMPARISON_TABLE,
  CENY_FAQ,
} from '@/lib/navesy/podKlyuchCeny';
import { Calculator, ArrowRight, Phone, Snowflake, ShieldCheck, ClipboardList } from 'lucide-react';

export const revalidate = 86400;

const M = PAGE_METADATA.navesyPodKlyuchCeny;

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

export default function NavesyPodKlyuchCenyPage() {
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: 'Главная', url: '/' },
    { name: 'Навесы под ключ — цены', url: '/navesy-pod-klyuch' },
    { name: 'Навесы под ключ — цены 2026 и сравнение', url: '/navesy/pod-klyuch-ceny' },
  ]);

  const serviceJsonLd = generateServiceJsonLd(
    'Навесы под ключ в Москве и МО — цены 2026',
    'Навесы для автомобилей под ключ: цены за м² по поликарбонату, профлисту и металлочерепице, честное сравнение подрядчиков МО, расчёт под снеговую нагрузку. От 39 000 ₽ под ключ.',
    'от 2600 RUB за м² под ключ'
  );

  const faqJsonLd = generateFaqPageJsonLd(CENY_FAQ);

  const formatRub = (value: number) => `${value.toLocaleString('ru-RU')} ₽`;

  return (
    <div className="min-h-screen bg-background">
      <JsonLdScript data={[breadcrumbJsonLd, serviceJsonLd, faqJsonLd]} />
      <Header />

      <main className="pt-24">
        <section className="py-16 px-4 relative overflow-hidden">
          <div className="absolute inset-0 gradient-mesh opacity-50" />
          <div className="container mx-auto relative z-10">
            <Breadcrumbs
              items={[
                { label: 'Навесы под ключ — цены', href: '/navesy-pod-klyuch' },
                { label: 'Цены 2026 и сравнение' },
              ]}
            />
            <div className="max-w-4xl">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Навесы под ключ: цены и сравнение
              </h1>
              <p className="text-lg text-muted-foreground mb-6">
                Цены 2026 года для Москвы и МО в честной разбивке: сколько стоит квадратный метр
                по материалам кровли и размерам, что должно входить в «под ключ» и по каким
                критериям сравнивать подрядчиков — включая нас. От{' '}
                <span className="text-primary font-bold">2 600 ₽/м²</span> под ключ.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/calculator/canopy"
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors"
                >
                  <Calculator className="w-5 h-5" />
                  Расчёт по своим размерам
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
            <h2 className="text-2xl font-bold mb-6">Таблица цен за м² по материалам и размерам</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border rounded-xl overflow-hidden bg-background" data-testid="ceny-prices-table">
                <thead>
                  <tr className="bg-secondary text-left">
                    <th className="px-4 py-3 font-semibold">Размер</th>
                    <th className="px-4 py-3 font-semibold">Площадь</th>
                    <th className="px-4 py-3 font-semibold">Поликарбонат</th>
                    <th className="px-4 py-3 font-semibold">Профлист</th>
                    <th className="px-4 py-3 font-semibold">Металлочерепица</th>
                  </tr>
                </thead>
                <tbody>
                  {PRICES_TABLE.map((row) => (
                    <tr key={row.size} className="border-t">
                      <td className="px-4 py-3 font-medium">
                        <Link href={row.sizeHref} className="hover:text-primary hover:underline">
                          {row.size}
                        </Link>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">{row.areaM2} м²</td>
                      <td className="px-4 py-3 whitespace-nowrap text-primary font-semibold">
                        от {formatRub(row.polikarbonat)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-primary font-semibold">
                        от {formatRub(row.proflist)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-primary font-semibold">
                        от {formatRub(row.metallocherepitsa)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Цены ориентировочные «под ключ» (каркас, фундамент, кровля, монтаж) на 09.2026 для
              односкатной конструкции; двускатные и арочные считаются индивидуально. Точная смета
              под ваши размеры — в калькуляторе навеса.
            </p>
          </div>
        </section>

        <section className="py-12 px-4 bg-secondary/30">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-2xl font-bold mb-6">Что входит в «под ключ»</h2>
            <ul className="grid sm:grid-cols-2 gap-3 mb-8" data-testid="turnkey-checklist">
              {TURNKEY_CHECKLIST.map((item) => (
                <li key={item} className="card-modern p-4 flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">{item}</span>
                </li>
              ))}
            </ul>
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-primary" />
              Чек-лист вопросов подрядчику навесов
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground" data-testid="contractor-questions">
              {CONTRACTOR_QUESTIONS.map((question) => (
                <li key={question}>{question}</li>
              ))}
            </ol>
          </div>
        </section>

        <section className="py-12 px-4">
          <div className="container mx-auto max-w-5xl">
            <h2 className="text-2xl font-bold mb-4">Сравнение подрядчиков навесов в МО</h2>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              Если вы выбираете между подрядчиками — например, <strong>zaborexpress.ru</strong>,
               <strong> dostup-zabor</strong> или нами, — сравнивайте не только цифру «за м²», а
              состав цены, снеговой расчёт и гарантию. Ниже — наши параметры и ориентир рынка
              Московской области. Данные конкурентов приведены по публичным страницам их сайтов
              на 09.2026, без очернения; перед заказом запросите у каждого актуальную смету.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border rounded-xl overflow-hidden bg-background" data-testid="contractors-comparison-table">
                <thead>
                  <tr className="bg-secondary text-left">
                    <th className="px-4 py-3 font-semibold">Критерий</th>
                    <th className="px-4 py-3 font-semibold">Заборы и Навесы</th>
                    <th className="px-4 py-3 font-semibold">Рынок МО (ориентир)</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON_TABLE.map((row) => (
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
              Таблица не претендует на полноту: у каждого подрядчика свои сильные стороны. Наша
              задача — чтобы вы задавали правильные вопросы и получали честную смету, у кого бы
              вы ни заказывали.
            </p>
          </div>
        </section>

        <section className="py-12 px-4 bg-secondary/30">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Snowflake className="w-6 h-6 text-primary" />
              Снеговая нагрузка Московской области
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              МО — III снеговой район: 180 кг/м² по СП 20.13330.2016. Это значит, что навес 6×4 м
              должен держать около 4,3 тонны снега. Мы проектируем все конструкции под эту
              нагрузку с запасом: усиленные фермы, опоры 80×80 мм, шаг опор до 3 м.
            </p>
            <Link
              href="/navesy/na-zimu-ot-snega"
              className="inline-flex items-center gap-2 text-primary font-semibold hover:underline"
            >
              Зимний навес от снега: расчёт нагрузки и цены
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        <MontageInDayBanner mode="canopy" />

        <section className="py-12 px-4">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-2xl font-bold mb-6">Частые вопросы про цены на навесы</h2>
            <FaqAccordion items={CENY_FAQ} />
          </div>
        </section>

        <section className="py-16 px-4 bg-primary text-primary-foreground">
          <div className="container mx-auto max-w-3xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Считайте навес по своим размерам
            </h2>
            <p className="text-xl opacity-90 mb-8">
              Калькулятор учтёт кровлю, конструкцию и монтаж — точная цена за 30 секунд.
              Или позвоните: +7 (499) 390-15-95
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="/calculator/canopy"
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
