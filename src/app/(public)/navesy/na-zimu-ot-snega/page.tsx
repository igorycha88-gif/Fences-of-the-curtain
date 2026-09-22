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
import SeasonCountdown from '@/components/seo/SeasonCountdown';
import { generateBreadcrumbJsonLd, generateServiceJsonLd, generateFaqPageJsonLd } from '@/lib/seo/jsonld';
import { generatePageMetadata } from '@/lib/seo/metadata';
import { PAGE_METADATA } from '@/lib/seo/constants';
import { NAVESY_SIZES, formatRub } from '@/lib/navesy/sizes';
import { SEASON_END_ISO, ZIMA_FAQ, TENT_VS_NAVES } from '@/lib/navesy/zima';
import { Calculator, ArrowRight, Phone, Snowflake, ThermometerSnowflake, Ruler } from 'lucide-react';

export const revalidate = 86400;

const M = PAGE_METADATA.navesyZima;

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

export default async function NavesyNaZimuPage() {
  let canopyPortfolio: { id: string; title: string }[] = [];

  try {
    canopyPortfolio = await prisma.portfolioItem.findMany({
      where: { active: true, category: 'canopy' },
      select: { id: true, title: true },
      orderBy: { updatedAt: 'desc' },
      take: 6,
    });
  } catch (error) {
    logger.error('Failed to load canopy portfolio for winter canopy page', {
      module: 'navesy-zima-page',
      operation: 'loadCanopyPortfolio',
      error,
    });
  }

  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: 'Главная', url: '/' },
    { name: 'Навесы под ключ — цены', url: '/navesy-pod-klyuch' },
    { name: 'Навес для авто на зиму от снега', url: '/navesy/na-zimu-ot-snega' },
  ]);

  const serviceJsonLd = generateServiceJsonLd(
    'Зимний навес для автомобиля от снега под ключ',
    'Навесы для авто на зиму с расчётом под снеговую нагрузку III района МО (180 кг/м²). Цена под ключ от 39 000 ₽, монтаж за 1–2 дня до морозов. Москва и Московская область.',
    'от 39000 RUB под ключ'
  );

  const faqJsonLd = generateFaqPageJsonLd(ZIMA_FAQ);

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
                { label: 'Навес на зиму от снега' },
              ]}
            />
            <div className="max-w-4xl">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Навес для авто на зиму: защита от снега и наледи
              </h1>
              <p className="text-lg text-muted-foreground mb-4">
                Зимой машине нужен не гараж, а крыша, рассчитанная на снег. Московская область —
                III снеговой район: <strong>180 кг/м²</strong>. Наши навесы считаются под эту
                нагрузку с запасом и монтируются за 1–2 дня — ещё до морозов. Под ключ
                от <span className="text-primary font-bold">39 000 ₽</span>.
              </p>
              <div className="mb-6">
                <SeasonCountdown targetIso={SEASON_END_ISO} />
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/calculator/canopy"
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors"
                >
                  <Calculator className="w-5 h-5" />
                  Рассчитать зимний навес
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

        <section className="py-12 px-4 bg-secondary/30">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Snowflake className="w-6 h-6 text-primary" />
              Снеговая нагрузка МО: сколько держит правильный навес
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              По СП 20.13330.2016 Московская область относится к III снеговому району: расчётная
              нагрузка — 180 кг на квадратный метр кровли. Для популярного навеса 6×4 м (24 м²)
              это около <strong>4,3 тонны снега</strong>. Правильный навес держит её без чистки:
              усиленные фермы из профиля 60×60 мм, опоры 80×80 мм с заглублением 1–1,2 м и
              бетонированием, шаг опор не более 3 метров.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Именно «снеговой» расчёт отличает капитальный навес от летней беседки: каркас,
              спроектированный без запаса, проседает после первого же мокрого снегопада. Все наши
              конструкции считаются под III район — расчёт входит в цену «под ключ».
            </p>
          </div>
        </section>

        <section className="py-12 px-4">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <ThermometerSnowflake className="w-6 h-6 text-primary" />
              Тент на зиму или капитальный навес?
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border rounded-xl overflow-hidden bg-background" data-testid="tent-vs-naves-table">
                <thead>
                  <tr className="bg-secondary text-left">
                    <th className="px-4 py-3 font-semibold">Критерий</th>
                    <th className="px-4 py-3 font-semibold">Тент / плёнка</th>
                    <th className="px-4 py-3 font-semibold">Капитальный навес</th>
                  </tr>
                </thead>
                <tbody>
                  {TENT_VS_NAVES.map((row) => (
                    <tr key={row.criteria} className="border-t">
                      <td className="px-4 py-3 font-medium">{row.criteria}</td>
                      <td className="px-4 py-3 text-muted-foreground">{row.tent}</td>
                      <td className="px-4 py-3">{row.naves}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Тент — решение на один сезон для дачи. Для ежедневной зимней стоянки машины в МО
              нужен каркас с расчётом под снег — иначе первый же мокрый снегопад в ноябре
              обойдётся дороже навеса.
            </p>
          </div>
        </section>

        <section className="py-12 px-4 bg-secondary/30">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-2xl font-bold mb-4">Успеть до заморозков: бетонирование против забивки</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="card-modern p-5">
                <h3 className="font-semibold mb-2">Бетонирование опор — до морозов</h3>
                <p className="text-sm text-muted-foreground">
                  Классика: опора заглубляется на 1–1,2 м и бетонируется. Раствор набирает
                  прочность при плюсовой температуре, поэтому в МО это окно открыто примерно до
                  середины ноября. Самый надёжный вариант для зимних нагрузок.
                </p>
              </div>
              <div className="card-modern p-5">
                <h3 className="font-semibold mb-2">Забивка / ввинчивание — и в мороз</h3>
                <p className="text-sm text-muted-foreground">
                  Если мороз уже ударил, опоры забиваются кувалдой или ввинчиваются — без
                  бетонирования и мокрых процессов. Для навесов с невысоким парусным эффектом это
                  рабочий зимний вариант; обсудите его с замерщиком.
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Заказали сейчас — замер в 1–2 дня, монтаж ещё 1–2 дня: навес встанет до снега.
            </p>
          </div>
        </section>

        <section className="py-12 px-4">
          <div className="container mx-auto max-w-5xl">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Ruler className="w-6 h-6 text-primary" />
              Цены на зимние навесы под ключ
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border rounded-xl overflow-hidden bg-background" data-testid="zima-prices-table">
                <thead>
                  <tr className="bg-secondary text-left">
                    <th className="px-4 py-3 font-semibold">Размер</th>
                    <th className="px-4 py-3 font-semibold">Площадь кровли</th>
                    <th className="px-4 py-3 font-semibold">Машины</th>
                    <th className="px-4 py-3 font-semibold">Цена под ключ</th>
                    <th className="px-4 py-3 font-semibold">Страница с чертежом</th>
                  </tr>
                </thead>
                <tbody>
                  {NAVESY_SIZES.map((size) => (
                    <tr key={size.slug} className="border-t">
                      <td className="px-4 py-3 font-medium whitespace-nowrap">{size.name}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{size.areaM2} м²</td>
                      <td className="px-4 py-3 text-muted-foreground">{size.carsFit}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-primary font-semibold">
                        от {formatRub(size.priceFromRub)}
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/navesy/${size.slug}`} className="text-primary hover:underline">
                          чертёж и расчёт
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Все цены — «под ключ»: каркас с антикоррозийной обработкой, кровля (поликарбонат
              или профлист), бетонирование опор, доставка и монтаж за 1–2 дня. Расчёт под
              снеговую нагрузку входит в стоимость.
            </p>
          </div>
        </section>

        {canopyPortfolio.length > 0 && (
          <section className="py-12 px-4 bg-secondary/30">
            <div className="container mx-auto max-w-4xl">
              <h2 className="text-2xl font-bold mb-6">Наши навесы зимой — фото объектов</h2>
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
            <h2 className="text-2xl font-bold mb-6">Частые вопросы про зимние навесы</h2>
            <FaqAccordion items={ZIMA_FAQ} />
          </div>
        </section>

        <section className="py-12 px-4 bg-secondary/30">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-2xl font-bold mb-4">Сравнить цены на навесы подробнее</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Полная таблица цен за м² по материалам кровли и честное сравнение подрядчиков
              навесов в Московской области — на отдельной странице «Навесы под ключ — цены 2026».
            </p>
            <Link
              href="/navesy/pod-klyuch-ceny"
              className="inline-flex items-center gap-2 text-primary font-semibold hover:underline"
            >
              Навесы под ключ: цены и сравнение
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        <section className="py-16 px-4 bg-primary text-primary-foreground">
          <div className="container mx-auto max-w-3xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Поставьте навес до снега
            </h2>
            <p className="text-xl opacity-90 mb-8">
              Расчёт под снеговую нагрузку МО в калькуляторе за 30 секунд — или позвоните:
              +7 (499) 390-15-95
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
