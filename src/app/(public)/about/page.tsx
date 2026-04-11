'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import { AnimatedSection } from '@/hooks/useScrollReveal';
import {
  Factory,
  Cog,
  Shield,
  BadgePercent,
  ArrowRight,
  Calculator,
  Phone,
  CheckCircle2,
  ImageOff,
} from 'lucide-react';
import { useContactInfo } from '@/components/providers/ContactInfoProvider';

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

interface AboutData {
  about_hero_title: string;
  about_hero_subtitle: string;
  about_hero_image: string;
  about_text: string;
  about_advantages: string;
  about_steps: string;
  about_photos: string;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Factory,
  Cog,
  Shield,
  BadgePercent,
};

export default function AboutPage() {
  const contactInfo = useContactInfo();
  const [data, setData] = useState<AboutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchAbout = async () => {
      try {
        const res = await fetch('/api/about');
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (error) {
        console.error('Error fetching about:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAbout();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-40">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  let advantages: Advantage[] = [];
  let steps: Step[] = [];
  let photos: Photo[] = [];
  try {
    advantages = data?.about_advantages ? JSON.parse(data.about_advantages) : [];
  } catch { /* ignore */ }
  try {
    steps = data?.about_steps ? JSON.parse(data.about_steps) : [];
  } catch { /* ignore */ }
  try {
    photos = data?.about_photos ? JSON.parse(data.about_photos) : [];
  } catch { /* ignore */ }
  const heroImage = data?.about_hero_image || '/images/about/production.jpg';
  const paragraphs = (data?.about_text || '').split('\n').filter(Boolean);

  const handleImageError = (src: string) => {
    setImageErrors((prev) => new Set(prev).add(src));
  };

  const phoneForLink = contactInfo.phone
    ? contactInfo.phone.replace(/\D/g, '')
    : '74993901595';

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24">
        <section className="relative py-20 px-4 overflow-hidden">
          <div className="absolute inset-0 gradient-mesh opacity-50" />
          <div className="container mx-auto relative z-10">
            <Breadcrumbs items={[{ label: 'О нас' }]} />
            <AnimatedSection animation="fade-in-up" className="text-center mb-12">
              <h1 className="section-title mb-4">
                {data?.about_hero_title || 'О компании'}
              </h1>
              <p className="section-subtitle">
                {data?.about_hero_subtitle || ''}
              </p>
            </AnimatedSection>

            <AnimatedSection animation="scale-in" delay={200}>
              <div className="max-w-4xl mx-auto rounded-2xl overflow-hidden shadow-xl border border-border/50">
                <div className="relative aspect-[21/9] bg-secondary/50">
                  {!imageErrors.has(heroImage) ? (
                    <img
                      src={heroImage}
                      alt="О компании"
                      className="w-full h-full object-cover"
                      onError={() => handleImageError(heroImage)}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                      <ImageOff className="w-12 h-12 mb-2" />
                      <span className="text-sm">Фото</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                </div>
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
                      {!imageErrors.has(photo.image) ? (
                        <img
                          src={photo.image}
                          alt={photo.caption}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={() => handleImageError(photo.image)}
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                          <ImageOff className="w-10 h-10 mb-2" />
                          <span className="text-sm">Нет фото</span>
                        </div>
                      )}
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
                <a
                  href={`tel:${phoneForLink}`}
                  className="inline-flex items-center justify-center gap-2 bg-white/20 text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/30 transition-colors border border-white/30"
                >
                  <Phone className="w-5 h-5" />
                  Позвонить нам
                </a>
              </div>
            </AnimatedSection>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
