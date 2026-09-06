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
  generateArticleJsonLd,
  generateFaqPageJsonLd,
} from '@/lib/seo/jsonld';
import { generatePageMetadata } from '@/lib/seo/metadata';
import { PAGE_METADATA } from '@/lib/seo/constants';
import { Calculator, ArrowRight, Phone } from 'lucide-react';

export const revalidate = 86400;

export const metadata: Metadata = generatePageMetadata({
  title: PAGE_METADATA.zaborNaSotki.title,
  description: PAGE_METADATA.zaborNaSotki.description,
  keywords: PAGE_METADATA.zaborNaSotki.keywords,
  path: PAGE_METADATA.zaborNaSotki.path,
  ogImage: PAGE_METADATA.zaborNaSotki.ogImage,
});

const RATE_PROFNASTIL = 2600;
const RATE_EVROSHTAKETNIK = 3100;
const RATE_RABICA = 550;

interface SotkiRow {
  sotki: string;
  plotSize: string;
  perimeterM: number;
}

const SOTKI_TABLE: SotkiRow[] = [
  { sotki: '6 соток', plotSize: '20 × 30 м', perimeterM: 100 },
  { sotki: '8 соток', plotSize: '20 × 40 м', perimeterM: 120 },
  { sotki: '10 соток', plotSize: '25 × 40 м', perimeterM: 130 },
  { sotki: '12 соток', plotSize: '30 × 40 м', perimeterM: 140 },
  { sotki: '15 соток', plotSize: '30 × 50 м', perimeterM: 160 },
  { sotki: '20 соток', plotSize: '40 × 50 м', perimeterM: 180 },
];

function formatRub(value: number): string {
  return `${value.toLocaleString('ru-RU')} ₽`;
}

const SOTKI_FAQ = [
  {
    question: 'Сколько метров забора нужно на 6 соток?',
    answer:
      'У типового прямоугольного участка 6 соток (20 × 30 м) периметр — 100 погонных метров. Если участок квадратный (примерно 24,5 × 24,5 м) — около 98 м. Точную длину замерит наш замерщик бесплатно: на местности периметр считают по фактическим границам, а не по документам.',
  },
  {
    question: 'Сколько стоит забор на 10 соток под ключ?',
    answer:
      'Для участка 25 × 40 м (периметр 130 м): из профнастила — от 338 000 ₽, из евроштакетника — от 403 000 ₽, из сетки-рабицы — от 71 500 ₽. Это ориентировочные цены «под ключ» с материалом, столбами и монтажом; точную смету под ваш участок покажет калькулятор забора.',
  },
  {
    question: 'Как посчитать периметр неправильного участка?',
    answer:
      'Сложите длины всех сторон по меже. Для прямоугольника — формула P = 2 × (длина + ширина). Если участок неправильной формы, измерьте каждую сторону рулеткой или по межевому плану и сложите: сумма сторон и есть длина забора. На местности замерщик делает это бесплатно с точностью до сантиметра.',
  },
  {
    question: 'Какой забор дешевле для дачи 6 соток?',
    answer:
      'Самый бюджетный вариант — сетка-рабица на металлических столбах: от 55 000 ₽ на 6 соток. Если нужно закрыться от посторонних глаз — профнастил (от 260 000 ₽ под ключ). Компромисс: профнастил или евроштакетник на лицевую сторону, рабица — на межи с соседями.',
  },
  {
    question: 'Входит ли доставка и монтаж в эти цены?',
    answer:
      'Да, все цены в таблице — «под ключ»: материал, столбы с бетонированием, лаги, крепёж, доставка и монтаж. Дополнительно оплачиваются только ворота и калитка — их стоимость рассчитайте в калькуляторе ворот.',
  },
  {
    question: 'За сколько дней поставите забор на 15–20 соток?',
    answer:
      'Типовой забор до 50 погонных метров монтируем за 1 день. Протяжённость 160–180 м (15–20 соток) — 2–3 рабочих дня одним блоком: бригада приезжает с полным комплектом материалов. График фиксируется после бесплатного замера.',
  },
];

