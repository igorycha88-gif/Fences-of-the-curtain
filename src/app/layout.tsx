import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { headers } from 'next/headers';
import './globals.css';
import SessionProvider from '@/components/providers/SessionProvider';

export const dynamic = 'force-dynamic';

const inter = Inter({ subsets: ['latin', 'cyrillic'] });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://zabor-i-naves.ru';

export const metadata: Metadata = {
  title: 'Заборы и Навесы | Установка заборов и навесов',
  description: 'Профессиональная установка заборов и навесов. Онлайн-расчет стоимости, каталог услуг, портфолио работ.',
  keywords: 'заборы, навесы, установка заборов, монтаж навесов, калькулятор забора, калькулятор навеса',
  icons: {
    icon: '/favicon.svg',
  },
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    url: siteUrl,
    title: 'Заборы и Навесы | Установка заборов и навесов',
    description: 'Профессиональная установка заборов и навесов. Онлайн-расчет стоимости, каталог услуг, портфолио работ.',
    siteName: 'Заборы и Навесы',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Заборы и Навесы | Установка заборов и навесов',
    description: 'Профессиональная установка заборов и навесов. Онлайн-расчет стоимости, каталог услуг, портфолио работ.',
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    yandex: 'b82b0cfe086d3936',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const nonce = headers().get('x-nonce') || '';

  return (
    <html lang="ru">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={inter.className}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
