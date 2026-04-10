'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Phone } from 'lucide-react';
import { metrikaEvents } from '@/lib/seo/metrika';

interface ContactInfoData {
  phone: string;
  hasData: boolean;
}

interface ContactPhoneBadgeProps {
  variant?: 'header' | 'footer' | 'default';
  className?: string;
}

export default function ContactPhoneBadge({ variant = 'default', className = '' }: ContactPhoneBadgeProps) {
  const [contactInfo, setContactInfo] = useState<ContactInfoData | null>(null);

  useEffect(() => {
    const fetchContactInfo = async () => {
      try {
        const response = await fetch('/api/contact-info');
        const data = await response.json();
        if (response.ok && data.hasData && data.phone) {
          setContactInfo({ phone: data.phone, hasData: data.hasData });
        }
      } catch (error) {
        console.error('Error fetching contact info:', error);
      }
    };

    fetchContactInfo();
  }, []);

  if (!contactInfo?.phone) {
    return null;
  }

  const phoneForLink = contactInfo.phone.replace(/\D/g, '');
  const displayPhone = contactInfo.phone;

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
      onClick={() => metrikaEvents.phoneClick()}
    >
      <Phone className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
      <span className="hidden sm:inline">{displayPhone}</span>
      <span className="inline sm:hidden">{displayPhone.replace(/[^+\d]/g, '')}</span>
    </Link>
  );
}
