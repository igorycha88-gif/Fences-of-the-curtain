import { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://zabor-i-naves.ru';

export const metadata: Metadata = {
  title: 'Наши услуги | Установка заборов и навесов под ключ',
  description: 'Полный спектр услуг по ограждению территории: заборы из профнастила, евроштакетник, сетка-рабица, 3D-панели. Навесы для авто, террас, беседок.',
  keywords: 'услуги заборов, установка навесов, монтаж заборов, заборы под ключ, навесы для авто',
  alternates: {
    canonical: '/services',
  },
  openGraph: {
    title: 'Наши услуги | Установка заборов и навесов под ключ',
    description: 'Полный спектр услуг по ограждению территории: заборы из профнастила, евроштакетник, сетка-рабица, 3D-панели. Навесы для авто, террас, беседок.',
    url: `${siteUrl}/services`,
  },
  twitter: {
    title: 'Наши услуги | Установка заборов и навесов под ключ',
    description: 'Полный спектр услуг по ограждению территории: заборы из профнастила, евроштакетник, сетка-рабица, 3D-панели. Навесы для авто, террас, беседок.',
  },
};

export default function ServicesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
