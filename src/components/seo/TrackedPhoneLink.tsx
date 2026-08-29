'use client';

import { metrikaEvents } from '@/lib/seo/metrika';
import { trackEvent } from '@/lib/analytics';
import { EVENT_NAMES } from '@/types/analytics';

interface TrackedPhoneLinkProps {
  href: string;
  className?: string;
  children: React.ReactNode;
}

export default function TrackedPhoneLink({ href, className, children }: TrackedPhoneLinkProps) {
  return (
    <a
      href={href}
      className={className}
      onClick={() => {
        metrikaEvents.phoneClick();
        trackEvent(EVENT_NAMES.PHONE_CLICK);
      }}
    >
      {children}
    </a>
  );
}
