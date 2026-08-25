import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import logger from '@/lib/logger';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import JsonLdScript from '@/components/seo/JsonLdScript';
import CityGrid from '@/components/geo/CityGrid';
import FaqAccordion from '@/components/geo/FaqAccordion';
import {
  generateBreadcrumbJsonLd,
  generateGeoServiceJsonLd,
  generateFaqPageJsonLd,
  generateItemListJsonLd,
} from '@/lib/seo/jsonld';
import { generatePageMetadata } from '@/lib/seo/metadata';
import {
  getCityBySlug,
  getHubBySlug,
  getCitiesByDirection,
  getHubByDirection,
  GEO_HUB_SLUGS,
  GEO_SLUGS,
  type GeoCity,
  type GeoHub,
} from '@/lib/geo/cities';
import {
  generateCityFaq,
  generateCityPriceTable,
  generateCityTitle,
  generateCityDescription,
  generateCityKeywords,
  generateHubTitle,
  generateHubDescription,
  generateNearbyCitiesLinks,
  generateDistrictsText,
  generateDachaBlock,
} from '@/lib/geo/content';
import { Calculator, ArrowRight, MapPin, Car, Phone } from 'lucide-react';

export const revalidate = 86400;

interface GeoPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return [...GEO_SLUGS, ...GEO_HUB_SLUGS].map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: GeoPageProps): Promise<Metadata> {
  const { slug } = await params;

  const city = getCityBySlug(slug);
  if (city) {
    return generatePageMetadata({
      title: generateCityTitle(city),
      description: generateCityDescription(city),
      keywords: generateCityKeywords(city),
      path: `/zabory-navesy/${city.slug}`,
    });
  }

  const hub = getHubBySlug(slug);
  if (hub) {
    return generatePageMetadata({
      title: generateHubTitle(hub),
      description: generateHubDescription(hub),
      keywords: [
        `заборы ${hub.nameIn}`,
        `навесы ${hub.nameIn}`,
        `забор под ключ ${hub.name.toLowerCase()}`,
      ],
      path: `/zabory-navesy/${hub.slug}`,
    });
  }

  return {};
}

export default async function GeoPage({ params }: GeoPageProps) {
  const { slug } = await params;

  const city = getCityBySlug(slug);
  const hub = getHubBySlug(slug);

  if (!city && !hub) {
    notFound();
  }

  if (hub) {
    return <HubPage hub={hub} />;
  }

  let portfolioItems: {
    id: string;
    title: string;
    category: string;
    images: unknown;
  }[] = [];

  try {
    portfolioItems = await prisma.portfolioItem.findMany({
      where: { active: true },
      select: { id: true, title: true, category: true, images: true },
      orderBy: { updatedAt: 'desc' },
      take: 6,
    });
  } catch (error) {
    logger.error('Failed to load portfolio items for geo page', {
      module: 'geo-city-page',
      operation: 'loadPortfolio',
      citySlug: city?.slug,
      error,
    });
  }

  return <CityPage city={city as GeoCity} portfolioItems={portfolioItems} />;
}

