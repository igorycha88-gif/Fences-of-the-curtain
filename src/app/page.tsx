'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { AnimatedSection } from '@/hooks/useScrollReveal';
import { 
  Zap, 
  Shield, 
  TrendingDown, 
  ArrowRight, 
  Calculator,
  Home,
  Car,
  TreePine,
  Clock,
  Award,
  Users,
  CheckCircle2
} from 'lucide-react';
import { YandexReviews } from '@/components/reviews/YandexReviews';

interface ContactInfoData {
  phone: string;
  email: string;
  hasData: boolean;
}

export default function HomePage() {
  const [contactInfo, setContactInfo] = useState<ContactInfoData | null>(null);

  useEffect(() => {
    fetchContactInfo();
  }, []);

  const fetchContactInfo = async () => {
    try {
      const response = await fetch('/api/contact-info');
      const data = await response.json();
      if (response.ok) {
        setContactInfo(data);
      }
    } catch (error) {
      console.error('Error fetching contact info:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
          <div className="absolute inset-0 gradient-mesh" />
          
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse-soft" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse-soft delay-500" />

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <AnimatedSection animation="fade-in-down" delay={0}>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8">
                  <Zap className="w-4 h-4" />
                  Онлайн расчёт за 30 секунд
                </div>
              </AnimatedSection>

              <AnimatedSection animation="fade-in-up" delay={100}>
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
                  Профессиональные
                  <span className="block text-gradient mt-2">заборы и навесы</span>
                </h1>
              </AnimatedSection>

              <AnimatedSection animation="fade-in-up" delay={200}>
                <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
                  Рассчитайте стоимость онлайн, получите честную цену без скрытых платежей 
                  и закажите установку у проверенных специалистов
                </p>
              </AnimatedSection>

              <AnimatedSection animation="scale-in" delay={300}>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="/calculator/fence"
                    className="btn-primary inline-flex items-center justify-center gap-2 text-lg px-8 py-4"
                  >
                    <Calculator className="w-5 h-5" />
                    Рассчитать забор
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                  <Link
                    href="/calculator/canopy"
                    className="btn-secondary inline-flex items-center justify-center gap-2 text-lg px-8 py-4"
                  >
                    Рассчитать навес
                  </Link>
                </div>
              </AnimatedSection>

              <AnimatedSection animation="fade-in" delay={500}>
                <div className="flex items-center justify-center mt-12 text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                    <span>Гарантия качества</span>
                  </div>
                </div>
              </AnimatedSection>
            </div>
          </div>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-float">
            <div className="w-6 h-10 border-2 border-muted-foreground/30 rounded-full flex items-start justify-center p-2">
              <div className="w-1 h-3 bg-muted-foreground/50 rounded-full animate-pulse" />
            </div>
          </div>
        </section>

        <section className="py-24 px-4 bg-background relative">
          <div className="container mx-auto">
            <AnimatedSection animation="fade-in-up" className="text-center mb-16">
              <h2 className="section-title mb-4">Почему мы?</h2>
              <p className="section-subtitle">
                Мы создаём не просто заборы, а надёжную защиту вашего дома
              </p>
            </AnimatedSection>

            <div className="bento-grid">
              <AnimatedSection 
                animation="fade-in-up" 
                delay={100}
                className="bento-item-large glass card-modern p-8 hover-lift"
              >
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                  <Zap className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Мгновенный расчёт</h3>
                <p className="text-muted-foreground mb-6">
                  Получите точную стоимость за 30 секунд. Наш калькулятор учитывает 
                  все нюансы: тип материала, высоту и дополнительные опции.
                </p>
                <div className="flex items-center gap-2 text-primary font-medium">
                  <Clock className="w-4 h-4" />
                  <span>Экономия до 2 часов</span>
                </div>
              </AnimatedSection>

              <AnimatedSection 
                animation="fade-in-up" 
                delay={200}
                className="glass card-modern p-6 hover-lift"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Гарантия качества</h3>
                <p className="text-muted-foreground text-sm">
                  Профессиональный подход и контроль качества
                </p>
              </AnimatedSection>

              <AnimatedSection 
                animation="fade-in-up" 
                delay={300}
                className="glass card-modern p-6 hover-lift"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                  <TrendingDown className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Честные цены</h3>
                <p className="text-muted-foreground text-sm">
                  Без скрытых платежей и наценок
                </p>
              </AnimatedSection>

              <AnimatedSection 
                animation="fade-in-up" 
                delay={400}
                className="bento-item-wide glass card-modern p-6 hover-lift"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-1">500+ довольных клиентов</h3>
                    <p className="text-muted-foreground text-sm">
                      Средняя оценка 4.9 из 5
                    </p>
                  </div>
                </div>
              </AnimatedSection>
            </div>
          </div>
        </section>

        <section className="py-24 px-4 bg-secondary/30">
          <div className="container mx-auto">
            <AnimatedSection animation="fade-in-up" className="text-center mb-16">
              <h2 className="section-title mb-4">Наши услуги</h2>
              <p className="section-subtitle">
                Полный спектр услуг по ограждению и защите территории
              </p>
            </AnimatedSection>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: Home, title: 'Заборы', desc: 'Профнастил, штакетник, сетка', href: '/services' },
                { icon: Car, title: 'Навесы', desc: 'Для авто, террасы, беседки', href: '/services' },
                { icon: TreePine, title: '3D-панели', desc: 'Современный дизайн', href: '/services' },
                { icon: Award, title: 'Под ключ', desc: 'Замер + монтаж', href: '/services' },
              ].map((service, index) => (
                <AnimatedSection key={index} animation="scale-in" delay={index * 100}>
                  <Link
                    href={service.href}
                    className="card-modern p-6 h-full block hover-lift group"
                  >
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                      <service.icon className="w-6 h-6 text-primary group-hover:text-white transition-colors" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                      {service.title}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {service.desc}
                    </p>
                  </Link>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24 px-4 bg-background">
          <div className="container mx-auto">
            <AnimatedSection animation="fade-in-up" className="text-center mb-16">
              <h2 className="section-title mb-4">Как это работает?</h2>
              <p className="section-subtitle">
                4 простых шага к идеальному забору
              </p>
            </AnimatedSection>

            <div className="grid md:grid-cols-4 gap-8">
              {[
                { step: '01', title: 'Рассчитайте', desc: 'Используйте онлайн калькулятор' },
                { step: '02', title: 'Закажите', desc: 'Оставьте заявку на сайте' },
                { step: '03', title: 'Замер', desc: 'Бесплатный выезд специалиста' },
                { step: '04', title: 'Установка', desc: 'Монтаж в удобное время' },
              ].map((item, index) => (
                <AnimatedSection key={index} animation="fade-in-up" delay={index * 100}>
                  <div className="text-center">
                    <div className="text-6xl font-bold text-primary/10 mb-4">
                      {item.step}
                    </div>
                    <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                    <p className="text-muted-foreground">{item.desc}</p>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        <YandexReviews showReviews={true} maxReviews={3} />

        <section className="py-24 px-4 bg-primary text-primary-foreground">
          <div className="container mx-auto">
            <AnimatedSection animation="scale-in" className="max-w-3xl mx-auto text-center">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Готовы начать?
              </h2>
              <p className="text-xl opacity-90 mb-8">
                Рассчитайте стоимость забора или навеса прямо сейчас — это бесплатно и займёт всего минуту
              </p>
              <Link
                href="/calculator/fence"
                className="inline-flex items-center gap-2 bg-white text-primary px-8 py-4 rounded-xl font-semibold hover:bg-white/90 transition-colors text-lg"
              >
                <Calculator className="w-5 h-5" />
                Рассчитать стоимость
                <ArrowRight className="w-5 h-5" />
              </Link>
            </AnimatedSection>
          </div>
        </section>
      </main>

      <footer className="bg-foreground text-background py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                  <Home className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">Заборы и Навесы</span>
              </div>
              <p className="text-muted-foreground text-sm">
                Профессиональные решения для ограждения территории
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Услуги</h4>
              <ul className="space-y-2 text-muted-foreground text-sm">
                <li><Link href="/services" className="hover:text-primary transition-colors">Заборы</Link></li>
                <li><Link href="/services" className="hover:text-primary transition-colors">Навесы</Link></li>
                <li><Link href="/services" className="hover:text-primary transition-colors">Ворота</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Информация</h4>
              <ul className="space-y-2 text-muted-foreground text-sm">
                <li><Link href="/calculator" className="hover:text-primary transition-colors">Калькулятор</Link></li>
                <li><Link href="/portfolio" className="hover:text-primary transition-colors">Портфолио</Link></li>
                <li><Link href="/contacts" className="hover:text-primary transition-colors">Контакты</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Контакты</h4>
              <ul className="space-y-2 text-muted-foreground text-sm">
                <li>{contactInfo?.phone || 'Данные не указаны'}</li>
                <li>{contactInfo?.email || 'Данные не указаны'}</li>
                <li>Пн-Сб: 9:00 - 18:00</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-muted/20 pt-8 text-center text-muted-foreground text-sm">
            <p>© 2026 Заборы и Навесы. Все права защищены.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
