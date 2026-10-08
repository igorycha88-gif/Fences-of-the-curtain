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
  OTKATNYE_VOROTA_RATE_FROM,
  VOROTA_SIZES,
  VOROTA_S_KALITKOY_PRICE_FROM,
  VOROTA_AUTOMATIKA_PRICE_FROM,
  VOROTA_KOMPLEKTUYUSHCHIE,
  VOROTA_USTANOVKA_STEPS,
  VOROTA_FAQ,
  VOROTA_PLOT_OPTIONS,
} from '@/lib/landing/otkatnyeVorota';
import { DoorOpen, Phone, Ruler, Coins, ListChecks, Wrench, ArrowRight, Zap } from 'lucide-react';

export const revalidate = 86400;

const M = PAGE_METADATA.otkatnyeVorota;

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

export default function OtkatnyeVorotaPage() {
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: 'Главная', url: '/' },
    { name: 'Услуги', url: '/services' },
    { name: 'Откатные ворота под ключ', url: '/otkatnye-vorota' },
  ]);

  const serviceJsonLd = generateServiceJsonLd(
    'Откатные ворота под ключ: изготовление и установка',
    'Откатные ворота под ключ от 32 000 ₽ в Москве и МО: каркас, обшивка, фундамент, фурнитура и монтаж за 1 день. С калиткой — от 52 000 ₽, с автоматикой — от 35 000 ₽. Гарантия 1 год.',
    `от ${formatRub(OTKATNYE_VOROTA_RATE_FROM)} за ворота под ключ`
  );

  const faqJsonLd = generateFaqPageJsonLd(VOROTA_FAQ);

  return (
    <div className="min-h-screen bg-background">
      <JsonLdScript data={[breadcrumbJsonLd, serviceJsonLd, faqJsonLd]} />
      <Header />

      <main className="pt-24">
        <section className="py-16 px-4 relative overflow-hidden">
          <div className="absolute inset-0 gradient-mesh opacity-50" />
          <div className="container mx-auto relative z-10">
            <Breadcrumbs items={[{ label: 'Услуги', href: '/services' }, { label: 'Откатные ворота' }]} />
            <div className="max-w-3xl">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Откатные ворота под ключ — изготовление и установка
              </h1>
              <p className="text-lg text-muted-foreground mb-4">
                Консольные ворота от производства до автоматики: каркас 60×40, консольная балка,
                роликовые опоры, фундамент и монтаж за 1 день. Створка не касается земли —
                снегопады и сугробы не мешают открыванию.
              </p>
              <p className="text-2xl font-bold text-primary mb-6" data-testid="vorota-rate">
                От {formatRub(OTKATNYE_VOROTA_RATE_FROM)} за ворота 3,5 м под ключ
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href="#vorota-lead"
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors"
                >
                  <DoorOpen className="w-5 h-5" />
                  Бесплатный замер ворот
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
          </div>
        </section>

        <section className="py-12 px-4" data-testid="vorota-sizes">
          <div className="container mx-auto max-w-5xl">
            <h2 className="text-3xl font-bold mb-8">Цены на откатные ворота по ширине проёма</h2>
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full text-sm" data-testid="vorota-price-table">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-4 font-semibold">Ширина проёма</th>
                    <th className="text-left p-4 font-semibold">Назначение</th>
                    <th className="text-left p-4 font-semibold">Цена под ключ</th>
                    <th className="text-left p-4 font-semibold">Монтаж</th>
                  </tr>
                </thead>
                <tbody>
                  {VOROTA_SIZES.map((row) => (
                    <tr key={row.width} className="border-t">
                      <td className="p-4 font-medium">{row.width}</td>
                      <td className="p-4 text-muted-foreground">{row.purpose}</td>
                      <td className="p-4 font-bold text-primary" data-testid={`price-${row.width}`}>
                        от {formatRub(row.priceFrom)}
                      </td>
                      <td className="p-4 text-muted-foreground">{row.days}</td>
                    </tr>
                  ))}
                  <tr className="border-t bg-muted/30">
                    <td className="p-4 font-medium">Любая + врезная калитка</td>
                    <td className="p-4 text-muted-foreground">проход без открывания ворот</td>
                    <td className="p-4 font-bold text-primary" data-testid="price-s-kalitkoy">
                      от {formatRub(VOROTA_S_KALITKOY_PRICE_FROM)}
                    </td>
                    <td className="p-4 text-muted-foreground">1–2 дня</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              В цену «под ключ» входит: каркас, обшивка профнастилом, консольная балка с роликовыми
              опорами и улавливателями, фундамент с закладной, монтаж и регулировка.
            </p>
          </div>
        </section>

        <section className="py-12 px-4 bg-muted/30" data-testid="vorota-kalitka">
          <div className="container mx-auto max-w-5xl">
            <h2 className="text-3xl font-bold mb-6">Откатные ворота с калиткой</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="rounded-xl border p-6">
                <h3 className="font-bold text-lg mb-2">Врезная калитка в полотно — от {formatRub(VOROTA_S_KALITKOY_PRICE_FROM)}</h3>
                <p className="text-muted-foreground text-sm">
                  Дверца прямо в створке ворот: выходите во двор, не открывая ворота. Удобно, если
                  места для отдельной калитки нет. Добавляет вес створке — усиливаем каркас.
                </p>
              </div>
              <div className="rounded-xl border p-6">
                <h3 className="font-bold text-lg mb-2">Отдельная калитка рядом — от 11 000 ₽</h3>
                <p className="text-muted-foreground text-sm">
                  Надёжнее и дешевле: не ослабляет каркас, открывается независимо. Выбирают 8 из 10
                  заказчиков в Московской области. Обшиваем в цвет ворот.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 px-4" data-testid="vorota-avtomatika">
          <div className="container mx-auto max-w-5xl">
            <div className="flex items-center gap-3 mb-6">
              <Zap className="w-8 h-8 text-primary" />
              <h2 className="text-3xl font-bold">Автоматика для откатных ворот — от {formatRub(VOROTA_AUTOMATIKA_PRICE_FROM)}</h2>
            </div>
            <p className="text-muted-foreground mb-4">
              Открывание с брелока из машины: электропривод, зубчатая рейка, 2 пульта, фотоэлементы
              безопасности и сигнальная лампа. Работает при −20 °C, при отключении света — от
              аккумулятора. Монтаж и настройка включены.
            </p>
          </div>
        </section>

        <section className="py-12 px-4 bg-muted/30" data-testid="vorota-komplektuyushchie">
          <div className="container mx-auto max-w-5xl">
            <h2 className="text-3xl font-bold mb-8">Комплектующие: что входит в конструкцию</h2>
            <div className="grid gap-4">
              {VOROTA_KOMPLEKTUYUSHCHIE.map((item) => (
                <div key={item.item} className="flex gap-4 rounded-xl border p-5">
                  <ListChecks className="w-6 h-6 text-primary shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold">{item.item}</h3>
                    <p className="text-sm text-muted-foreground">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-12 px-4" data-testid="vorota-ustanovka">
          <div className="container mx-auto max-w-5xl">
            <div className="flex items-center gap-3 mb-8">
              <Wrench className="w-8 h-8 text-primary" />
              <h2 className="text-3xl font-bold">Установка откатных ворот: как мы работаем</h2>
            </div>
            <ol className="space-y-4">
              {VOROTA_USTANOVKA_STEPS.map((step, index) => (
                <li key={step} className="flex gap-4 rounded-xl border p-5">
                  <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0">
                    {index + 1}
                  </span>
                  <p className="text-muted-foreground">{step}</p>
                </li>
              ))}
            </ol>
            <p className="mt-6 text-muted-foreground">
              Хотите собрать ворота сами? Смотрите нашу пошаговую инструкцию{' '}
              <Link href="/blog/otkatnye-vorota-svoimi-rukami" className="text-primary font-medium hover:underline">
                «Откатные ворота своими руками»
              </Link>{' '}
              с чертежами и расчётом противовеса.
            </p>
          </div>
        </section>

        <section className="py-12 px-4 bg-muted/30" data-testid="vorota-calc-cta">
          <div className="container mx-auto max-w-3xl text-center">
            <Ruler className="w-10 h-10 text-primary mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-4">Рассчитайте ворота в калькуляторе</h2>
            <p className="text-muted-foreground mb-6">
              Точная цена с калиткой и автоматикой за 1 минуту — без звонка и ожидания.
            </p>
            <Link
              href="/calculator/gates"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-xl font-semibold hover:bg-primary/90 transition-colors"
            >
              <Coins className="w-5 h-5" />
              Калькулятор ворот
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>

        <section className="py-12 px-4" data-testid="vorota-faq">
          <div className="container mx-auto max-w-3xl">
            <h2 className="text-3xl font-bold mb-8">Частые вопросы про откатные ворота</h2>
            <FaqAccordion items={VOROTA_FAQ} />
          </div>
        </section>

        <section className="py-12 px-4 bg-primary text-primary-foreground" id="vorota-lead">
          <div className="container mx-auto max-w-2xl">
            <h2 className="text-3xl font-bold mb-8 text-center">Заказать откатные ворота</h2>
            <div className="rounded-2xl bg-background text-foreground p-6 md:p-8">
              <LeadForm
                source="otkatnye-vorota"
                plotOptions={VOROTA_PLOT_OPTIONS}
                title="Замер ворот с расчётом противовеса — бесплатно"
                subtitle="Замерщик приедет с образцами обшивки, зафиксирует проём и наклон участка. Смета — в день замера, бесплатно и ни к чему не обязывает."
                selectLabel="Ширина проёма"
              />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
