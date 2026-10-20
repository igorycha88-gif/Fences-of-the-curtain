import { GeoCity, GeoHub, DIRECTION_LABELS, getNeighbourCities } from './cities';
import { BUSINESS_INFO } from '../seo/constants';

export interface FaqItem {
  question: string;
  answer: string;
}

/**
 * Детерминированный индекс варианта по slug (ISR-safe: без Math.random()).
 * Один и тот же город всегда получает один и тот же вариант текста.
 */
function cityVariantIndex(slug: string, variantCount: number): number {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = (hash * 31 + slug.charCodeAt(i)) >>> 0;
  }
  return hash % variantCount;
}

/** Первое шоссе из строки вида «Горьковское шоссе / шоссе Энтузиастов» */
function firstHighway(highway: string): string {
  return highway.split(' / ')[0];
}

/** Условия доставки по удалённости города от МКАД */
function deliveryByDistance(distanceKm: number): { price: string; note: string } {
  if (distanceKm <= 15) {
    return {
      price: 'включена',
      note: `ближняя зона: ${distanceKm} км от МКАД`,
    };
  }
  if (distanceKm <= 40) {
    return {
      price: 'от 1 500 ₽',
      note: `${distanceKm} км от МКАД; при заказе от 20 м — бесплатно`,
    };
  }
  return {
    price: 'от 3 000 ₽',
    note: `${distanceKm} км от МКАД; точную сумму назовёт замерщик`,
  };
}

export function generateCityFaq(city: GeoCity): FaqItem[] {
  // Вариативные формулировки (SEO-фикс по книгам: снижение схожести гео-страниц)
  const priceVariant = cityVariantIndex(city.slug, 2);
  const base: FaqItem[] = [
    priceVariant === 0
      ? {
          question: `Сколько стоит забор из профнастила ${city.nameIn} за метр под ключ?`,
          answer:
            'Забор из профнастила С8 высотой 2 метра «под ключ» (материал, столбы с бетонированием, лаги, монтаж) — от 2 600 ₽ за погонный метр. Точная цена зависит от высоты, толщины металла, количества ворот и калиток — рассчитайте её в калькуляторе забора за 30 секунд.',
        }
      : {
          question: `Какая цена забора под ключ ${city.nameIn} за погонный метр?`,
          answer: `Профнастил С8 (h=2 м) со столбами, лагами и монтажом — от 2 600 ₽ за погонный метр. Считаем для всех районов${city.districts[0] ? `, включая ${city.districts[0]}` : ''}; точную смету под ваш участок покажет калькулятор за 30 секунд.`,
        },
    {
      question: `Выезжаете ли вы в посёлки и СНТ вокруг ${city.nameIn.replace(/^в /, '')}?`,
      answer: `Да, мы работаем по всему городу и окрестным посёлкам: ${city.districts.slice(0, 5).join(', ')} и другим населённым пунктам района. Замер при заказе — бесплатно.`,
    },
    city.isDacha
      ? {
          question: `За сколько дней установите дачный забор для СНТ-участка ${city.nameIn}?`,
          answer: `Монтаж забора для дачного или СНТ-участка — от 1 дня (до 50 погонных метров). ${city.driveTime} — дорога бригады до массива (${city.distanceKm} км от МКАД). График фиксируем после бесплатного замера.`,
        }
      : {
          question: `За сколько дней установите забор ${city.nameIn}?`,
          answer: `Стандартный монтаж забора занимает от 1 дня (до 50 погонных метров). ${city.driveTime} — дорога бригады до объекта (${city.distanceKm} км от МКАД по трассе «${firstHighway(city.highway)}»). Точный график фиксируем после бесплатного замера.`,
        },
    {
      question: 'Работаете ли вы зимой?',
      answer:
        'Да, монтируем круглый год. Зимой действуют сезонные скидки на заборы и навесы, а сроки монтажа даже короче из-за меньшей загруженности. Бетонирование выполняется с противоморозными добавками по технологии.',
    },
    cityVariantIndex(`${city.slug}-naves`, 2) === 0
      ? {
          question: `Сколько стоит навес для автомобиля ${city.nameIn}?`,
          answer:
            'Стоимость навеса зависит от размеров, типа конструкции (односкатный, двускатный, арочный) и материала покрытия — поликарбонат или профлист. Рассчитайте точную цену под ваше авто в калькуляторе навеса: с монтажом, крепежом и доставкой.',
        }
      : {
          question: `Сколько стоит навес на машину ${city.nameIn} и сколько ждать монтаж?`,
          answer:
            'Цена зависит от площади и материала: типовая конструкция на одну машину из поликарбоната считается в калькуляторе навеса за минуту. Монтаж после замера — 1–2 дня, включая бетонирование опор и уборку после работ.',
        },
  ];

  const extra: FaqItem[] = city.faqExtra.map((item) => ({
    question: item.q,
    answer: item.a,
  }));

  return [...base, ...extra];
}

