import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import JsonLdScript from '@/components/seo/JsonLdScript';
import { generateBreadcrumbJsonLd } from '@/lib/seo/jsonld';
import { AnimatedSection } from '@/hooks/useScrollReveal';
import ImageWithFallback from '@/components/ui/ImageWithFallback';
import AboutCTA from '@/components/about/AboutCTA';
import {
  Factory,
  Cog,
  Shield,
  BadgePercent,
  CheckCircle2,
  Award,
  Users,
  Home,
  CalendarClock,
} from 'lucide-react';

interface Advantage {
  icon: string;
  title: string;
  description: string;
}

interface Step {
  number: number;
  title: string;
  description: string;
}

interface Photo {
  image: string;
  caption: string;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Factory,
  Cog,
  Shield,
  BadgePercent,
};

const ABOUT_KEYS = [
  'about_hero_title',
  'about_hero_subtitle',
  'about_hero_image',
  'about_text',
  'about_advantages',
  'about_steps',
  'about_photos',
] as const;

const DEFAULT_VALUES: Record<string, string> = {
  about_hero_title: 'О компании',
  about_hero_subtitle: 'Полный цикл производства и монтажа заборов и навесов — от сырья до готового объекта',
  about_hero_image: '/images/about/production.jpg',
  about_text: 'Компания «Заборы и Навесы» — это команда профессионалов, которая выполняет полный цикл работ по производству и установке заборов, навесов и ограждений. Мы контролируем каждый этап: от закупки сертифицированных материалов до финального монтажа на объекте.\n\nСобственное производство позволяет нам гарантировать качество и предлагать честные цены без посредников. Каждый проект — это индивидуальный подход, точный расчёт и соблюдение сроков.',
  about_advantages: JSON.stringify([
    { icon: 'Factory', title: 'Собственное производство', description: 'Контроль качества на каждом этапе' },
    { icon: 'Cog', title: 'Полный цикл работ', description: 'От замера до сдачи объекта' },
    { icon: 'Shield', title: 'Гарантия на работы', description: 'На все выполненные работы' },
    { icon: 'BadgePercent', title: 'Честные цены', description: 'Без скрытых платежей и наценок посредников' },
  ]),
  about_steps: JSON.stringify([
    { number: 1, title: 'Замер и консультация', description: 'Бесплатный выезд специалиста, обсуждение задачи' },
    { number: 2, title: 'Расчёт стоимости', description: 'Точный расчёт материалов и работ' },
    { number: 3, title: 'Производство', description: 'Изготовление конструкций на собственном производстве' },
    { number: 4, title: 'Доставка и монтаж', description: 'Профессиональная установка в оговорённые сроки' },
    { number: 5, title: 'Сдача объекта', description: 'Приёмка работ и подписание акта' },
  ]),
  about_photos: JSON.stringify([
    { image: '/images/about/production.jpg', caption: 'Наше производство' },
    { image: '/images/about/mounting.jpg', caption: 'Монтаж на объекте' },
    { image: '/images/about/workshop.jpg', caption: 'Производственный цех' },
    { image: '/images/about/materials.jpg', caption: 'Сертифицированные материалы' },
    { image: '/images/about/team.jpg', caption: 'Наша команда' },
  ]),
};

export const revalidate = 300;

async function getAboutData() {
  try {
    const settings = await prisma.setting.findMany({
      where: { key: { in: [...ABOUT_KEYS] } },
    });

    const result: Record<string, string> = {};
    for (const key of ABOUT_KEYS) {
      const setting = settings.find((s) => s.key === key);
      result[key] = setting?.value ?? DEFAULT_VALUES[key] ?? '';
    }
    return result;
  } catch {
    return DEFAULT_VALUES;
  }
}

