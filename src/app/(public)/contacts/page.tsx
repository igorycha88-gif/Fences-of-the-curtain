'use client';

import {
  MapPin,
  Phone,
  Mail,
  Clock,
  MessageSquare,
  Building2,
  Landmark,
  FileText,
  FileCheck2,
  Receipt,
  ClipboardCheck,
  Timer,
  Copy,
  Check,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { AnimatedSection } from '@/hooks/useScrollReveal';
import { metrikaEvents } from '@/lib/seo/metrika';
import { trackEvent } from '@/lib/analytics';
import { EVENT_NAMES } from '@/types/analytics';
import { useContactInfo } from '@/components/providers/ContactInfoProvider';
import { LEGAL_REQUISITES } from '@/lib/seo/constants';
import logger from '@/lib/logger';

const B2B_ADVANTAGES = [
  { icon: FileCheck2, text: 'Договор на монтаж забора или навеса' },
  { icon: Receipt, text: 'Счёт и безналичная оплата' },
  { icon: ClipboardCheck, text: 'Закрывающие документы — акты выполненных работ' },
  { icon: Timer, text: 'Подготовка договора и счёта — в течение 1 рабочего дня' },
];

const GENERAL_REQUISITES: { label: string; value: string }[] = [
  { label: 'Полное наименование', value: LEGAL_REQUISITES.fullName },
  { label: 'Краткое наименование', value: LEGAL_REQUISITES.shortName },
  { label: 'Юридический адрес', value: LEGAL_REQUISITES.legalAddress },
  { label: 'Адрес производства', value: LEGAL_REQUISITES.productionAddress },
  { label: 'ИНН', value: LEGAL_REQUISITES.inn },
  { label: 'ОГРНИП', value: LEGAL_REQUISITES.ogrnip },
];

const BANK_REQUISITES: { label: string; value: string }[] = [
  { label: 'Наименование банка', value: LEGAL_REQUISITES.bank.name },
  { label: 'БИК', value: LEGAL_REQUISITES.bank.bik },
  { label: 'Корреспондентский счёт', value: LEGAL_REQUISITES.bank.correspondentAccount },
  { label: 'Расчётный счёт', value: LEGAL_REQUISITES.bank.checkingAccount },
];

const REQUISITES_TEXT = [
  LEGAL_REQUISITES.fullName,
  `Юридический адрес: ${LEGAL_REQUISITES.legalAddress}`,
  `Адрес производства: ${LEGAL_REQUISITES.productionAddress}`,
  `ИНН: ${LEGAL_REQUISITES.inn}`,
  `ОГРНИП: ${LEGAL_REQUISITES.ogrnip}`,
  `Банк: ${LEGAL_REQUISITES.bank.name}`,
  `БИК: ${LEGAL_REQUISITES.bank.bik}`,
  `К/с: ${LEGAL_REQUISITES.bank.correspondentAccount}`,
  `Р/с: ${LEGAL_REQUISITES.bank.checkingAccount}`,
].join('\n');

const MAP_QUERY = 'Московская область, Раменский округ, КП Гжельские узоры';
// Точные координаты производства КП «Гжельские узоры» (предоставлены владельцем):
// lat 55.587673, lon 38.463950
const MAP_LAT = '55.587673';
const MAP_LON = '38.463950';
const MAP_ZOOM = '15';
const MAP_SRC = `https://yandex.ru/map-widget/v1/?ll=${MAP_LON}%2C${MAP_LAT}&pt=${MAP_LON},${MAP_LAT}&z=${MAP_ZOOM}`;

export default function ContactsPage() {
  const contactInfoData = useContactInfo();
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    trackEvent(EVENT_NAMES.CONTACTS_VIEW);
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  const handleCopyRequisites = async () => {
    try {
      await navigator.clipboard.writeText(REQUISITES_TEXT);
      setCopied(true);
      trackEvent('requisites_copy');
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      logger.warn('Не удалось скопировать реквизиты в буфер обмена', {
        module: 'contacts-page',
        operation: 'copy_requisites',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const contactInfo = [
    {
      icon: MapPin,
      title: 'Адрес',
      content: contactInfoData.address || 'Данные не указаны',
      href: null,
    },
    {
      icon: Phone,
      title: 'Телефон',
      content: contactInfoData.phone || 'Данные не указаны',
      href: contactInfoData.phone ? `tel:${contactInfoData.phone.replace(/\D/g, '')}` : null,
    },
    {
      icon: Mail,
      title: 'Email',
      content: contactInfoData.email || 'Данные не указаны',
      href: contactInfoData.email ? `mailto:${contactInfoData.email}` : null,
    },
    {
      icon: Clock,
      title: 'Режим работы',
      content: contactInfoData.workHours?.monFri || contactInfoData.workHours?.sat || contactInfoData.workHours?.sun
        ? `Пн-Пт: ${contactInfoData.workHours.monFri || 'не указано'}\nСб: ${contactInfoData.workHours.sat || 'не указано'}\nВс: ${contactInfoData.workHours.sun || 'не указано'}`
        : 'Данные не указаны',
      href: null,
    },
  ];

  const phoneForLink = contactInfoData.phone
    ? contactInfoData.phone.replace(/\D/g, '')
    : '74993901595';

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
          <div className="max-w-4xl mx-auto">
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
                              onClick={() => {
                                if (item.href!.startsWith('tel:')) { metrikaEvents.phoneClick(); trackEvent(EVENT_NAMES.PHONE_CLICK); }
                                if (item.href!.startsWith('mailto:')) metrikaEvents.emailClick();
                              }}
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

              <AnimatedSection animation="fade-in-right" delay={100}>
                <div className="card-modern p-8 border-primary/20">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-primary" />
                    </div>
                    <h2 className="text-xl font-bold">Работаем с юридическими лицами и ИП</h2>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4 mb-6">
                    {B2B_ADVANTAGES.map((item) => (
                      <div key={item.text} className="flex items-start gap-3 p-4 rounded-xl bg-secondary/50">
                        <item.icon className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <p className="text-sm font-medium">{item.text}</p>
                      </div>
                    ))}
                  </div>

                  <p className="text-muted-foreground text-sm mb-4">
                    Мы — {LEGAL_REQUISITES.shortName}. Заключаем договоры с организациями любого масштаба,
                    выставляем счета и работаем по безналичному расчёту.
                  </p>

                  <a
                    href={`tel:${phoneForLink}`}
                    className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors"
                    onClick={() => { metrikaEvents.phoneClick(); trackEvent(EVENT_NAMES.PHONE_CLICK); }}
                  >
                    <Phone className="w-4 h-4" />
                    Обсудить сотрудничество: {contactInfoData.phone || '+74993901595'}
                  </a>
                </div>
              </AnimatedSection>

              <AnimatedSection animation="fade-in-up" delay={150}>
                <div className="card-modern p-8">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                        <FileText className="w-6 h-6 text-primary" />
                      </div>
                      <h2 className="text-xl font-bold">Реквизиты</h2>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyRequisites}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary text-sm font-medium hover:bg-secondary/70 transition-colors"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 text-primary" />
                          Скопировано
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Скопировать реквизиты
                        </>
                      )}
                    </button>
                  </div>

                  <dl>
                    {GENERAL_REQUISITES.map((item) => (
                      <div key={item.label} className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4 py-3 border-b border-border/50">
                        <dt className="sm:w-72 flex-shrink-0 text-sm text-muted-foreground">{item.label}</dt>
                        <dd className="font-medium break-words">{item.value}</dd>
                      </div>
                    ))}
                  </dl>

                  <div className="flex items-center gap-3 mt-6 mb-2">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                      <Landmark className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-bold">Банковские реквизиты</h3>
                  </div>
                  <dl>
                    {BANK_REQUISITES.map((item) => (
                      <div key={item.label} className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4 py-3 border-b border-border/50 last:border-b-0">
                        <dt className="sm:w-72 flex-shrink-0 text-sm text-muted-foreground">{item.label}</dt>
                        <dd className="font-medium break-words">{item.value}</dd>
                      </div>
                    ))}
                  </dl>

                  <div className="mt-6 text-sm">
                    <Link href="/rekvizity" className="text-primary hover:underline font-medium">
                      Открыть страницу реквизитов →
                    </Link>
                  </div>
                </div>
              </AnimatedSection>

              <AnimatedSection animation="scale-in" delay={200}>
                <div className="card-modern overflow-hidden">
                  <div className="flex items-center gap-3 p-6 pb-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">Мы на карте</h2>
                      <p className="text-sm text-muted-foreground">{MAP_QUERY}</p>
                    </div>
                  </div>
                  <iframe
                    src={MAP_SRC}
                    title="Карта: адрес производства ИП Балов Д.А."
                    className="w-full h-80 border-0"
                    loading="lazy"
                    allowFullScreen
                  />
                  <div className="p-6 pt-4 space-y-1 text-sm text-muted-foreground">
                    <p><span className="font-medium text-foreground">Производство:</span> {LEGAL_REQUISITES.productionAddress}</p>
                    <p><span className="font-medium text-foreground">Юридический адрес:</span> {LEGAL_REQUISITES.legalAddress}</p>
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
                    onClick={() => { metrikaEvents.phoneClick(); trackEvent(EVENT_NAMES.PHONE_CLICK); }}
                  >
                    <Phone className="w-4 h-4" />
                    {contactInfoData.phone || '+74993901595'}
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
