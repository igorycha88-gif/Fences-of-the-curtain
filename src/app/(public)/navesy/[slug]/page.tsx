import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import logger from '@/lib/logger';
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
import {
  NAVESY_SIZES,
  NAVESY_SIZE_SLUGS,
  SNOW_LOAD_NOTE,
  getNavesySizeBySlug,
  formatRub,
  type NavesySize,
} from '@/lib/navesy/sizes';
import { Calculator, ArrowRight, Car, Phone, Snowflake, Ruler } from 'lucide-react';

export const revalidate = 86400;

interface NavesySizePageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return NAVESY_SIZE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: NavesySizePageProps): Promise<Metadata> {
  const { slug } = await params;
  const size = getNavesySizeBySlug(slug);

  if (!size) {
    return {};
  }

  return generatePageMetadata({
    title: size.title,
    description: size.description,
    keywords: size.keywords,
    path: `/navesy/${size.slug}`,
  });
}

export default async function NavesySizePage({ params }: NavesySizePageProps) {
  const { slug } = await params;
  const size = getNavesySizeBySlug(slug);

  if (!size) {
    notFound();
  }

  let canopyPortfolio: { id: string; title: string }[] = [];

  try {
    canopyPortfolio = await prisma.portfolioItem.findMany({
      where: { active: true, category: 'canopy' },
      select: { id: true, title: true },
      orderBy: { updatedAt: 'desc' },
      take: 6,
    });
  } catch (error) {
    logger.error('Failed to load canopy portfolio for navesy size page', {
      module: 'navesy-size-page',
      operation: 'loadCanopyPortfolio',
      sizeSlug: size.slug,
      error,
    });
  }

  return <SizePage size={size} canopyPortfolio={canopyPortfolio} />;
}

