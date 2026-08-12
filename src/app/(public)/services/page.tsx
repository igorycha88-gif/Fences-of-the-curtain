import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import Header from '@/components/layout/Header';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import { AnimatedSection } from '@/hooks/useScrollReveal';
import {
  Calculator,
  Shield,
  Clock,
  Award,
  ArrowRight,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import HomeFooter from '@/components/layout/HomeFooter';
import CommercialFactors from '@/components/seo/CommercialFactors';

const fenceServices = [
  {
    title: 'Забор из профнастила',
    slug: 'zabor-iz-profnastila',
    description: 'Практичное и надежное решение. Широкий выбор цветов и покрытий. Устойчив к коррозии и механическим повреждениям.',
    features: ['Быстрый монтаж', 'Шумоизоляция', 'Долговечность'],
  },
  {
    title: 'Евроштакетник',
    slug: 'zabor-iz-evroshtaketnika',
    description: 'Стильный и современный забор с эстетичным внешним видом. Возможность выбора расстояния между штакетинами.',
    features: ['Вентиляция', 'Эстетика', 'Проветривание'],
  },
  {
    title: 'Сетка-рабица',
    slug: 'zabor-iz-setki-rabitsy',
    description: 'Экономичный вариант ограждения. Пропускает свет, хорошо просматривается, не затеняет участок.',
    features: ['Экономичность', 'Простота', 'Лёгкость'],
  },
  {
    title: '3D-панели',
    slug: 'zabor-iz-3d-panelej',
    description: 'Современный дизайн и высокая прочность. Идеальное решение для частных домов и коммерческих объектов.',
    features: ['Прочность', 'Дизайн', 'Надёжность'],
  },
];

const canopyServices = [
  {
    title: 'Навес под автомобиль',
    slug: 'naves-pod-mashinu',
    description: 'Защита автомобиля от солнца, дождя и снега. Различные конструкции: односкатные, двускатные и арочные.',
    features: ['Защита авто', 'Любой размер', 'Прочность'],
  },
  {
    title: 'Навес из поликарбоната',
    slug: 'naves-iz-polikarbonata',
    description: 'Лёгкая и прочная конструкция для защиты от осадков и солнца. Подходит для авто, террас и беседок.',
    features: ['Светопропускаемость', 'Долговечность', 'Стиль'],
  },
  {
    title: 'Навес-терраса',
    slug: 'naves-iz-polikarbonata',
    description: 'Расширение жилого пространства. Отличное решение для летних вечеров и семейных обедов.',
    features: ['Пространство', 'Стиль', 'Функциональность'],
  },
];

const advantages = [
  { icon: 'Calculator', title: 'Точный расчёт', description: 'Онлайн-калькулятор за несколько секунд' },
  { icon: 'Shield', title: 'Гарантия качества', description: 'На все выполненные работы' },
  { icon: 'Clock', title: 'Быстрый монтаж', description: 'Установка в кратчайшие сроки' },
  { icon: 'Award', title: 'Опыт работы', description: 'Большой опыт на рынке' },
];

export const revalidate = 3600;

export default async function ServicesPage() {
  let servicePages: { slug: string }[] = [];
  try {
    servicePages = await prisma.pageContent.findMany({
      where: { isActive: true, category: { not: null } },
      select: { slug: true },
    });
  } catch {}

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24">
        <section className="py-16 px-4 relative overflow-hidden">
          <div className="absolute inset-0 gradient-mesh opacity-50" />
          <div className="container mx-auto relative z-10">
            <Breadcrumbs items={[{ label: 'Услуги' }]} />
            <AnimatedSection animation="fade-in-up" className="text-center mb-16">
              <h1 className="section-title mb-4">Наши услуги</h1>
              <p className="section-subtitle">
                Профессиональные решения для ограждения территории и защиты от солнца и осадков
              </p>
            </AnimatedSection>
          </div>
        </section>

        <CommercialFactors />

        <section className="py-16 px-4">
          <div className="container mx-auto">
            <AnimatedSection animation="fade-in-up" className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-3xl font-bold">Заборы</h2>
              </div>
              <p className="text-muted-foreground max-w-2xl">
                Надёжные ограждения для вашего участка с гарантией качества
              </p>
            </AnimatedSection>

            <div className="grid md:grid-cols-2 gap-6 mb-20">
              {fenceServices.map((service, index) => (
                <AnimatedSection key={index} animation="fade-in-up" delay={index * 100}>
                  <div className="card-modern p-6 h-full hover-lift group">
                    <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                      <Link href={`/services/${service.slug}`}>{service.title}</Link>
                    </h3>
                    <p className="text-muted-foreground mb-4">{service.description}</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {service.features.map((feature, i) => (
                        <span key={i} className="text-xs bg-secondary px-3 py-1 rounded-full">
                          {feature}
                        </span>
                      ))}
                    </div>
                    <div className="pt-4 border-t border-border/50 flex gap-3">
                      <Link
                        href="/calculator/fence"
                        className="btn-primary text-sm px-4 py-2 inline-flex items-center gap-2"
                      >
                        <Calculator className="w-4 h-4" />
                        Рассчитать стоимость
                      </Link>
                      <Link
                        href={`/services/${service.slug}`}
                        className="text-sm px-4 py-2 inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                      >
                        Подробнее
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </AnimatedSection>
              ))}
            </div>

            <AnimatedSection animation="fade-in-up" className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-3xl font-bold">Навесы</h2>
              </div>
              <p className="text-muted-foreground max-w-2xl">
                Защита от солнца и осадков для вашего комфорта
              </p>
            </AnimatedSection>

            <div className="grid md:grid-cols-2 gap-6 mb-20">
              {canopyServices.map((service, index) => (
                <AnimatedSection key={index} animation="fade-in-up" delay={index * 100}>
                  <div className="card-modern p-6 h-full hover-lift group">
                    <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                      <Link href={`/services/${service.slug}`}>{service.title}</Link>
                    </h3>
                    <p className="text-muted-foreground mb-4">{service.description}</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {service.features.map((feature, i) => (
                        <span key={i} className="text-xs bg-secondary px-3 py-1 rounded-full">
                          {feature}
                        </span>
                      ))}
                    </div>
                    <div className="pt-4 border-t border-border/50 flex gap-3">
                      <Link
                        href="/calculator/canopy"
                        className="btn-primary text-sm px-4 py-2 inline-flex items-center gap-2"
                      >
                        <Calculator className="w-4 h-4" />
                        Рассчитать стоимость
                      </Link>
                      <Link
                        href={`/services/${service.slug}`}
                        className="text-sm px-4 py-2 inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                      >
                        Подробнее
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 px-4 bg-secondary/30">
          <div className="container mx-auto">
            <AnimatedSection animation="fade-in-up" className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Почему выбирают нас</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Мы создаём не просто заборы, а надёжную защиту вашего дома
              </p>
            </AnimatedSection>

            <div className="grid md:grid-cols-4 gap-6">
              {advantages.map((adv, index) => (
                <AnimatedSection key={index} animation="scale-in" delay={index * 100}>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 hover:bg-primary group transition-colors">
                      {adv.icon === 'Calculator' && <Calculator className="w-8 h-8 text-primary group-hover:text-white transition-colors" />}
                      {adv.icon === 'Shield' && <Shield className="w-8 h-8 text-primary group-hover:text-white transition-colors" />}
                      {adv.icon === 'Clock' && <Clock className="w-8 h-8 text-primary group-hover:text-white transition-colors" />}
                      {adv.icon === 'Award' && <Award className="w-8 h-8 text-primary group-hover:text-white transition-colors" />}
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{adv.title}</h3>
                    <p className="text-muted-foreground text-sm">{adv.description}</p>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 px-4 bg-primary text-primary-foreground">
          <div className="container mx-auto">
            <AnimatedSection animation="scale-in" className="max-w-3xl mx-auto text-center">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Готовы начать?
              </h2>
              <p className="text-xl opacity-90 mb-8">
                Рассчитайте стоимость прямо сейчас — это бесплатно и займёт всего минуту
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/calculator/fence"
                  className="inline-flex items-center justify-center gap-2 bg-white text-primary px-8 py-4 rounded-xl font-semibold hover:bg-white/90 transition-colors"
                >
                  <Calculator className="w-5 h-5" />
                  Рассчитать забор
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/calculator/canopy"
                  className="inline-flex items-center justify-center gap-2 bg-white/20 text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/30 transition-colors border border-white/30"
                >
                  Рассчитать навес
                </Link>
              </div>
            </AnimatedSection>
          </div>
        </section>

        <section className="py-16 px-4">
          <div className="container mx-auto">
            <AnimatedSection animation="fade-in-up" className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Что вы получаете</h2>
            </AnimatedSection>

            <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
              {[
                'Замер и консультацию',
                'Гарантию на все работы',
                'Честную цену без скрытых платежей',
                'Качественные материалы',
                'Опытных мастеров',
                'Соблюдение сроков',
              ].map((item, index) => (
                <AnimatedSection key={index} animation="fade-in" delay={index * 50}>
                  <div className="flex items-center gap-3 p-4 bg-secondary/50 rounded-xl">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="font-medium">{item}</span>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>
      </main>

      <HomeFooter />
    </div>
  );
}
