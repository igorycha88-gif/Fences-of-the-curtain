import Link from 'next/link';
import Image from 'next/image';
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
  GARAGE_RATE_PER_SQM,
  GARAGE_SIZES,
  garagePriceFrom,
  GARAGE_INCLUDED,
  GARAGE_COMPARE,
  GARAGE_FAQ,
  GARAGE_SIZE_OPTIONS,
} from '@/lib/garazhi/sendvichPaneli';
import { Warehouse, Phone, Ruler, Coins, ListChecks, Thermometer, ArrowRight, Car } from 'lucide-react';

export const revalidate = 86400;

const M = PAGE_METADATA.garazhiSendvich;

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

export default function GarazhiSendvichPage() {
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: 'Главная', url: '/' },
    { name: 'Гаражи из сэндвич-панелей: цены и размеры', url: '/garazhi-iz-sendvich-panelej' },
  ]);

  const serviceJsonLd = generateServiceJsonLd(
    'Гараж из сэндвич-панелей под ключ: строительство и монтаж',
    'Тёплый гараж из сэндвич-панелей под ключ в Москве и МО: каркас, панели 100–150 мм, ворота, фундамент и монтаж за 2–4 дня в любой сезон. От 40 000 ₽ за м².',
    `от ${formatRub(GARAGE_RATE_PER_SQM)} за квадратный метр под ключ`
  );

  const faqJsonLd = generateFaqPageJsonLd(GARAGE_FAQ);

  return (
    <div className="min-h-screen bg-background">
      <JsonLdScript data={[breadcrumbJsonLd, serviceJsonLd, faqJsonLd]} />
      <Header />

      <main className="pt-24">
        <section className="py-16 px-4 relative overflow-hidden">
          <div className="absolute inset-0 gradient-mesh opacity-50" />
          <div className="container mx-auto relative z-10">
            <Breadcrumbs items={[{ label: 'Гаражи из сэндвич-панелей' }]} />
            <div className="grid lg:grid-cols-2 gap-10 items-center">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold mb-4">
                  Гаражи из сэндвич-панелей: цены и размеры
                </h1>
                <p className="text-lg text-muted-foreground mb-4">
                  Тёплый гараж из сэндвич-панелей под ключ в Москве и МО: каркас, утеплённые
                  панели 100–150 мм, ворота и фундамент. Монтаж за 2–4 дня —{" "}
                  <strong>даже зимой</strong>, потому что сборка идёт без мокрых процессов.
                  Часто пишут «гараж из сендвич-панелей» — это та же технология, панели
                  сэндвич-конструкции со встроенным утеплителем.
                </p>
                <p className="text-2xl font-bold text-primary mb-6" data-testid="garage-rate">
                  От {formatRub(GARAGE_RATE_PER_SQM)} за м² под ключ
                </p>
                <div className="flex flex-wrap gap-3">
                  <a
                    href="#garage-lead"
                    className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors"
                  >
                    <Warehouse className="w-5 h-5" />
                    Рассчитать мой гараж
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
              <div className="relative h-72 lg:h-96 rounded-2xl overflow-hidden shadow-lg">
                <Image
                  src="/images/garage-sandwich.jpg"
                  alt="Гараж из сэндвич-панелей под ключ — построенный объект"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 px-4">
          <div className="container mx-auto max-w-5xl">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Ruler className="w-6 h-6 text-primary" />
              Размеры и цены: 3х4, 3х6, 4х6, 6х6
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border rounded-xl overflow-hidden bg-background" data-testid="garage-sizes-table">
                <thead>
                  <tr className="bg-secondary text-left">
                    <th className="px-4 py-3 font-semibold">Размер</th>
                    <th className="px-4 py-3 font-semibold">Площадь</th>
                    <th className="px-4 py-3 font-semibold">Вместимость</th>
                    <th className="px-4 py-3 font-semibold">Цена под ключ от</th>
                    <th className="px-4 py-3 font-semibold">Монтаж</th>
                  </tr>
                </thead>
                <tbody>
                  {GARAGE_SIZES.map((row) => (
                    <tr key={row.size} className="border-t">
                      <td className="px-4 py-3 font-medium whitespace-nowrap">{row.size}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{row.sqm} м²</td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{row.cars}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-primary font-semibold">
                        от {formatRub(garagePriceFrom(row.sqm))}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{row.montageDays}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Ориентир на 10.2026 для панели 100 мм с распашными воротами и фундаментом из
              блоков. Секционные ворота с автоматикой, панель 150 мм и бетонная плита меняют
              смету — точную цифру зафиксируем после бесплатного выезда замерщика. Другой
              размер (например, 5 × 8 или на 2 машины с перегородкой) считаем индивидуально.
            </p>
          </div>
        </section>

        <section className="py-12 px-4 bg-secondary/30">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <ListChecks className="w-6 h-6 text-primary" />
              Что входит в «под ключ»
            </h2>
            <div className="space-y-3">
              {GARAGE_INCLUDED.map((row) => (
                <div key={row.item} className="card-modern p-5" data-testid="garage-included-item">
                  <h3 className="font-semibold mb-1">{row.item}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{row.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-12 px-4">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Thermometer className="w-6 h-6 text-primary" />
              Тёплый гараж на зиму — строить можно и в морозы
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Октябрь и ноябрь — лучшее время заказать тёплый гараж: машина уходит с улицы
              до первых морозов, а очередь на производство короче, чем весной. Панель
              100 мм держит плюс внутри даже без отопления — от тепла двигателя и земли;
              конденсата и ржавчины на кузове заметно меньше, чем в холодном металлическом
              пенале. Для мастерской или хранения техники берите 150 мм.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Не уверены, нужен ли тёплый гараж или хватит навеса на зиму?{" "}
              <Link
                href="/navesy/na-zimu-ot-snega"
                className="text-primary hover:underline font-medium"
              >
                Навес для авто на зиму от снега
              </Link>{" "}
              дешевле в 3–4 раза, а{" "}
              <Link
                href="/navesy/pod-klyuch-ceny"
                className="text-primary hover:underline font-medium"
              >
                цены навесов под ключ
              </Link>{" "}
              мы разобрали в отдельной таблице. Гараж — когда машине нужно полноценное
              тепло и закрытое хранение.
            </p>
          </div>
        </section>

        <section className="py-12 px-4 bg-secondary/30">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Coins className="w-6 h-6 text-primary" />
              Сэндвич-панели, профлист или кирпич — что выбрать
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border rounded-xl overflow-hidden bg-background" data-testid="garage-compare-table">
                <thead>
                  <tr className="bg-secondary text-left">
                    <th className="px-4 py-3 font-semibold">Параметр</th>
                    <th className="px-4 py-3 font-semibold text-primary">Сэндвич-панели</th>
                    <th className="px-4 py-3 font-semibold">Профлист</th>
                    <th className="px-4 py-3 font-semibold">Кирпич</th>
                  </tr>
                </thead>
                <tbody>
                  {GARAGE_COMPARE.map((row) => (
                    <tr key={row.param} className="border-t">
                      <td className="px-4 py-3 font-medium">{row.param}</td>
                      <td className="px-4 py-3 text-primary font-medium">{row.sendvich}</td>
                      <td className="px-4 py-3 text-muted-foreground">{row.proflist}</td>
                      <td className="px-4 py-3 text-muted-foreground">{row.kirpich}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Профлист выигрывает только ценой — это холодный вариант «ракушки». Кирпич —
              капитально, но долго и дорого. Сэндвич-панели — тёпло + быстро + в любой сезон.
            </p>
          </div>
        </section>

        <section className="py-12 px-4">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Car className="w-6 h-6 text-primary" />
              Какой бывает гараж из сэндвич-панелей
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="card-modern p-5">
                <h3 className="font-semibold mb-2">Модульный</h3>
                <p className="text-sm text-muted-foreground">
                  Собирается на производстве и привозится готовым блоком — установка краном
                  за 1 день. Можно перевезти на другой участок.
                </p>
              </div>
              <div className="card-modern p-5">
                <h3 className="font-semibold mb-2">Сборный</h3>
                <p className="text-sm text-muted-foreground">
                  Комплект привозим на участок и собираем на болтах за 2–4 дня. Подходит для
                  узких проездов и нестандартных размеров.
                </p>
              </div>
              <div className="card-modern p-5">
                <h3 className="font-semibold mb-2">На 2 машины</h3>
                <p className="text-sm text-muted-foreground">
                  6 × 6 м и больше: два машиноместа с комфортными воротами, опционально —
                  перегородка под мастерскую или хозблок.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="garage-lead" className="py-12 px-4 bg-secondary/30">
          <div className="container mx-auto max-w-4xl">
            <div className="grid md:grid-cols-2 gap-6 items-start">
              <LeadForm
                source="garazhi-iz-sendvich-panelej"
                plotOptions={GARAGE_SIZE_OPTIONS}
                title="Расчёт гаража под ваши размеры"
                submitLabel="Получить смету гаража"
                subtitle="Приедем на участок, оценим площадку и привезём смету с точной ценой вашего гаража — бесплатно и без обязательств."
                selectLabel="Размер гаража"
              />
              <div className="card-modern p-6">
                <h3 className="text-lg font-bold mb-3">Как заказывается гараж</h3>
                <ol className="space-y-3 text-sm text-muted-foreground list-decimal list-inside">
                  <li>Заявка или звонок — уточняем размер, ворота, основание.</li>
                  <li>Выезд на участок — бесплатно, по Москве и МО.</li>
                  <li>Проект и фиксированная смета — цена не меняется после подписания.</li>
                  <li>Производство и монтаж за 2–4 дня, зимой — без наценки за сезон.</li>
                  <li>Сдача с договором и гарантией.</li>
                </ol>
                <p className="text-sm mt-4">
                  Остались вопросы по размерам или воротам? Позвоните:{' '}
                  <TrackedPhoneLink
                    href="tel:+74993901595"
                    className="text-primary hover:underline font-medium"
                  >
                    +7 (499) 390-15-95
                  </TrackedPhoneLink>
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 px-4">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-2xl font-bold mb-6">Частые вопросы про гаражи из сэндвич-панелей</h2>
            <FaqAccordion items={GARAGE_FAQ} />
          </div>
        </section>

        <section className="py-16 px-4 bg-primary text-primary-foreground">
          <div className="container mx-auto max-w-3xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Тёплый гараж — до первых морозов
            </h2>
            <p className="text-xl opacity-90 mb-8">
              Рассчитаем смету под ваши размеры за один выезд — или позвоните:
              +7 (499) 390-15-95
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a
                href="#garage-lead"
                className="inline-flex items-center gap-2 bg-white text-primary px-8 py-4 rounded-xl font-semibold hover:bg-white/90 transition-colors"
              >
                <Warehouse className="w-5 h-5" />
                Рассчитать гараж
              </a>
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
