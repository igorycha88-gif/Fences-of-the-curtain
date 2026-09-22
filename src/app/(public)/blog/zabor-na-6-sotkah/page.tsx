import Link from 'next/link';
import { Metadata } from 'next';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import JsonLdScript from '@/components/seo/JsonLdScript';
import TrackedPhoneLink from '@/components/seo/TrackedPhoneLink';
import FaqAccordion from '@/components/geo/FaqAccordion';
import {
  generateBreadcrumbJsonLd,
  generateArticleJsonLd,
  generateFaqPageJsonLd,
} from '@/lib/seo/jsonld';
import { generatePageMetadata } from '@/lib/seo/metadata';
import { PAGE_METADATA } from '@/lib/seo/constants';
import {
  SHEST_SOTOK_PROPORTIONS,
  PRICE_ROWS,
  MONTAGE_STEPS,
  HUB_FAQ,
} from '@/lib/blog/zaborNa6Sotkah';
import { Calculator, ArrowRight, Phone, MapPinned, Coins, ListChecks } from 'lucide-react';

export const revalidate = 86400;

const M = PAGE_METADATA.blogZabor6Sotok;

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



export default function ZaborNa6SotkahArticle() {
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: 'Главная', url: '/' },
    { name: 'Блог', url: '/blog' },
    { name: 'Забор на 6 сотках: полный гид', url: '/blog/zabor-na-6-sotkah' },
  ]);

  const articleJsonLd = generateArticleJsonLd(
    'Забор на 6 сотках: сколько метров, сколько стоит, материалы — полный гид 2026',
    'Полный гид по забору на 6 сотках: периметр при разных пропорциях, цены под ключ по материалам, поэтапный монтаж за 1 день, частые вопросы.',
    '/blog/zabor-na-6-sotkah',
    undefined,
    '2026-09-15T00:00:00+03:00'
  );

  const faqJsonLd = generateFaqPageJsonLd(HUB_FAQ);

  const formatRub = (value: number) => `${value.toLocaleString('ru-RU')} ₽`;

  return (
    <div className="min-h-screen bg-background">
      <JsonLdScript data={[breadcrumbJsonLd, articleJsonLd, faqJsonLd]} />
      <Header />

      <main className="pt-24">
        <section className="py-16 px-4 relative overflow-hidden">
          <div className="absolute inset-0 gradient-mesh opacity-50" />
          <div className="container mx-auto relative z-10">
            <Breadcrumbs items={[{ label: 'Блог', href: '/blog' }, { label: 'Забор на 6 сотках' }]} />
            <div className="max-w-4xl">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Забор на 6 сотках: полный гид 2026
              </h1>
              <p className="text-lg text-muted-foreground mb-6">
                Шесть соток — самый частый размер дачного участка в МО. Здесь собрано всё:
                сколько это метров забора при разных пропорциях, сколько стоит под ключ по
                материалам, как идёт монтаж по шагам и как сэкономить без потери качества.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/skolko-pogonnyh-metrov-v-sotkah"
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors"
                >
                  <Calculator className="w-5 h-5" />
                  Таблица всех размеров: 4–50 соток
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
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <MapPinned className="w-6 h-6 text-primary" />
              Сколько метров забора в 6 сотках: зависит от формы
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              6 соток — это 600 м². Периметр определяется пропорциями: квадрат даёт минимальную
              длину забора, каждый «вытянутый» метр добавляет погонные метры и деньги.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border rounded-xl overflow-hidden bg-background" data-testid="six-sotki-proportions-table">
                <thead>
                  <tr className="bg-secondary text-left">
                    <th className="px-4 py-3 font-semibold">Пропорции участка</th>
                    <th className="px-4 py-3 font-semibold">Периметр</th>
                    <th className="px-4 py-3 font-semibold">Комментарий</th>
                  </tr>
                </thead>
                <tbody>
                  {SHEST_SOTOK_PROPORTIONS.map((row) => (
                    <tr key={row.shape} className="border-t">
                      <td className="px-4 py-3 font-medium">{row.shape}</td>
                      <td className="px-4 py-3 whitespace-nowrap font-semibold">{row.perimeterM} м</td>
                      <td className="px-4 py-3 text-muted-foreground">{row.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Дальше по тексту считаем для классических 100 метров (20 × 30 м). Другие размеры —
              в общей таблице «сотки → погонные метры».
            </p>
          </div>
        </section>

        <section className="py-12 px-4 bg-secondary/30">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Coins className="w-6 h-6 text-primary" />
              Сколько стоит забор на 6 соток по материалам
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border rounded-xl overflow-hidden bg-background" data-testid="six-sotki-prices-table">
                <thead>
                  <tr className="bg-secondary text-left">
                    <th className="px-4 py-3 font-semibold">Материал</th>
                    <th className="px-4 py-3 font-semibold">За пог. метр</th>
                    <th className="px-4 py-3 font-semibold">100 метров под ключ</th>
                  </tr>
                </thead>
                <tbody>
                  {PRICE_ROWS.map((row) => (
                    <tr key={row.material} className="border-t">
                      <td className="px-4 py-3 font-medium">{row.material}</td>
                      <td className="px-4 py-3 whitespace-nowrap">от {formatRub(row.rate)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-primary font-semibold">
                        от {formatRub(row.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
              Рабочая схема экономии для дачи: лицевую сторону (20–30 м) закрыть профнастилом
              или евроштакетником, межи с соседями — сеткой-рабицей. Такой комбинированный
              забор на 6 сотках стоит 90 000–130 000 ₽ под ключ. Сравнить наши цены с другими
              подрядчиками МО — на странице «Сколько стоит забор: сравнение цен».
            </p>
          </div>
        </section>

        <section className="py-12 px-4">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <ListChecks className="w-6 h-6 text-primary" />
              Монтаж забора на 6 сотках по шагам
            </h2>
            <div className="space-y-4">
              {MONTAGE_STEPS.map((item) => (
                <div key={item.step} className="card-modern p-5">
                  <h3 className="font-semibold mb-1">{item.step}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Итого: 100 метров забора на 6 сотках — это один рабочий день слаженной бригады.
              Как это выглядит в графике «по часам» — в баннере ниже.
            </p>
          </div>
        </section>

        <section className="py-12 px-4 bg-secondary/30">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-2xl font-bold mb-6">Частые вопросы про забор на 6 сотках</h2>
            <FaqAccordion items={HUB_FAQ} />
          </div>
        </section>

        <section className="py-12 px-4">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-2xl font-bold mb-4">Полезные страницы по теме</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              <Link href="/skolko-pogonnyh-metrov-v-sotkah" className="card-modern p-5 hover-lift group">
                <h3 className="font-semibold group-hover:text-primary transition-colors">
                  Сотки → погонные метры: таблица 4–50 соток
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  периметр, столбы, листы и смета для любого размера
                </p>
              </Link>
              <Link href="/skolko-stoit-zabor-sravnenie" className="card-modern p-5 hover-lift group">
                <h3 className="font-semibold group-hover:text-primary transition-colors">
                  Сколько стоит забор: сравнение цен
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  цены за метр, подрядчики МО, разбор ловушек
                </p>
              </Link>
              <Link href="/calculator/fence" className="card-modern p-5 hover-lift group">
                <h3 className="font-semibold group-hover:text-primary transition-colors">
                  Калькулятор забора
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  точная цена с воротами и калиткой за 30 секунд
                </p>
              </Link>
            </div>
          </div>
        </section>

        <section className="py-16 px-4 bg-primary text-primary-foreground">
          <div className="container mx-auto max-w-3xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Забор на 6 соток за 1 день
            </h2>
            <p className="text-xl opacity-90 mb-8">
              Рассчитайте точную стоимость в калькуляторе — или позвоните: +7 (499) 390-15-95
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
