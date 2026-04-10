'use client';

import { createContext, useState, useEffect, useContext, ReactNode } from 'react';

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

export default function ContactInfoProvider({ children }: { children: ReactNode }) {
  const [contactInfo, setContactInfo] = useState<ContactInfoData>(DEFAULT_CONTACT);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    fetch('/api/contact-info', { signal: controller.signal })
      .then(res => res.json())
      .then(data => {
        clearTimeout(timeoutId);
        if (data.hasData) setContactInfo(data);
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
