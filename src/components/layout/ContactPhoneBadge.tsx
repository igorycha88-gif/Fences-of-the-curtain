'use client';

import Link from 'next/link';
import { Phone } from 'lucide-react';
import { metrikaEvents } from '@/lib/seo/metrika';
import { trackEvent } from '@/lib/analytics';
import { EVENT_NAMES } from '@/types/analytics';
import { useContactInfo } from '@/components/providers/ContactInfoProvider';

interface ContactPhoneBadgeProps {
  variant?: 'header' | 'footer' | 'default';
  className?: string;
}

export default function ContactPhoneBadge({ variant = 'default', className = '' }: ContactPhoneBadgeProps) {
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

  const baseStyles = 'flex items-center gap-2 transition-all duration-300';
  
  const variantStyles = {
    header: 'text-sm md:text-base font-medium text-foreground hover:text-primary hover:bg-primary/10 px-3 py-1.5 md:px-4 md:py-2 rounded-lg',
    footer: 'text-foreground hover:text-primary transition-colors',
    default: 'text-foreground hover:text-primary',
  };

  return (
    <Link
      href={`tel:${phoneForLink}`}
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      title="Позвонить нам"
      onClick={() => { metrikaEvents.phoneClick(); trackEvent(EVENT_NAMES.PHONE_CLICK); }}
    >
      <Phone className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
      <span className="hidden sm:inline">{displayPhone}</span>
      <span className="inline sm:hidden">{displayPhone.replace(/[^+\d]/g, '')}</span>
    </Link>
  );
}