function CityPage({
  city,
  portfolioItems,
}: {
  city: GeoCity;
  portfolioItems: { id: string; title: string; category: string; images: unknown }[];
}) {
  const faq = generateCityFaq(city);
  const prices = generateCityPriceTable(city);
  const neighbours = generateNearbyCitiesLinks(city);
  const districtsText = generateDistrictsText(city);
  const dachaBlock = generateDachaBlock(city);
  const directionHub = getHubByDirection(city.direction);

  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: 'Главная', url: '/' },
    { name: 'Заборы и навесы в Подмосковье', url: '/zabory-navesy' },
    { name: city.name, url: `/zabory-navesy/${city.slug}` },
  ]);

  const serviceJsonLd = generateGeoServiceJsonLd(city);
  const faqJsonLd = generateFaqPageJsonLd(faq);

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
                { label: 'Заборы и навесы в Подмосковье', href: '/zabory-navesy' },
                { label: city.name },
              ]}
            />
            <div className="max-w-4xl">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Заборы и навесы {city.nameIn}
              </h1>
              <p className="text-lg text-muted-foreground mb-6">
                Под ключ с гарантией по договору: замер бесплатно, монтаж от 1 дня.
                {` ${city.driveTime}`} — выезд бригады.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/calculator/fence"
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors"
                >
                  <Calculator className="w-5 h-5" />
                  Рассчитать забор
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/calculator/canopy"
                  className="inline-flex items-center gap-2 border border-primary/30 text-primary px-6 py-3 rounded-xl font-semibold hover:bg-primary/5 transition-colors"
                >
                  <Car className="w-5 h-5" />
                  Рассчитать навес
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 px-4">
          <div className="container mx-auto max-w-4xl space-y-4">
            {city.localContext.map((paragraph, index) => (
              <p key={index} className="text-muted-foreground leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>
        </section>

        <section className="py-12 px-4 bg-secondary/30">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-2xl font-bold mb-4">
              Забор из профнастила {city.nameIn}
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Профнастил — самый популярный материал для ограждения участков {city.nameIn}:
              быстро монтируется, не требует ухода и надёжно закрывает территорию от
              посторонних глаз. Ставим заборы из профнастила С8 и С20 с полимерным
              покрытием на металлических столбах с бетонированием — конструкция служит
              десятилетиями в климате Подмосковья.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/services/zabor-iz-profnastila"
                className="inline-flex items-center gap-2 text-primary hover:underline"
              >
                Подробнее об услуге <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/calculator/fence"
                className="inline-flex items-center gap-2 text-primary hover:underline"
              >
                Калькулятор забора <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        <section className="py-12 px-4">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-2xl font-bold mb-4">Евроштакетник и 3D-заборы</h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Для лицевой линии участка {city.nameIn} рекомендуем двусторонний
              евроштакетник в шахматном порядке — аккуратен с обеих сторон и не
              затеняет посадки. 3D-панели с полимерным покрытием — современное решение
              для коттеджных посёлков и территорий с требованиями к внешнему виду
              ограждений.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/services/zabor-iz-evroshtaketnika"
                className="inline-flex items-center gap-2 text-primary hover:underline"
              >
                Забор из евроштакетника <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/services/zabor-iz-3d-panelej"
                className="inline-flex items-center gap-2 text-primary hover:underline"
              >
                Забор из 3D-панелей <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/services/zabor-iz-setki-rabitsy"
                className="inline-flex items-center gap-2 text-primary hover:underline"
              >
                Сетка-рабица <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        <section className="py-12 px-4 bg-secondary/30">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-2xl font-bold mb-4">
              Навесы для автомобилей {city.nameIn}
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Навес из сотового поликарбоната или профлиста защитит автомобиль от
              осадков и перегрева круглый год. Делаем отдельно стоящие и пристроенные
              к дому конструкции на фермах, с покраской каркаса в цвет фасада.
              Расчёт под размеры вашего двора — в калькуляторе навеса.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/navesy-pod-klyuch"
                className="inline-flex items-center gap-2 text-primary hover:underline"
              >
                Навесы под ключ — цены <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/calculator/canopy"
                className="inline-flex items-center gap-2 text-primary hover:underline"
              >
                Калькулятор навеса <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {dachaBlock && (
          <section className="py-12 px-4">
            <div className="container mx-auto max-w-4xl">
              <h2 className="text-2xl font-bold mb-4">{dachaBlock.title}</h2>
              <p className="text-muted-foreground leading-relaxed">{dachaBlock.text}</p>
            </div>
          </section>
        )}

        <section className="py-12 px-4 bg-secondary/30">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-2xl font-bold mb-6">
              Цены с монтажом и доставкой {city.nameIn}
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border rounded-xl overflow-hidden bg-background">
                <thead>
                  <tr className="bg-secondary text-left">
                    <th className="px-4 py-3 font-semibold">Что</th>
                    <th className="px-4 py-3 font-semibold">Цена</th>
                    <th className="px-4 py-3 font-semibold">Примечание</th>
                  </tr>
                </thead>
                <tbody>
                  {prices.map((row) => (
                    <tr key={row.material} className="border-t">
                      <td className="px-4 py-3 font-medium">{row.material}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-primary font-semibold">
                        {row.price}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{row.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Логистика: {city.highway}, ~{city.distanceKm} км от МКАД. Точную стоимость
              под ваш участок покажет калькулятор — бесплатно и без обязательств.
            </p>
          </div>
        </section>

        {portfolioItems.length > 0 && (
          <section className="py-12 px-4">
            <div className="container mx-auto max-w-4xl">
              <h2 className="text-2xl font-bold mb-6">Наши объекты</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {portfolioItems.map((item) => (
                  <Link
                    key={item.id}
                    href={`/portfolio/${item.id}`}
                    className="card-modern p-4 hover-lift group"
                  >
                    <h3 className="font-semibold group-hover:text-primary transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-muted-foreground text-sm mt-1">
                      {item.category === 'canopy' ? 'Навес' : item.category === 'garage' ? 'Гараж/навес' : 'Забор'}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="py-12 px-4 bg-secondary/30">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-2xl font-bold mb-4">Районы выезда</h2>
            <p className="text-muted-foreground leading-relaxed">{districtsText}</p>
          </div>
        </section>

        <section className="py-12 px-4">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-2xl font-bold mb-6">
              Частые вопросы про заборы и навесы {city.nameIn}
            </h2>
            <FaqAccordion items={faq} />
          </div>
        </section>

        {neighbours.length > 0 && (
          <section className="py-12 px-4 bg-secondary/30">
            <div className="container mx-auto max-w-5xl">
              <h2 className="text-2xl font-bold mb-6">
                Рядом с {city.nameIn}: работаем в соседних городах
              </h2>
              <CityGrid cities={neighbours} currentSlug={city.slug} />
              <div className="mt-6">
                <Link
                  href={`/zabory-navesy/${directionHub.slug}`}
                  className="inline-flex items-center gap-2 text-primary hover:underline"
                >
                  <MapPin className="w-4 h-4" />
                  Все города направления «{directionHub.name}»
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </section>
        )}

        <section className="py-16 px-4 bg-primary text-primary-foreground">
          <div className="container mx-auto max-w-3xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Закажите забор или навес {city.nameIn}
            </h2>
            <p className="text-xl opacity-90 mb-8">
              Рассчитайте стоимость онлайн за 30 секунд — или позвоните:
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
              <a
                href="tel:+74993901595"
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

function HubPage({ hub }: { hub: GeoHub }) {
  const cities = getCitiesByDirection(hub.direction);
  const otherHubs = GEO_HUB_SLUGS
    .map((s) => getHubBySlug(s))
    .filter((h): h is GeoHub => h !== undefined && h.slug !== hub.slug);

  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: 'Главная', url: '/' },
    { name: 'Заборы и навесы в Подмосковье', url: '/zabory-navesy' },
    { name: hub.name, url: `/zabory-navesy/${hub.slug}` },
  ]);

  const citiesItemList = generateItemListJsonLd(
    `Города — ${hub.name}`,
    cities.map((c) => ({
      name: `Заборы и навесы ${c.nameIn}`,
      url: `/zabory-navesy/${c.slug}`,
    }))
  );

  return (
    <div className="min-h-screen bg-background">
      <JsonLdScript data={[breadcrumbJsonLd, citiesItemList]} />
      <Header />

      <main className="pt-24">
        <section className="py-16 px-4 relative overflow-hidden">
          <div className="absolute inset-0 gradient-mesh opacity-50" />
          <div className="container mx-auto relative z-10">
            <Breadcrumbs
              items={[
                { label: 'Заборы и навесы в Подмосковье', href: '/zabory-navesy' },
                { label: hub.name },
              ]}
            />
            <div className="max-w-4xl">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Заборы и навесы — {hub.name}
              </h1>
              <p className="text-lg text-muted-foreground mb-6">
                {hub.highways.join(' · ')}. Под ключ от 2 600 ₽/м, монтаж от 1 дня,
                гарантия по договору.
              </p>
              <Link
                href="/calculator/fence"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors"
              >
                <Calculator className="w-5 h-5" />
                Рассчитать стоимость
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>

        <section className="py-12 px-4">
          <div className="container mx-auto max-w-4xl space-y-4">
            {hub.description.map((paragraph, index) => (
              <p key={index} className="text-muted-foreground leading-relaxed">
                {paragraph}
              </p>
            ))}
            <p className="text-muted-foreground leading-relaxed">
              <strong>Дачные направления:</strong> {hub.dachaAreas}.
            </p>
          </div>
        </section>

        <section className="py-12 px-4 bg-secondary/30">
          <div className="container mx-auto max-w-5xl">
            <h2 className="text-2xl font-bold mb-6">Города направления</h2>
            <CityGrid cities={cities} />
          </div>
        </section>

        <section className="py-12 px-4">
          <div className="container mx-auto max-w-5xl">
            <h2 className="text-2xl font-bold mb-6">Другие направления</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {otherHubs.map((otherHub) => (
                <Link
                  key={otherHub.slug}
                  href={`/zabory-navesy/${otherHub.slug}`}
                  className="card-modern p-5 hover-lift group flex items-center justify-between"
                >
                  <span className="font-semibold group-hover:text-primary transition-colors">
                    {otherHub.name}
                  </span>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </Link>
              ))}
            </div>
            <div className="mt-6">
              <Link
                href="/zabory-navesy"
                className="inline-flex items-center gap-2 text-primary hover:underline"
              >
                <MapPin className="w-4 h-4" />
                Все города Подмосковья
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        <section className="py-16 px-4 bg-primary text-primary-foreground">
          <div className="container mx-auto max-w-3xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Забор или навес {hub.nameIn}?
            </h2>
            <p className="text-xl opacity-90 mb-8">
              Рассчитайте стоимость онлайн — бесплатно и без обязательств
            </p>
            <Link
              href="/calculator/fence"
              className="inline-flex items-center gap-2 bg-white text-primary px-8 py-4 rounded-xl font-semibold hover:bg-white/90 transition-colors"
            >
              <Calculator className="w-5 h-5" />
              Рассчитать стоимость
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
