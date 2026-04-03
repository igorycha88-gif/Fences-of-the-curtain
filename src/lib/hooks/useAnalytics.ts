'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { trackEvent, trackPageView } from '@/lib/analytics';

export function useAnalytics() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname) {
      trackPageView(pathname);
    }
  }, [pathname]);

  return {
    trackEvent,
    trackPageView,
  };
}
