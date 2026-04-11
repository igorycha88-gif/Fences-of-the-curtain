import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cache } from '@/lib/cache';

export const dynamic = 'force-dynamic';

const ABOUT_KEYS = [
  'about_hero_title',
  'about_hero_subtitle',
  'about_hero_image',
  'about_text',
  'about_advantages',
  'about_steps',
  'about_photos',
] as const;

const DEFAULT_VALUES: Record<string, string> = {
  about_hero_title: 'О компании',
  about_hero_subtitle: 'Полный цикл производства и монтажа заборов и навесов — от сырья до готового объекта',
  about_hero_image: '/images/about/production.jpg',
  about_text:
    'Компания «Заборы и Навесы» — это команда профессионалов, которая выполняет полный цикл работ по производству и установке заборов, навесов и ограждений. Мы контролируем каждый этап: от закупки сертифицированных материалов до финального монтажа на объекте.\n\nСобственное производство позволяет нам гарантировать качество и предлагать честные цены без посредников. Каждый проект — это индивидуальный подход, точный расчёт и соблюдение сроков.',
  about_advantages: JSON.stringify([
    { icon: 'Factory', title: 'Собственное производство', description: 'Контроль качества на каждом этапе' },
    { icon: 'Cog', title: 'Полный цикл работ', description: 'От замера до сдачи объекта' },
    { icon: 'Shield', title: 'Гарантия на работы', description: 'На все выполненные работы' },
    { icon: 'BadgePercent', title: 'Честные цены', description: 'Без скрытых платежей и наценок посредников' },
  ]),
  about_steps: JSON.stringify([
    { number: 1, title: 'Замер и консультация', description: 'Бесплатный выезд специалиста, обсуждение задачи' },
    { number: 2, title: 'Расчёт стоимости', description: 'Точный расчёт материалов и работ' },
    { number: 3, title: 'Производство', description: 'Изготовление конструкций на собственном производстве' },
    { number: 4, title: 'Доставка и монтаж', description: 'Профессиональная установка в оговорённые сроки' },
    { number: 5, title: 'Сдача объекта', description: 'Приёмка работ и подписание акта' },
  ]),
  about_photos: JSON.stringify([
    { image: '/images/about/production.jpg', caption: 'Наше производство' },
    { image: '/images/about/mounting.jpg', caption: 'Монтаж на объекте' },
    { image: '/images/about/workshop.jpg', caption: 'Производственный цех' },
    { image: '/images/about/materials.jpg', caption: 'Сертифицированные материалы' },
    { image: '/images/about/team.jpg', caption: 'Наша команда' },
  ]),
};

const CACHE_KEY = 'about:content';
const CACHE_TTL = 300;

export async function GET() {
  try {
    const cached = await cache.get<Record<string, string>>(CACHE_KEY);
    if (cached) {
      return NextResponse.json(cached, {
        headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=60' },
      });
    }

    const settings = await prisma.setting.findMany({
      where: { key: { in: [...ABOUT_KEYS] } },
    });

    const result: Record<string, string> = {};
    for (const key of ABOUT_KEYS) {
      const setting = settings.find((s) => s.key === key);
      result[key] = setting?.value ?? DEFAULT_VALUES[key] ?? '';
    }

    await cache.set(CACHE_KEY, result, CACHE_TTL);

    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=60' },
    });
  } catch (error) {
    console.error('[About API] Error fetching content:', error);
    return NextResponse.json(DEFAULT_VALUES);
  }
}