export interface PriceRow {
  material: string;
  price: string;
  note: string;
}

export function generateCityPriceTable(city: GeoCity): PriceRow[] {
  const delivery = deliveryByDistance(city.distanceKm);
  return [
    {
      material: 'Забор из профнастила С8 (h=2 м)',
      price: 'от 2 600 ₽/м',
      note: 'под ключ: столбы, лаги, монтаж',
    },
    {
      material: 'Забор из евроштакетника',
      price: 'по расчёту',
      note: city.isDacha
        ? `для дачных участков ${city.nameIn.replace(/^в /, '')}: односторонний и «шахматка»`
        : `для городских участков и коттеджных посёлков ${city.nameIn.replace(/^в /, '')}: односторонний и «шахматка»`,
    },
    {
      material: 'Забор из 3D-панелей',
      price: 'по расчёту',
      note: 'современный вид, быстро монтируется',
    },
    {
      material: 'Забор из сетки-рабицы',
      price: 'по расчёту',
      note: 'экономично для межи и дачных участков',
    },
    {
      material: 'Навес для автомобиля',
      price: 'по расчёту',
      note: 'поликарбонат или профлист, расчёт в калькуляторе навеса',
    },
    {
      material: 'Доставка материалов',
      price: delivery.price,
      note: delivery.note,
    },
    {
      material: 'Замер и консультация',
      price: 'бесплатно',
      note: 'при заказе услуги, выезд в удобное время',
    },
  ];
}

const CITY_TITLE_TAILS = [
  ' — от 2 600 ₽/м под ключ',
  ' — монтаж от 1 дня, замер бесплатно',
  ' — цена метра под ключ, гарантия',
] as const;

export function generateCityTitle(city: GeoCity): string {
  const tail = CITY_TITLE_TAILS[cityVariantIndex(city.slug, CITY_TITLE_TAILS.length)];
  return `Заборы и навесы ${city.nameIn}${tail}`;
}

export function generateCityDescription(city: GeoCity): string {
  const variant = cityVariantIndex(`${city.slug}-desc`, 3);
  if (variant === 1) {
    return `Заборы и навесы для авто ${city.nameIn} (${firstHighway(city.highway)}): профнастил, евроштакетник. Замер бесплатно, монтаж от 1 дня. Тел: ${BUSINESS_INFO.telephoneDisplay}`;
  }
  if (variant === 2) {
    return `Установка заборов и навесов ${city.nameIn} — ${city.driveTime}. Цена от 2 600 ₽/м под ключ, монтаж от 1 дня, гарантия 1 год. Тел: ${BUSINESS_INFO.telephoneDisplay}`;
  }
  const region = city.direction === 'south' ? 'юг' : city.direction === 'east' ? 'восток' : 'юго-восток';
  return `Заборы и навесы для авто ${city.nameIn} (${region} Подмосковья): профнастил, евроштакетник. Замер бесплатно, монтаж от 1 дня, гарантия. Тел: ${BUSINESS_INFO.telephoneDisplay}`;
}

