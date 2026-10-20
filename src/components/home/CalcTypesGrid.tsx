import Link from 'next/link';
import {
  ArrowRight,
  ChevronRight,
  DoorClosed,
  DoorOpen,
  Fence,
  Home,
  Warehouse,
} from 'lucide-react';

interface CalcType {
  href: string;
  icon: typeof Fence;
  title: string;
  sub: string;
  isNew?: boolean;
}

const CALC_TYPES: CalcType[] = [
  {
    href: '/calculator/fence',
    icon: Fence,
    title: 'Забор',
    sub: 'Профнастил, евроштакетник, сетка, 3D-панели',
  },
  {
    href: '/calculator/canopy',
    icon: Home,
    title: 'Навес',
    sub: 'Для авто и террасы · поликарбонат, черепица',
  },
  {
    href: '/calculator/gates',
    icon: DoorOpen,
    title: 'Ворота',
    sub: 'Откатные и распашные · автоматика',
  },
  {
    href: '/calculator/gates',
    icon: DoorClosed,
    title: 'Калитка',
    sub: 'Взаборная или отдельная · с замком',
  },
  {
    href: '/garazhi-iz-sendvich-panelej',
    icon: Warehouse,
    title: 'Гараж',
    sub: 'Сендвич-панели под ключ · от 40 000 ₽/м²',
    isNew: true,
  },
];

export default function CalcTypesGrid() {
  return (
    <div className="grid grid-cols-1 gap-3 text-left sm:grid-cols-2 sm:gap-4 lg:grid-cols-5">
      {CALC_TYPES.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.title}
            href={item.href}
            aria-label={`Рассчитать: ${item.title}`}
            className="group relative flex min-h-[68px] items-center gap-3 rounded-xl border border-primary/15 bg-white/70 px-3.5 py-3 backdrop-blur-sm transition-all duration-300 hover:border-primary hover:bg-white hover:shadow-lg hover:shadow-primary/20 active:scale-[0.98] lg:min-h-0 lg:flex-col lg:items-start lg:gap-0 lg:rounded-2xl lg:p-5 lg:hover:-translate-y-1.5"
          >
            <span
              className={`flex h-11 w-11 flex-none items-center justify-center rounded-xl transition-colors duration-300 lg:mb-4 lg:h-12 lg:w-12 lg:rounded-2xl ${
                item.isNew
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground'
              }`}
            >
              <Icon className="h-5 w-5 lg:h-6 lg:w-6" />
            </span>

            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-base font-bold lg:text-lg">
                {item.title}
                {item.isNew && (
                  <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-primary-foreground shadow-md shadow-primary/30">
                    Новый
                  </span>
                )}
              </span>
              <span className="mt-0.5 block text-xs leading-snug text-muted-foreground lg:mt-1 lg:text-[13px]">
                {item.sub}
              </span>
            </span>

            <span className="hidden items-center gap-1.5 self-start text-sm font-semibold text-primary lg:mt-4 lg:flex">
              Рассчитать
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </span>

            <ChevronRight className="h-5 w-5 flex-none text-muted-foreground/40 transition-colors group-hover:text-primary lg:hidden" />
          </Link>
        );
      })}
    </div>
  );
}
