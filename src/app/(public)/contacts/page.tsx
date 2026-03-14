'use client';

import { useState, useEffect } from 'react';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle2, MessageSquare } from 'lucide-react';
import Header from '@/components/layout/Header';
import { AnimatedSection } from '@/hooks/useScrollReveal';

interface ContactInfoData {
  address: string;
  phone: string;
  email: string;
  workHours: {
    monFri: string;
    sat: string;
    sun: string;
  };
  hasData: boolean;
}

export default function ContactsPage() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    message: '',
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [contactInfoData, setContactInfoData] = useState<ContactInfoData | null>(null);

  useEffect(() => {
    fetchContactInfo();
  }, []);

  const fetchContactInfo = async () => {
    try {
      const response = await fetch('/api/contact-info');
      const data = await response.json();
      if (response.ok) {
        setContactInfoData(data);
      }
    } catch (error) {
      console.error('Error fetching contact info:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSuccess(true);
        setFormData({ name: '', phone: '', email: '', message: '' });
      }
    } catch (error) {
      console.error('Contact form error:', error);
      alert('Ошибка отправки. Попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 11) {
      if (cleaned.length === 0) return '';
      if (cleaned.length <= 1) return `+${cleaned}`;
      if (cleaned.length <= 4) return `+${cleaned.slice(0, 1)} (${cleaned.slice(1)}`;
      if (cleaned.length <= 7) return `+${cleaned.slice(0, 1)} (${cleaned.slice(1, 4)}) ${cleaned.slice(4)}`;
      return `+${cleaned.slice(0, 1)} (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7, 11)}`;
    }
    return value;
  };

  const contactInfo = [
    {
      icon: MapPin,
      title: 'Адрес',
      content: contactInfoData?.address || 'Данные не указаны',
      href: null,
    },
    {
      icon: Phone,
      title: 'Телефон',
      content: contactInfoData?.phone || 'Данные не указаны',
      href: contactInfoData?.phone ? `tel:${contactInfoData.phone.replace(/\D/g, '')}` : null,
    },
    {
      icon: Mail,
      title: 'Email',
      content: contactInfoData?.email || 'Данные не указаны',
      href: contactInfoData?.email ? `mailto:${contactInfoData.email}` : null,
    },
    {
      icon: Clock,
      title: 'Режим работы',
      content: contactInfoData?.workHours
        ? `Пн-Пт: ${contactInfoData.workHours.monFri || 'не указано'}\nСб: ${contactInfoData.workHours.sat || 'не указано'}\nВс: ${contactInfoData.workHours.sun || 'не указано'}`
        : 'Данные не указаны',
      href: null,
    },
  ];

  const phoneForLink = contactInfoData?.phone
    ? contactInfoData.phone.replace(/\D/g, '')
    : '79001234567';

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-16">
        <section className="py-16 px-4 relative overflow-hidden">
          <div className="absolute inset-0 gradient-mesh opacity-50" />
          <div className="container mx-auto relative z-10">
            <AnimatedSection animation="fade-in-up" className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                <MessageSquare className="w-4 h-4" />
                Свяжитесь с нами
              </div>
              <h1 className="section-title mb-4">Контакты</h1>
              <p className="section-subtitle">
                Свяжитесь с нами для получения консультации и расчета стоимости
              </p>
            </AnimatedSection>
          </div>
        </section>

        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            <AnimatedSection animation="fade-in-right">
              <div className="card-modern p-8">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Send className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Отправить заявку</h2>
                    <p className="text-muted-foreground text-sm">Мы ответим в течение часа</p>
                  </div>
                </div>

                {success && (
                  <div className="flex items-center gap-3 bg-primary/10 border border-primary/20 text-primary px-4 py-4 rounded-xl mb-6">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Заявка успешно отправлена! Мы свяжемся с вами в ближайшее время.</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium mb-2">Имя *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input-modern"
                      placeholder="Ваше имя"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Телефон *</label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                      className="input-modern"
                      placeholder="+7 (___) ___-__-__"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="input-modern"
                      placeholder="email@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Сообщение *</label>
                    <textarea
                      required
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="input-modern resize-none"
                      placeholder="Опишите ваш вопрос или задачу"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full btn-primary py-4 flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    {loading ? 'Отправка...' : 'Отправить заявку'}
                  </button>
                </form>
              </div>
            </AnimatedSection>

            <div className="space-y-6">
              <AnimatedSection animation="fade-in-left">
                <div className="card-modern p-8">
                  <h2 className="text-xl font-bold mb-6">Контактная информация</h2>

                  <div className="space-y-4">
                    {contactInfo.map((item, index) => (
                      <div key={index} className="flex items-start gap-4 p-4 rounded-xl hover:bg-secondary/50 transition-colors group">
                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-primary transition-colors">
                          <item.icon className="w-6 h-6 text-primary group-hover:text-white transition-colors" />
                        </div>
                        <div>
                          <h3 className="font-semibold mb-1">{item.title}</h3>
                          {item.href ? (
                            <a
                              href={item.href}
                              className="text-muted-foreground hover:text-primary transition-colors whitespace-pre-line"
                            >
                              {item.content}
                            </a>
                          ) : (
                            <p className="text-muted-foreground whitespace-pre-line">{item.content}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </AnimatedSection>

              <AnimatedSection animation="scale-in" delay={200}>
                <div className="card-modern overflow-hidden h-64">
                  <div className="w-full h-full bg-secondary/50 flex items-center justify-center">
                    <div className="text-center">
                      <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">Карта</p>
                    </div>
                  </div>
                </div>
              </AnimatedSection>

              <AnimatedSection animation="fade-in-up" delay={300}>
                <div className="bg-primary text-primary-foreground p-6 rounded-2xl">
                  <h3 className="font-bold text-lg mb-2">Бесплатная консультация</h3>
                  <p className="opacity-90 text-sm mb-4">
                    Позвоните нам или оставьте заявку — мы поможем подобрать оптимальное решение
                  </p>
                  <a
                    href={`tel:${phoneForLink}`}
                    className="inline-flex items-center gap-2 bg-white text-primary px-6 py-3 rounded-xl font-semibold hover:bg-white/90 transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                    {contactInfoData?.phone || '+7 (900) 123-45-67'}
                  </a>
                </div>
              </AnimatedSection>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