export default function ZaborNaSotkiPage() {
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: 'Главная', url: '/' },
    { name: 'Сколько стоит забор на участок — расчёт по соткам', url: '/calc/zabor-na-sotki' },
  ]);

  const articleJsonLd = generateArticleJsonLd(
    'Сколько стоит забор на участок: расчёт для 6–20 соток',
    'Таблица цен под ключ по соткам: периметр участка, профнастил, евроштакетник, рабица. Формула расчёта периметра и калькулятор.',
    '/calc/zabor-na-sotki'
  );

  const faqJsonLd = generateFaqPageJsonLd(SOTKI_FAQ);

  return (
    <div className="min-h-screen bg-background">
      <JsonLdScript data={[breadcrumbJsonLd, articleJsonLd, faqJsonLd]} />
      <Header />

      <main className="pt-24">
        <section className="py-16 px-4 relative overflow-hidden">
          <div className="absolute inset-0 gradient-mesh opacity-50" />
          <div className="container mx-auto relative z-10">
            <Breadcrumbs items={[{ label: 'Сколько стоит забор на участок' }]} />
            <div className="max-w-4xl">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Сколько стоит забор на участок: расчёт по соткам
              </h1>
              <p className="text-lg text-muted-foreground mb-6">
                Люди думают участками, а заборы продаются метрами. Здесь — готовый расчёт:
                сколько погонных метров в 6, 8, 10, 12, 15 и 20 сотках и сколько стоит
                ограждение под ключ по трём материалам. Цены 2026 года для Москвы и Московской
                области.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/calculator/fence"
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors"
                >
                  <Calculator className="w-5 h-5" />
                  Рассчитать свой забор
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 px-4">
          <div className="container mx-auto max-w-5xl">
            <h2 className="text-2xl font-bold mb-6">
              Таблица: сотки → периметр → цена под ключ
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border rounded-xl overflow-hidden bg-background" data-testid="sotki-table">
                <thead>
                  <tr className="bg-secondary text-left">
                    <th className="px-4 py-3 font-semibold">Участок</th>
                    <th className="px-4 py-3 font-semibold">Типовые размеры</th>
                    <th className="px-4 py-3 font-semibold">Периметр</th>
                    <th className="px-4 py-3 font-semibold">Профнастил</th>
                    <th className="px-4 py-3 font-semibold">Евроштакетник</th>
                    <th className="px-4 py-3 font-semibold">Рабица</th>
                  </tr>
                </thead>
                <tbody>
                  {SOTKI_TABLE.map((row) => (
                    <tr key={row.sotki} className="border-t">
                      <td className="px-4 py-3 font-medium">{row.sotki}</td>
                      <td className="px-4 py-3 text-muted-foreground">{row.plotSize}</td>
                      <td className="px-4 py-3 whitespace-nowrap font-semibold">{row.perimeterM} м</td>
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
              Цены ориентировочные «под ключ» (материал, столбы с бетонированием, лаги, монтаж) для
              забора высотой 2 метра. Точная смета под ваш участок и материал — в{' '}
              <Link href="/calculator/fence" className="text-primary hover:underline">
                калькуляторе забора
              </Link>
              .
            </p>
          </div>
        </section>

        <section className="py-12 px-4 bg-secondary/30">
          <div className="container mx-auto max-w-4xl space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-3">Забор на 6 соток</h2>
              <p className="text-muted-foreground leading-relaxed">
                Классическая дача: 20 × 30 м, 100 метров забора. Рабочая схема для экономии —
                профнастил или евроштакетник на лицевую сторону (25–30 м), сетка-рабица на межи с
                соседями. Такой комбинированный вариант на 6 соток стоит от 90 000–130 000 ₽ под
                ключ. Если огораживать весь периметр профнастилом — от 260 000 ₽.
              </p>
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-3">Забор на 10–12 соток</h2>
              <p className="text-muted-foreground leading-relaxed">
                Участки 25 × 40 и 30 × 40 м — 130–140 погонных метров. Здесь уже важно учитывать
                ворота и калитку: откатные ворота шириной 4 м добавляют к смете от 45 000 ₽.
                Типовое решение — профнастил высотой 2 м по всему периметру, при заказе от 100 м
                действует скидка на протяжённость.
              </p>
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-3">Забор на 15–20 соток</h2>
              <p className="text-muted-foreground leading-relaxed">
                Периметр 160–180 м — это большой заказ, и его выгодно комплектовать одним блоком:
                мы привозим весь материал за один рейс и ставим забор за 2–3 дня. Для дальних
                районов (Шатура, Коломна, Луховицы) монтаж блоком — единственный правильный
                формат: без наценки за удалённость при заказе от 20 метров.
              </p>
            </div>
          </div>
        </section>

        <section className="py-12 px-4">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-2xl font-bold mb-6">Как посчитать периметр самостоятельно</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="card-modern p-5">
                <h3 className="font-semibold mb-2">Прямоугольник</h3>
                <p className="text-sm text-muted-foreground">
                  P = 2 × (длина + ширина). Участок 20 × 30 м → 2 × (20 + 30) = 100 м.
                </p>
              </div>
              <div className="card-modern p-5">
                <h3 className="font-semibold mb-2">Квадрат</h3>
                <p className="text-sm text-muted-foreground">
                  P = 4 × сторона. 6 соток квадратом → сторона ≈ 24,5 м → 98 м.
                </p>
              </div>
              <div className="card-modern p-5">
                <h3 className="font-semibold mb-2">Неправильная форма</h3>
                <p className="text-sm text-muted-foreground">
                  Сложите длины всех сторон по меже (по межевому плану или замером на местности).
                  Сумма сторон = длина забора.
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Важно: считайте периметр по фактическим границам, а не по площади из документов —
              участки редко совпадают с планом. Бесплатный замерщик зафиксирует точную длину до
              сантиметра.
            </p>
          </div>
        </section>

        <MontageInDayBanner mode="fence" />

        <section className="py-12 px-4 bg-secondary/30">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-2xl font-bold mb-6">Частые вопросы про забор по соткам</h2>
            <FaqAccordion items={SOTKI_FAQ} />
          </div>
        </section>

        <section className="py-16 px-4 bg-primary text-primary-foreground">
          <div className="container mx-auto max-w-3xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Посчитайте забор под свой участок
            </h2>
            <p className="text-xl opacity-90 mb-8">
              Калькулятор учтёт материал, высоту, ворота и калитку — точная цена за 30 секунд.
              Или позвоните: +7 (499) 390-15-95
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