function SizePage({
  size,
  canopyPortfolio,
}: {
  size: NavesySize;
  canopyPortfolio: { id: string; title: string }[];
}) {
  const otherSizes = NAVESY_SIZES.filter((s) => s.slug !== size.slug);

  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: 'Главная', url: '/' },
    { name: 'Навесы под ключ — цены', url: '/navesy-pod-klyuch' },
    { name: size.name, url: `/navesy/${size.slug}` },
  ]);

  const serviceJsonLd = generateServiceJsonLd(
    `${size.h1} под ключ`,
    `${size.name} для автомобилей с монтажом в Москве и Московской области. Цена от ${formatRub(size.priceFromRub)} под ключ, расчёт под снеговую нагрузку III района.`,
    `от ${size.priceFromRub} RUB под ключ`
  );

  const faqJsonLd = generateFaqPageJsonLd(size.faq);

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
                { label: size.name },
              ]}
            />
            <div className="max-w-4xl">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">{size.h1}</h1>
              <p className="text-lg text-muted-foreground mb-2">
                Площадь кровли {size.areaM2} м² · под ключ от{' '}
                <span className="text-primary font-bold">{formatRub(size.priceFromRub)}</span>
              </p>
              <p className="text-base text-muted-foreground mb-6">
                {size.recommendedConstruction}. Монтаж от 1–2 дней, гарантия по договору, замер
                бесплатно — Москва и Московская область.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/calculator/canopy"
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors"
                >
                  <Calculator className="w-5 h-5" />
                  Рассчитать этот навес
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
          <div className="container mx-auto max-w-4xl space-y-4">
            {size.intro.map((paragraph, index) => (
              <p key={index} className="text-muted-foreground leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>
        </section>

        <section className="py-12 px-4 bg-secondary/30">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Ruler className="w-6 h-6 text-primary" />
              Чертёж и размеры
            </h2>
            <div className="card-modern p-6 mb-6" data-testid="size-scheme">
              <div className="relative border-2 border-dashed border-primary/40 rounded-xl h-40 mb-6 flex items-center justify-center">
                <div className="text-center">
                  <Car className="w-10 h-10 text-primary/60 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">{size.carsFit}</p>
                </div>
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-background px-3 text-sm font-semibold text-primary">
                  {size.widthM} м
                </span>
                <span className="absolute top-1/2 -right-3 translate-y-[-50%] rotate-90 bg-background px-3 text-sm font-semibold text-primary origin-center">
                  {size.depthM} м
                </span>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-background rounded-xl p-4 border">
                  <p className="text-xs text-muted-foreground mb-1">Ширина</p>
                  <p className="text-lg font-bold">{size.widthM} м</p>
                </div>
                <div className="bg-background rounded-xl p-4 border">
                  <p className="text-xs text-muted-foreground mb-1">Глубина</p>
                  <p className="text-lg font-bold">{size.depthM} м</p>
                </div>
                <div className="bg-background rounded-xl p-4 border">
                  <p className="text-xs text-muted-foreground mb-1">Площадь кровли</p>
                  <p className="text-lg font-bold">{size.areaM2} м²</p>
                </div>
                <div className="bg-background rounded-xl p-4 border">
                  <p className="text-xs text-muted-foreground mb-1">Цена под ключ</p>
                  <p className="text-lg font-bold text-primary">от {formatRub(size.priceFromRub)}</p>
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Высота навеса — от 2,3 м в нижней точке (регламентируется ГОСТ для лёгких навесов).
              Чертёж под ваш двор с привязкой к дому и заезду замерщик составляет бесплатно.
            </p>
          </div>
        </section>

        <section className="py-12 px-4">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Snowflake className="w-6 h-6 text-primary" />
              Снеговая и ветровая нагрузка
            </h2>
            <p className="text-muted-foreground leading-relaxed">{SNOW_LOAD_NOTE}</p>
          </div>
        </section>

        <section className="py-12 px-4 bg-secondary/30">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-2xl font-bold mb-6">Цена под ключ по материалам кровли</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border rounded-xl overflow-hidden bg-background">
                <thead>
                  <tr className="bg-secondary text-left">
                    <th className="px-4 py-3 font-semibold">Вариант</th>
                    <th className="px-4 py-3 font-semibold">Цена под ключ</th>
                    <th className="px-4 py-3 font-semibold">Примечание</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t">
                    <td className="px-4 py-3 font-medium">Сотовый поликарбонат 8–10 мм</td>
                    <td className="px-4 py-3 whitespace-nowrap text-primary font-semibold">
                      от {formatRub(size.priceFromRub)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      пропускает свет, машина не перегревается
                    </td>
                  </tr>
                  <tr className="border-t">
                    <td className="px-4 py-3 font-medium">Профлист С8/С21</td>
                    <td className="px-4 py-3 whitespace-nowrap text-primary font-semibold">
                      по расчёту
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      дешевле, полное затенение — точную цену покажет калькулятор
                    </td>
                  </tr>
                  <tr className="border-t">
                    <td className="px-4 py-3 font-medium">Двускатная конструкция с фермами</td>
                    <td className="px-4 py-3 whitespace-nowrap text-primary font-semibold">
                      по расчёту
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      максимальная жёсткость, снег сходит сам
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              В цену входит: каркас с антикоррозийной обработкой, покрытие, крепёж, доставка,
              монтаж с бетонированием опор и уборка. Точный расчёт под ваши размеры — в
              калькуляторе навеса.
            </p>
          </div>
        </section>

        <MontageInDayBanner mode="canopy" />

        {canopyPortfolio.length > 0 && (
          <section className="py-12 px-4">
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

        <section className="py-12 px-4 bg-secondary/30">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-2xl font-bold mb-6">Частые вопросы про {size.name.toLowerCase()}</h2>
            <FaqAccordion items={size.faq} />
          </div>
        </section>

        {otherSizes.length > 0 && (
          <section className="py-12 px-4">
            <div className="container mx-auto max-w-4xl">
              <h2 className="text-2xl font-bold mb-6">Другие популярные размеры навесов</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {otherSizes.map((other) => (
                  <Link
                    key={other.slug}
                    href={`/navesy/${other.slug}`}
                    className="card-modern p-5 hover-lift group"
                  >
                    <h3 className="font-semibold group-hover:text-primary transition-colors">
                      {other.h1}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {other.areaM2} м² · от {formatRub(other.priceFromRub)}
                    </p>
                  </Link>
                ))}
                <Link
                  href="/navesy-pod-klyuch"
                  className="card-modern p-5 hover-lift group"
                >
                  <h3 className="font-semibold group-hover:text-primary transition-colors">
                    Все навесы под ключ — цены
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    типы конструкций, что входит в цену
                  </p>
                </Link>
              </div>
            </div>
          </section>
        )}

        <section className="py-16 px-4 bg-primary text-primary-foreground">
          <div className="container mx-auto max-w-3xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Закажите {size.name.toLowerCase()} под ключ
            </h2>
            <p className="text-xl opacity-90 mb-8">
              Рассчитайте точную цену онлайн за 30 секунд — или позвоните: +7 (499) 390-15-95
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
