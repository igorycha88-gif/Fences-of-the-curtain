import Link from 'next/link';
import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import logger from '@/lib/logger';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import JsonLdScript from '@/components/seo/JsonLdScript';
import FaqAccordion from '@/components/geo/FaqAccordion';
import {
  generateBreadcrumbJsonLd,
  generateServiceJsonLd,
  generateFaqPageJsonLd,
} from '@/lib/seo/jsonld';
import { generatePageMetadata } from '@/lib/seo/metadata';
import { PAGE_METADATA, BUSINESS_INFO } from '@/lib/seo/constants';
import { NAVESY_POD_KLYUCH_FAQ } from '@/lib/geo/content';
import { getWave1Cities } from '@/lib/geo/cities';
import { Calculator, ArrowRight, Car, Phone } from 'lucide-react';

export const revalidate = 86400;

export const metadata: Metadata = generatePageMetadata({
  title: PAGE_METADATA.navesyPodKlyuch.title,
  description: PAGE_METADATA.navesyPodKlyuch.description,
  keywords: PAGE_METADATA.navesyPodKlyuch.keywords,
  path: PAGE_METADATA.navesyPodKlyuch.path,
});

const canopyTypes = [
  {
    name: 'Односкатный навес',
    desc: 'Самый практичный вариант: компактный, быстро монтируется, отлично подходит для пристройки к дому или гаражу. Кровля — поликарбонат или профлист.',
  },
  {
    name: 'Двускатный навес',
    desc: 'Классическая конструкция с двумя скатами. Устойчив к снеговым нагрузкам Подмосковья, не задерживает осадки, подходит для двух и более автомобилей.',
  },
  {
    name: 'Арочный навес',
    desc: 'Изогнутые фермы и поликарбонат — эстетично и обтекаемо. Арочная форма хорошо противостоит ветру, снег скатывается сам.',
  },
];

const includedItems = [
  'Проектное решение под размеры площадки и количество машин',
  'Металлокаркас с антикоррозийной обработкой и покраской',
  'Покрытие: сотовый поликарбонат или профлист (выбор цвета)',
  'Крепёж и фурнитура',
  'Доставка материалов на объект',
  'Монтаж с бетонированием опор',
  'Уборка территории после работ',
  'Гарантия по договору',
];