export default async function AboutPage() {
  const data = await getAboutData();

  let advantages: Advantage[] = [];
  let steps: Step[] = [];
  let photos: Photo[] = [];
  try {
    advantages = data.about_advantages ? JSON.parse(data.about_advantages) : [];
  } catch { /* ignore */ }
  try {
    steps = data.about_steps ? JSON.parse(data.about_steps) : [];
  } catch { /* ignore */ }
  try {
    photos = data.about_photos ? JSON.parse(data.about_photos) : [];
  } catch { /* ignore */ }

  const heroImage = data.about_hero_image || '/images/about/production.jpg';
  const paragraphs = (data.about_text || '').split('\n').filter(Boolean);

  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: 'Главная', url: '/' },
    { name: 'О компании', url: '/about' },
  ]);

  const stats = [
    { icon: Home, value: '500+', label: 'Установленных объектов' },
    { icon: CalendarClock, value: '8 лет', label: 'На рынке заборов и навесов' },
    { icon: Users, value: '15+', label: 'Опытных монтажников' },
    { icon: Award, value: '4.9★', label: 'Средняя оценка клиентов' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <JsonLdScript data={[breadcrumbJsonLd]} />
      <Header />

      <main className="pt-24">
        <section className="relative py-20 px-4 overflow-hidden">
          <div className="absolute inset-0 gradient-mesh opacity-50" />
          <div className="container mx-auto relative z-10">
            <Breadcrumbs items={[{ label: 'О нас' }]} />
            <AnimatedSection animation="fade-in-up" className="text-center mb-12">
              <h1 className="section-title mb-4">
                {data.about_hero_title || 'О компании'}
              </h1>
              <p className="section-subtitle">
                {data.about_hero_subtitle || ''}
              </p>
            </AnimatedSection>

            <AnimatedSection animation="scale-in" delay={200}>
              <div className="max-w-4xl mx-auto rounded-2xl overflow-hidden shadow-xl border border-border/50">
                <div className="relative aspect-[21/9] bg-secondary/50">
                  <ImageWithFallback
                    src={heroImage}
                    alt="О компании"
                    fill
                    className="object-cover"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                </div>
              </div>
            </AnimatedSection>
          </div>
        </section>

        <section className="py-12 px-4 bg-primary text-primary-foreground">
          <div className="container mx-auto">
            <AnimatedSection animation="fade-in-up">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <stat.icon className="w-6 h-6" />
                    </div>
                    <p className="text-3xl font-bold">{stat.value}</p>
                    <p className="text-sm opacity-80 mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>
            </AnimatedSection>
          </div>
        </section>

        <section className="py-16 px-4">
          <div className="container mx-auto">
            <div className="max-w-3xl mx-auto">
              <AnimatedSection animation="fade-in-up">
                <div className="prose prose-lg max-w-none">
                  {paragraphs.map((p, i) => (
                    <p key={i} className="text-muted-foreground text-lg leading-relaxed mb-4">
                      {p}
                    </p>
                  ))}
                </div>
              </AnimatedSection>
            </div>
          </div>
        </section>

        <section className="py-16 px-4 bg-secondary/30">
          <div className="container mx-auto">
            <AnimatedSection animation="fade-in-up" className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Наши преимущества</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Почему клиенты доверяют нам свои проекты
              </p>
            </AnimatedSection>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {advantages.map((adv, index) => {
                const IconComponent = ICON_MAP[adv.icon] || Factory;
                return (
                  <AnimatedSection key={index} animation="scale-in" delay={index * 100}>
                    <div className="card-modern p-6 text-center h-full hover-lift">
                      <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group hover:bg-primary transition-colors">
                        <IconComponent className="w-7 h-7 text-primary group-hover:text-white transition-colors" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">{adv.title}</h3>
                      <p className="text-muted-foreground text-sm">{adv.description}</p>
                    </div>
                  </AnimatedSection>
                );
              })}
            </div>
          </div>
        </section>

        <section className="py-16 px-4">
          <div className="container mx-auto">
            <AnimatedSection animation="fade-in-up" className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Как мы работаем</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Полный цикл от первого звонка до сдачи объекта
              </p>
            </AnimatedSection>

            <div className="max-w-3xl mx-auto space-y-0">
              {steps.map((step, index) => (
                <AnimatedSection key={index} animation="fade-in-left" delay={index * 100}>
                  <div className="flex gap-6 pb-8 relative">
                    {index < steps.length - 1 && (
                      <div className="absolute left-[23px] top-12 bottom-0 w-0.5 bg-primary/20" />
                    )}
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-primary/25">
                        {step.number}
                      </div>
                    </div>
                    <div className="pt-2">
                      <h3 className="text-lg font-semibold mb-1">{step.title}</h3>
                      <p className="text-muted-foreground">{step.description}</p>
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
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Фотогалерея</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Посмотрите наше производство, материалы и результаты работы
              </p>
            </AnimatedSection>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {photos.map((photo, index) => (
                <AnimatedSection
                  key={index}
                  animation="scale-in"
                  delay={index * 100}
                  className={index === 0 ? 'md:col-span-2 lg:col-span-2' : ''}
                >
                  <div className="card-modern overflow-hidden hover-lift group">
                    <div className="relative aspect-[16/10] bg-secondary/50">
                      <ImageWithFallback
                        src={photo.image}
                        alt={photo.caption}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                    <div className="p-4">
                      <p className="font-medium text-center text-sm">{photo.caption}</p>
                    </div>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 px-4">
          <div className="container mx-auto">
            <AnimatedSection animation="fade-in-up" className="max-w-2xl mx-auto">
              <div className="text-center mb-10">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Наши гарантии</h2>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  'Сертифицированные материалы',
                  'Соблюдение сроков',
                  'Гарантию на все работы',
                  'Честную цену без скрытых платежей',
                  'Опытных мастеров',
                  'Бесплатный замер и консультацию',
                ].map((item, index) => (
                  <AnimatedSection key={index} animation="fade-in" delay={index * 50}>
                    <div className="flex items-center gap-3 p-4 bg-secondary/50 rounded-xl">
                      <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                      <span className="font-medium">{item}</span>
                    </div>
                  </AnimatedSection>
                ))}
              </div>
            </AnimatedSection>
          </div>
        </section>

        <AboutCTA />
      </main>

      <Footer />
    </div>
  );
}
