'use client';

import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import type { ContactInfoResponse } from '@/services/contact/contactInfoService';

type ContactInfoData = ContactInfoResponse;

const DEFAULT_CONTACT: ContactInfoData = {
  address: '',
  phone: '+74993901595',
  email: '',
  workHours: { monFri: '', sat: '', sun: '' },
  hasData: false,
};

const ContactInfoContext = createContext<ContactInfoData>(DEFAULT_CONTACT);

export function useContactInfo() {
  return useContext(ContactInfoContext);
}

export default function ContactInfoProvider({
  children,
  initialData,
}: {
  children: ReactNode;
  initialData?: ContactInfoData;
}) {
  const [contactInfo, setContactInfo] = useState<ContactInfoData>(
    () => initialData ?? DEFAULT_CONTACT
  );

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    fetch('/api/contact-info', { signal: controller.signal })
      .then(res => res.json())
      .then(data => {
        clearTimeout(timeoutId);
        if (data.hasData) {
          setContactInfo(data);
        } else {
          setContactInfo(prev => ({
            ...prev,
            phone: data.phone || prev.phone,
            email: data.email || prev.email,
            address: data.address || prev.address,
          }));
        }
      })
      .catch(() => {
        clearTimeout(timeoutId);
      });

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, []);

  return (
    <ContactInfoContext.Provider value={contactInfo}>
      {children}
    </ContactInfoContext.Provider>
  );
}