export default async function NavesyPodKlyuchPage() {
  let canopyPortfolio: { id: string; title: string }[] = [];

  try {
    canopyPortfolio = await prisma.portfolioItem.findMany({
      where: { active: true, category: 'canopy' },
      select: { id: true, title: true },
      orderBy: { updatedAt: 'desc' },
      take: 6,
    });
  } catch (error) {
    logger.error('Failed to load canopy portfolio for /navesy-pod-klyuch', {
      module: 'navesy-pod-klyuch-page',
      operation: 'loadCanopyPortfolio',
      error,
    });
  }

  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: 'Главная', url: '/' },
    { name: 'Навесы под ключ — цена', url: '/navesy-pod-klyuch' },
  ]);

  const serviceJsonLd = generateServiceJsonLd(
    'Навесы под ключ — для автомобилей и дачи',
    'Навесы для автомобилей из поликарбоната и профлиста под ключ в Московской области: односкатные, двускатные, арочные. Монтаж от 1 дня, гарантия по договору.',
    '₽₽'
  );

  const faqJsonLd = generateFaqPageJsonLd(NAVESY_POD_KLYUCH_FAQ);

  const topCities = getWave1Cities().filter((c) =>
    ['balashiha', 'podolsk', 'lyubercy', 'elektrostal', 'kolomna', 'domodedovo'].includes(c.slug)
  );

  return (
    <div className="min-h-screen bg-background">
      <JsonLdScript data={[breadcrumbJsonLd, serviceJsonLd, faqJsonLd]} />
      <Header />

      <main className="pt-24">
        <section className="py-16 px-4 relative overflow-hidden">
          <div className="absolute inset-0 gradient-mesh opacity-50" />
          <div className="container mx-auto relative z-10">
            <Breadcrumbs items={[{ label: 'Навесы под ключ — цена' }]} />
            <div className="max-w-4xl">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Навесы под ключ — цены
              </h1>
              <p className="text-lg text-muted-foreground mb-6">
                Навесы для автомобилей и дачи из сотового поликарбоната и профлиста в
                Москве и Московской области. Изготовление, доставка и монтаж под ключ,
                установка от 1 дня, гарантия по договору. Точную стоимость под ваши
                размеры покажет калькулятор — бесплатно.
              </p>
              <Link
                href="/calculator/canopy"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors"
              >
                <Calculator className="w-5 h-5" />
                Рассчитать навес
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>

        <section className="py-12 px-4">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-2xl font-bold mb-6">Типы навесов</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {canopyTypes.map((type) => (
                <div key={type.name} className="card-modern p-5">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Car className="w-4 h-4 text-primary" />
                    {type.name}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{type.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-12 px-4 bg-secondary/30">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-2xl font-bold mb-6">Что влияет на цену</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border rounded-xl overflow-hidden bg-background">
                <thead>
                  <tr className="bg-secondary text-left">
                    <th className="px-4 py-3 font-semibold">Фактор</th>
                    <th className="px-4 py-3 font-semibold">Как влияет на стоимость</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t">
                    <td className="px-4 py-3 font-medium">Размер (места под авто)</td>
                    <td className="px-4 py-3 text-muted-foreground">Основной фактор: 1, 2 или 3 машины — площадь кровли и длина ферм</td>
                  </tr>
                  <tr className="border-t">
                    <td className="px-4 py-3 font-medium">Тип конструкции</td>
                    <td className="px-4 py-3 text-muted-foreground">Односкатный дешевле двускатного; арочный — за счёт готовых гнутых ферм</td>
                  </tr>
                  <tr className="border-t">
                    <td className="px-4 py-3 font-medium">Материал кровли</td>
                    <td className="px-4 py-3 text-muted-foreground">Поликарбонат дороже профлиста, но легче и пропускает свет</td>
                  </tr>
                  <tr className="border-t">
                    <td className="px-4 py-3 font-medium">Тип установки</td>
                    <td className="px-4 py-3 text-muted-foreground">Отдельно стоящий или пристроенный к дому (требует усиленной балки)</td>
                  </tr>
                  <tr className="border-t">
                    <td className="px-4 py-3 font-medium">Логистика</td>
                    <td className="px-4 py-3 text-muted-foreground">Удалённость объекта от МКАД; при заказе от 20 м забора доставка входит в цену</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Точную цену с монтажом и доставкой считайте в{' '}
              <Link href="/calculator/canopy" className="text-primary hover:underline">
                калькуляторе навеса
              </Link>{' '}
              — за 30 секунд, без телефона и регистрации.
            </p>
          </div>
        </section>

        <section className="py-12 px-4">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-2xl font-bold mb-6">Что входит в цену «под ключ»</h2>
            <ul className="grid sm:grid-cols-2 gap-3">
              {includedItems.map((item) => (
                <li key={item} className="flex items-start gap-2 text-muted-foreground">
                  <ArrowRight className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {canopyPortfolio.length > 0 && (
          <section className="py-12 px-4 bg-secondary/30">
            <div className="container mx-auto max-w-4xl">
              <h2 className="text-2xl font-bold mb-6">Наши навесы — фото работ</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {canopyPortfolio.map((item) => (
                  <Link
                    key={item.id}
                    href={`/portfolio/${item.id}`}
                    className="card-modern p-4 hover-lift group"
                  >
                    <h3 className="font-semibold group-hover:text-primary transition-colors">
                      {item.title}
                    </h3>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="py-12 px-4">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-2xl font-bold mb-6">
              Частые вопросы про навесы под ключ
            </h2>
            <FaqAccordion items={NAVESY_POD_KLYUCH_FAQ} />
          </div>
        </section>

        <section className="py-12 px-4 bg-secondary/30">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-2xl font-bold mb-6">Навесы под ключ в городах МО</h2>
            <div className="flex flex-wrap gap-3">
              {topCities.map((city) => (
                <Link
                  key={city.slug}
                  href={`/zabory-navesy/${city.slug}`}
                  className="px-4 py-2 rounded-full border hover:border-primary/50 hover:text-primary transition-colors text-sm font-medium"
                >
                  Навес {city.nameIn}
                </Link>
              ))}
              <Link
                href="/zabory-navesy"
                className="px-4 py-2 rounded-full border hover:border-primary/50 hover:text-primary transition-colors text-sm font-medium"
              >
                Все города →
              </Link>
            </div>
          </div>
        </section>

        <section className="py-16 px-4 bg-primary text-primary-foreground">
          <div className="container mx-auto max-w-3xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Рассчитайте навес под ключ
            </h2>
            <p className="text-xl opacity-90 mb-8">
              Онлайн за 30 секунд — или позвоните: {BUSINESS_INFO.telephoneDisplay}
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="/calculator/canopy"
                className="inline-flex items-center gap-2 bg-white text-primary px-8 py-4 rounded-xl font-semibold hover:bg-white/90 transition-colors"
              >
                <Calculator className="w-5 h-5" />
                Калькулятор навеса
              </Link>
              <a
                href={`tel:${BUSINESS_INFO.telephone}`}
                className="inline-flex items-center gap-2 border border-white/40 text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/10 transition-colors"
              >
                <Phone className="w-5 h-5" />
                Позвонить
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
