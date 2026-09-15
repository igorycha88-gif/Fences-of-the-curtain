'use client';

import { Phone } from 'lucide-react';
import { metrikaEvents } from '@/lib/seo/metrika';
import { trackEvent } from '@/lib/analytics';
import { EVENT_NAMES } from '@/types/analytics';
import { useContactInfo } from '@/components/providers/ContactInfoProvider';

interface HeroCallButtonProps {
  className?: string;
}

export default function HeroCallButton({ className = '' }: HeroCallButtonProps) {
  const contactInfo = useContactInfo();

  if (!contactInfo.phone) {
    return null;
  }

  const phoneForLink = contactInfo.phone.replace(/\D/g, '');
  const formatPhone = (raw: string) => {
    const digits = raw.replace(/\D/g, '');
    if (digits.length === 11 && digits.startsWith('7')) {
      return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9, 11)}`;
    }
    return raw;
  };
  const displayPhone = formatPhone(contactInfo.phone);

  return (
    <a
      href={`tel:${phoneForLink}`}
      title="Позвонить нам"
      aria-label={`Позвонить ${displayPhone}`}
      onClick={() => { metrikaEvents.phoneClick(); trackEvent(EVENT_NAMES.PHONE_CLICK); }}
      className={`md:hidden inline-flex items-center justify-center gap-2 text-lg px-10 py-4 rounded-xl bg-white/60 backdrop-blur-sm border border-primary/20 text-foreground font-medium hover:bg-primary hover:text-white hover:border-primary hover:shadow-lg hover:shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 ${className}`}
    >
      <Phone className="w-5 h-5 flex-shrink-0" />
      <span>Позвонить</span>
      <span className="font-normal opacity-90">{displayPhone}</span>
    </a>
  );
}
