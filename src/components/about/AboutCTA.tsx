'use client';

import Link from 'next/link';
import { Calculator, ArrowRight, Phone } from 'lucide-react';
import { useContactInfo } from '@/components/providers/ContactInfoProvider';
import { metrikaEvents } from '@/lib/seo/metrika';
import { trackEvent } from '@/lib/analytics';
import { EVENT_NAMES } from '@/types/analytics';

export default function AboutCTA() {
  const contactInfo = useContactInfo();
  const phoneForLink = contactInfo.phone
    ? contactInfo.phone.replace(/\D/g, '')
    : '74993901595';

  return (
    <section className="py-16 px-4 bg-primary text-primary-foreground">
      <div className="container mx-auto">
        <div className="max-w-3xl mx-auto text-center">
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
              onClick={() => { metrikaEvents.phoneClick(); trackEvent(EVENT_NAMES.PHONE_CLICK); }}
            >
              <Phone className="w-5 h-5" />
              Позвонить нам
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