export function generateCityKeywords(city: GeoCity): string[] {
  const name = city.name.toLowerCase();
  const nameIn = city.nameIn.replace(/^в /, '').toLowerCase();
  return [
    `заборы ${nameIn}`,
    `забор из профнастила ${nameIn}`,
    `забор под ключ ${name}`,
    `навес для машины ${nameIn}`,
    `навесы ${name}`,
    `евроштакетник ${name}`,
    `установить забор ${name}`,
    `сетка рабица ${name}`,
    `откатные ворота ${name}`,
    `забор на дачу ${city.districts[0] || name}`,
  ];
}

export function generateHubTitle(hub: GeoHub): string {
  return `Заборы и навесы — ${hub.name} | Города работы, цены`;
}

export function generateHubDescription(hub: GeoHub): string {
  const highways = hub.highways.slice(0, 2).join(', ');
  return `Заборы и навесы ${hub.nameIn}: ${highways} и другие трассы. От 2 600 ₽/м, монтаж от 1 дня, гарантия. Тел: ${BUSINESS_INFO.telephoneDisplay}`;
}

export function generateNearbyCitiesLinks(city: GeoCity): GeoCity[] {
  return getNeighbourCities(city, 6);
}

export function generateDistrictsText(city: GeoCity): string {
  return `Мы выезжаем на замер и монтаж по всему городу и в ближайших населённых пунктах: ${city.districts.join(', ')}. ${city.driveTime} — дорога бригады (${city.highway}, ~${city.distanceKm} км от МКАД).`;
}

export function generateDachaBlock(city: GeoCity): { title: string; text: string } | null {
  if (!city.isDacha) {
    return null;
  }
  return {
    title: `Заборы для дачи и СНТ ${city.nameIn} и районе`,
    text: `${city.name} и окрестности — популярное дачное направление Подмосковья. Для сезонных участков предлагаем экономичные ограждения: сетку-рабицу и 3D-панели на металлических столбах с монтажом от 1 дня. Для домов круглогодичного проживания — капитальные заборы из профнастила и евроштакетника с бетонированием столбов и гарантией по договору. Сезонные предложения — на странице акций.`,
  };
}

export const NAVESY_POD_KLYUCH_FAQ: FaqItem[] = [
  {
    question: 'Сколько стоит навес под ключ для автомобиля?',
    answer:
      'Стоимость зависит от размеров, типа конструкции (односкатный, двускатный, арочный) и материала покрытия (сотовый поликарбонат или профлист). Точную цену под ваш автомобиль и место установки рассчитает калькулятор навеса — с монтажом и крепежом, без скрытых доплат.',
  },
  {
    question: 'Что входит в цену «навес под ключ»?',
    answer:
      'Проектное решение под размеры площадки, металлокаркас с антикоррозийной обработкой, покрытие (поликарбонат или профлист), крепёж, доставка материалов, монтаж с бетонированием опор и уборка после работ. Гарантия по договору.',
  },
  {
    question: 'Какой навес дешевле — из поликарбоната или профнастила?',
    answer:
      'Профлист обычно дешевле поликарбоната при одинаковой площади, но поликарбонат пропускает свет и легче — под него нужна менее мощная ферма. Для навеса над парковкой чаще выбирают поликарбонат: под ним не темно и машина не перегревается. Сравнение материалов — в нашей статье «Поликарбонат или профлист для навеса».',
  },
  {
    question: 'За сколько дней устанавливается навес?',
    answer:
      'Типовой навес на два автомобиля монтируется за 1–2 дня после замера. Изготовление индивидуальной конструкции с фермами — от 3 до 7 рабочих дней в зависимости от сезона.',
  },
  {
    question: 'Можно ли пристроить навес к дому?',
    answer:
      'Да, пристроенные навесы — один из самых частых вариантов. Каркас крепится к стене с усилением опорной балки, покраска под цвет фасада или кровли. Замерщик предложит 2–3 варианта размещения на вашем участке.',
  },
];
