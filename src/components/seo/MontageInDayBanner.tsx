import Link from 'next/link';
import { Clock, Sunrise, Truck, Hammer, CheckCircle2, Calculator, ArrowRight } from 'lucide-react';

interface MontageInDayBannerProps {
  mode?: 'fence' | 'canopy';
  className?: string;
}

const CONTENT = {
  fence: {
    title: 'Монтаж забора за 1 день',
    subtitle:
      'Типовой забор до 50 погонных метров ставим за один рабочий день: утром — замер и разметка, вечером — готовый забор. Без «приезжаем на следующей неделе» — сентябрьское окно закрывается, а вам нужен результат сейчас.',
    timeline: [
      { icon: Sunrise, time: '08:00', text: 'Замер, разметка, доставка материалов' },
      { icon: Truck, time: '11:00', text: 'Установка столбов с бетонированием' },
      { icon: Hammer, time: '14:00', text: 'Монтаж лаг и полотна забора' },
      { icon: CheckCircle2, time: '18:00', text: 'Готовый забор: ворота, калитка, уборка' },
    ],
    note: 'Точный график фиксируем после бесплатного замера. Навесы для автомобилей монтируем от 1 до 2 дней в зависимости от размеров.',
    cta: 'Рассчитать забор',
    ctaHref: '/calculator/fence',
  },
  canopy: {
    title: 'Монтаж навеса — от 1 до 2 дней',
    subtitle:
      'Типовой навес на 1–2 автомобиля монтируем за 1–2 рабочих дня после замера. Каркас с антикоррозийной обработкой, покрытие, уборка после работ — всё входит в цену «под ключ».',
    timeline: [
      { icon: Sunrise, time: 'День 1', text: 'Доставка, разметка, бетонирование опор' },
      { icon: Truck, time: 'День 1–2', text: 'Сварка и покраска каркаса, ферм' },
      { icon: Hammer, time: 'День 2', text: 'Монтаж покрытия: поликарбонат или профлист' },
      { icon: CheckCircle2, time: 'День 2', text: 'Проверка, уборка, гарантия по договору' },
    ],
    note: 'Индивидуальные конструкции с фермами — от 3 до 7 рабочих дней. Точный срок назовём после бесплатного замера.',
    cta: 'Рассчитать навес',
    ctaHref: '/calculator/canopy',
  },
} as const;

export default function MontageInDayBanner({ mode = 'fence', className }: MontageInDayBannerProps) {
  const content = CONTENT[mode];

  return (
    <section
      data-testid="montage-in-day-banner"
      className={`py-16 px-4 bg-primary text-primary-foreground ${className || ''}`}
    >
      <div className="container mx-auto max-w-5xl">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-sm font-medium mb-4">
            <Clock className="w-4 h-4" />
            Скорость — наше преимущество
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{content.title}</h2>
          <p className="text-lg opacity-90 max-w-3xl mx-auto">{content.subtitle}</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {content.timeline.map((step) => (
            <div
              key={step.time}
              className="bg-white/10 rounded-xl p-5 text-center"
              data-testid={`montage-step-${step.time}`}
            >
              <div className="w-10 h-10 bg-white/15 rounded-full flex items-center justify-center mx-auto mb-3">
                <step.icon className="w-5 h-5" />
              </div>
              <p className="font-bold mb-1">{step.time}</p>
              <p className="text-sm opacity-85">{step.text}</p>
            </div>
          ))}
        </div>

        <p className="text-center text-sm opacity-75 mb-6">{content.note}</p>

        <div className="text-center">
          <Link
            href={content.ctaHref}
            className="inline-flex items-center gap-2 bg-white text-primary px-8 py-4 rounded-xl font-semibold hover:bg-white/90 transition-colors"
          >
            <Calculator className="w-5 h-5" />
            {content.cta}
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
