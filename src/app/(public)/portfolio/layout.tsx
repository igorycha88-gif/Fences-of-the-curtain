import { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://zabor-i-naves.ru';

export const metadata: Metadata = {
  title: 'Портфолио | Примеры работ по установке заборов и навесов',
  description: 'Просмотрите портфолио наших работ: фото готовых заборов, навесов и других конструкций. Реальные проекты от наших клиентов.',
  keywords: 'портфолио заборов, портфолио навесов, фото работ, примеры монтажа',
  alternates: {
    canonical: '/portfolio',
  },
  openGraph: {
    title: 'Портфолио | Примеры работ по установке заборов и навесов',
    description: 'Просмотрите портфолио наших работ: фото готовых заборов, навесов и других конструкций. Реальные проекты от наших клиентов.',
    url: `${siteUrl}/portfolio`,
  },
  twitter: {
    title: 'Портфолио | Примеры работ по установке заборов и навесов',
    description: 'Просмотрите портфолио наших работ: фото готовых заборов, навесов и других конструкций. Реальные проекты от наших клиентов.',
  },
};

export default function PortfolioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
