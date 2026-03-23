export const SEO_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || 'https://zabor-i-naves.ru',
  SITE_NAME: 'Заборы и Навесы',
  DEFAULT_TITLE: 'Заборы и Навесы — Онлайн расчёт стоимости',
  DEFAULT_DESCRIPTION: 'Профессиональная установка заборов и навесов. Калькулятор стоимости онлайн. Гарантия качества, быстрый монтаж.',
  DEFAULT_KEYWORDS: ['заборы', 'навесы', 'калькулятор забора', 'установка забора', 'забор из профнастила', 'евроштакетник'],
  DEFAULT_OG_IMAGE: '/og/og-main.svg',
  TWITTER_SITE: '@zabor_navesy',
  LOCALE: 'ru_RU',
} as const;

export const BUSINESS_INFO = {
  name: 'Заборы и Навесы',
  telephone: '+74993901595',
  email: 'zabori-naves@yandex.ru',
  address: {
    locality: 'Раменское',
    region: 'Московская область',
    country: 'Россия',
  },
  openingHours: {
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    opens: '09:00',
    closes: '18:00',
  },
  priceRange: '$$',
} as const;

export const PAGE_METADATA = {
  home: {
    title: 'Заборы и Навесы — Онлайн расчёт стоимости',
    description: 'Профессиональная установка заборов и навесов. Калькулятор стоимости онлайн. Гарантия качества, быстрый монтаж.',
    keywords: ['заборы', 'навесы', 'калькулятор забора', 'установка забора'],
    ogImage: '/og/og-main.svg',
  },
  services: {
    title: 'Услуги — Заборы и Навесы',
    description: 'Установка заборов из профнастила, евроштакетника, сетки-рабицы. Навесы для авто, беседки, террасы.',
    keywords: ['забор из профнастила', 'евроштакетник', 'навес для авто'],
    ogImage: '/og/og-services.svg',
  },
  calculatorFence: {
    title: 'Калькулятор забора — Онлайн расчёт цены',
    description: 'Рассчитайте стоимость забора онлайн за 30 секунд. Профнастил, евроштакетник, 3D-панели.',
    keywords: ['калькулятор забора', 'расчёт забора', 'цена забора'],
    ogImage: '/og/og-calculator.svg',
  },
  calculatorCanopy: {
    title: 'Калькулятор навеса — Онлайн расчёт цены',
    description: 'Рассчитайте стоимость навеса онлайн. Навесы для авто, беседки, террасы из поликарбоната.',
    keywords: ['калькулятор навеса', 'расчёт навеса', 'навес для машины'],
    ogImage: '/og/og-calculator.svg',
  },
  portfolio: {
    title: 'Портфолио — Заборы и Навесы',
    description: 'Примеры наших работ: заборы и навесы. Фотографии выполненных проектов с описанием.',
    keywords: ['портфолио заборы', 'примеры работ', 'фото заборов'],
    ogImage: '/og/og-portfolio.svg',
  },
  contacts: {
    title: 'Контакты — Заборы и Навесы',
    description: 'Свяжитесь с нами для консультации и расчёта стоимости. Телефон, email, адрес.',
    keywords: ['контакты', 'телефон', 'адрес'],
    ogImage: '/og/og-contacts.svg',
  },
} as const;

export const SITEMAP_CONFIG = {
  pages: [
    { path: '/', priority: 1.0, changefreq: 'weekly' as const },
    { path: '/services', priority: 0.8, changefreq: 'monthly' as const },
    { path: '/calculator/fence', priority: 0.9, changefreq: 'weekly' as const },
    { path: '/calculator/canopy', priority: 0.9, changefreq: 'weekly' as const },
    { path: '/portfolio', priority: 0.7, changefreq: 'weekly' as const },
    { path: '/contacts', priority: 0.6, changefreq: 'monthly' as const },
  ],
} as const;
