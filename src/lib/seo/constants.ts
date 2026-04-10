export const SEO_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || 'https://zabor-i-naves.ru',
  SITE_NAME: 'Заборы и Навесы',
  DEFAULT_TITLE: 'Заборы и Навесы — Онлайн расчёт стоимости',
  DEFAULT_DESCRIPTION: 'Профессиональная установка заборов и навесов. Калькулятор стоимости онлайн. Гарантия качества, быстрый монтаж.',
  DEFAULT_KEYWORDS: ['заборы', 'навесы', 'калькулятор забора', 'установка забора', 'забор из профнастила', 'евроштакетник'],
  DEFAULT_OG_IMAGE: '/og/og-main.jpg',
  TWITTER_SITE: '@zabor_navesy',
  LOCALE: 'ru_RU',
} as const;

export const BUSINESS_INFO = {
  name: 'Заборы и Навесы',
  telephone: '+7-499-390-15-95',
  telephoneDisplay: '+7 (499) 390-15-95',
  email: 'zabori-naves@yandex.ru',
  address: {
    locality: 'Москва',
    region: 'Московская область',
    country: 'Россия',
  },
  openingHours: {
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    opens: '09:00',
    closes: '18:00',
  },
  priceRange: '₽₽',
} as const;

export const PAGE_METADATA = {
  home: {
    title: 'Установка заборов и навесов в Москве — Онлайн калькулятор',
    path: '/',
    description: 'Заборы и навесы в Москве и МО. Калькулятор стоимости онлайн. Профнастил, евроштакетник, 3D-панели. Монтаж от 1 дня. Гарантия. Звоните: +7 (499) 390-15-95',
    keywords: ['заборы москва', 'навесы москва', 'калькулятор забора', 'установка забора', 'забор из профнастила'],
    ogImage: '/og/og-main.jpg',
  },
  services: {
    title: 'Установка заборов в Москве и МО — Все виды',
    path: '/services',
    description: 'Заборы из профнастила, евроштакетника, 3D-панелей в Москве. Навесы для авто из поликарбоната. Монтаж под ключ. Бесплатный расчёт стоимости.',
    keywords: ['забор из профнастила москва', 'евроштакетник', 'навес для авто', 'заборы под ключ'],
    ogImage: '/og/og-services.jpg',
  },
  calculator: {
    title: 'Калькулятор забора и навеса — Онлайн расчёт',
    path: '/calculator',
    description: 'Рассчитайте стоимость забора или навеса онлайн за 30 секунд. Профнастил, евроштакетник, 3D-панели, поликарбонат. Москва и МО.',
    keywords: ['калькулятор забора', 'калькулятор навеса', 'расчёт стоимости'],
    ogImage: '/og/og-calculator.jpg',
  },
  calculatorFence: {
    title: 'Калькулятор забора — Рассчитать цену онлайн за 30 сек',
    path: '/calculator/fence',
    description: 'Рассчитайте стоимость забора из профнастила, евроштакетника или 3D-панелей в Москве. Онлайн-калькулятор с точной ценой за метр. Бесплатно.',
    keywords: ['калькулятор забора', 'расчёт забора', 'цена забора москва'],
    ogImage: '/og/og-calculator.jpg',
  },
  calculatorCanopy: {
    title: 'Калькулятор навеса — Рассчитать цену онлайн',
    path: '/calculator/canopy',
    description: 'Рассчитайте стоимость навеса для авто, беседки или террасы в Москве. Онлайн-калькулятор с точной ценой. Поликарбонат, профнастил.',
    keywords: ['калькулятор навеса', 'расчёт навеса', 'навес для машины цена'],
    ogImage: '/og/og-calculator.jpg',
  },
  portfolio: {
    title: 'Портфолио работ — Заборы и навесы в Москве',
    path: '/portfolio',
    description: 'Примеры выполненных работ: заборы и навесы в Москве и МО. Фотографии проектов, цены, описания материалов.',
    keywords: ['портфолио заборы москва', 'примеры работ', 'фото заборов'],
    ogImage: '/og/og-portfolio.jpg',
  },
  contacts: {
    title: 'Контакты — Заборы и Навесы',
    path: '/contacts',
    description: 'Москва. Телефон: +7 (499) 390-15-95. Email: zabori-naves@yandex.ru. Пн-Сб 9:00-18:00. Бесплатная консультация и выезд замерщика.',
    keywords: ['контакты заборы навесы', 'телефон', 'адрес москва'],
    ogImage: '/og/og-contacts.jpg',
  },
  faq: {
    title: 'Часто задаваемые вопросы — Заборы и Навесы',
    path: '/faq',
    description: 'Ответы на популярные вопросы о заборах и навесах. Стоимость, сроки монтажа, материалы, гарантии. Москва и МО.',
    keywords: ['faq заборы', 'вопросы заборы навесы', 'стоимость установки'],
    ogImage: '/og/og-main.jpg',
  },
} as const;

export const SITEMAP_CONFIG = {
  pages: [
    { path: '/', priority: 1.0, changefreq: 'weekly' as const },
    { path: '/services', priority: 0.8, changefreq: 'monthly' as const },
    { path: '/calculator', priority: 0.8, changefreq: 'monthly' as const },
    { path: '/calculator/fence', priority: 0.9, changefreq: 'weekly' as const },
    { path: '/calculator/canopy', priority: 0.9, changefreq: 'weekly' as const },
    { path: '/portfolio', priority: 0.7, changefreq: 'weekly' as const },
    { path: '/contacts', priority: 0.6, changefreq: 'monthly' as const },
    { path: '/faq', priority: 0.5, changefreq: 'monthly' as const },
  ],
} as const;
