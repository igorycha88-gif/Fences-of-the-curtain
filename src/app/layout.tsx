import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import SessionProvider from '@/components/providers/SessionProvider';

const inter = Inter({ subsets: ['latin', 'cyrillic'] });

export const metadata: Metadata = {
  title: 'Заборы и Навесы | Установка заборов и навесов',
  description: 'Профессиональная установка заборов и навесов. Онлайн-расчет стоимости, каталог услуг, портфолио работ.',
  keywords: 'заборы, навесы, установка заборов, монтаж навесов, калькулятор забора, калькулятор навеса',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className={inter.className}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
