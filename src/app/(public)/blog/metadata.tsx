import { Metadata } from 'next';
import { generatePageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = generatePageMetadata({
  title: 'Статьи о заборах и навесах — Полезные советы',
  description: 'Полезные статьи о выборе забора, навеса, материалов. Советы по установке и уходу. Москва и МО.',
  keywords: ['статьи заборы', 'советы навесы', 'как выбрать забор'],
  path: '/blog',
  ogImage: '/og/og-main.jpg',
});
