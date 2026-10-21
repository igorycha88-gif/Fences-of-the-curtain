'use client';

import { Phone } from 'lucide-react';
import { metrikaEvents } from '@/lib/seo/metrika';
import { trackEvent } from '@/lib/analytics';
import { EVENT_NAMES } from '@/types/analytics';

export default function PhoneLinkButton() {
  return (
    <a
      href="tel:+74993901595"
      className="inline-flex items-center justify-center gap-2 border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
      onClick={() => { metrikaEvents.phoneClick(); trackEvent(EVENT_NAMES.PHONE_CLICK); }}
    >
      <Phone className="w-4 h-4" />
      Позвонить
    </a>
  );
}
