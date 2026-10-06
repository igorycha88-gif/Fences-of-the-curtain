/**
 * Данные страницы «Сотки → погонные метры забора: таблица» (ЧТЗ v5 TASK-ZN-01L,
 * поглощает ZN-02/ZN-03 из v4; расширение по ЧТЗ v6 TASK-ZN-1: строки
 * «21 сотка» и «5 гектар», методика самостоятельного расчёта, деньги-таблица).
 * Вынесены из page.tsx: Next.js запрещает нестандартные экспорты из Page.
 */

export const RATE_PROFNASTIL = 2600;
export const RATE_EVROSHTAKETNIK = 3100;
export const RATE_RABICA = 550;

interface SotkiRow {
  sotki: string;
  plotSize: string;
  perimeterM: number;
  perimeterSquareM: number;
}

/** Таблица 4–50 соток: стандартные пропорции участка + квадрат той же площади. */
export const SOTKI_PERIMETER_TABLE: SotkiRow[] = [
  { sotki: '4 сотки', plotSize: '20 × 20 м', perimeterM: 80, perimeterSquareM: 80 },
  { sotki: '6 соток', plotSize: '20 × 30 м', perimeterM: 100, perimeterSquareM: 98 },
  { sotki: '8 соток', plotSize: '20 × 40 м', perimeterM: 120, perimeterSquareM: 113 },
  { sotki: '10 соток', plotSize: '25 × 40 м', perimeterM: 130, perimeterSquareM: 126 },
  { sotki: '11 соток', plotSize: '25 × 44 м', perimeterM: 138, perimeterSquareM: 133 },
  { sotki: '12 соток', plotSize: '30 × 40 м', perimeterM: 140, perimeterSquareM: 139 },
  { sotki: '15 соток', plotSize: '30 × 50 м', perimeterM: 160, perimeterSquareM: 155 },
  { sotki: '18 соток', plotSize: '30 × 60 м', perimeterM: 180, perimeterSquareM: 170 },
  { sotki: '20 соток', plotSize: '40 × 50 м', perimeterM: 180, perimeterSquareM: 179 },
  { sotki: '21 сотка', plotSize: '30 × 70 м', perimeterM: 200, perimeterSquareM: 183 },
  { sotki: '24 сотки', plotSize: '40 × 60 м', perimeterM: 200, perimeterSquareM: 196 },
  { sotki: '25 соток', plotSize: '50 × 50 м', perimeterM: 200, perimeterSquareM: 200 },
  { sotki: '30 соток', plotSize: '50 × 60 м', perimeterM: 220, perimeterSquareM: 219 },
  { sotki: '40 соток', plotSize: '50 × 80 м', perimeterM: 260, perimeterSquareM: 253 },
  { sotki: '50 соток (5 гектар)', plotSize: '50 × 100 м', perimeterM: 300, perimeterSquareM: 283 },
];

interface MaterialsRow {
  sotki: string;
  perimeterM: number;
  posts: number;
  lagsM: number;
  sheets: number;
}

function materialsFor(perimeterM: number): { posts: number; lagsM: number; sheets: number } {
  return {
    posts: Math.ceil(perimeterM / 2.5) + 1,
    lagsM: perimeterM * 2,
    sheets: Math.ceil(perimeterM / 1.1),
  };
}

export const MATERIALS_TABLE: MaterialsRow[] = [100, 130, 160, 180].map((perimeterM, index) => {
  const sotkiLabels = ['6 соток (100 м)', '10 соток (130 м)', '15 соток (160 м)', '20 соток (180 м)'];
  return { sotki: sotkiLabels[index], perimeterM, ...materialsFor(perimeterM) };
});

export const ESTIMATE_RATES = [
  {
    material: 'Профнастил (профлист С8, высота 2 м)',
    ratePerMeter: RATE_PROFNASTIL,
    includes: 'столбы с бетонированием, 2 ряда лаг, крепёж, монтаж',
  },
  {
    material: 'Евроштакетник (шахматка, высота 2 м)',
    ratePerMeter: RATE_EVROSHTAKETNIK,
    includes: 'столбы с бетонированием, 2 ряда лаг, крепёж, монтаж',
  },
  {
    material: 'Сетка-рабица на металлических столбах',
    ratePerMeter: RATE_RABICA,
    includes: 'столбы с забутовкой, натяжение, монтаж',
  },
];

export const POG_METRY_FAQ = [
  {
    question: '25 соток — сколько это погонных метров забора?',
    answer:
      'Зависит от формы участка. Квадрат 50 × 50 м — 200 метров забора, стандартные пропорции близки к ним, а вытянутый надел (например, 25 × 100 м) — уже 300 метров. Смотрите строку «25 соток» в таблице выше: для типовых пропорций закладывайте 200 погонных метров.',
  },
  {
    question: 'Сколько метров забора в 18 сотках земли?',
    answer:
      'Для стандартного участка 30 × 60 м периметр — 180 погонных метров. Если 18 соток квадратом (примерно 42 × 42 м) — около 170 м. Чем ближе участок к квадрату, тем короче забор при той же площади.',
  },
  {
    question: 'Периметр участка 11 соток — сколько метров?',
    answer:
      'Для пропорций 25 × 44 м — 138 метров, для квадратного участка (~33 × 33 м) — около 133 м. Точное значение равно сумме длин всех сторон: измерьте каждую сторону по меже и сложите.',
  },
  {
    question: 'Сколько столбов нужно на 100 метров забора?',
    answer:
      'При стандартном шаге 2,5 м — 41 столб: 100 / 2,5 = 40 пролётов плюс один столб на замыкание. Для 130 метров (10 соток) — 53 столба, для 180 (18–20 соток) — 73. Формула: периметр делим на шаг и прибавляем 1.',
  },
  {
    question: 'Сколько листов профнастила нужно на 6 соток?',
    answer:
      'Около 91 листа при полезной ширине 1,1 м (100 м / 1,1 = 90,9 → 91 лист с округлением вверх). Плюс 2–3 запасных листа на подрезку по рельефу. Лаг при двух рядах понадобится 200 погонных метров.',
  },
  {
    question: 'Почему в таблице цена «от»?',
    answer:
      'Базовый расчёт — ровный участок, забор высотой 2 метра, без ворот и калитки. Перепад рельефа, каменистый грунт, армирование бетонирования и ворота с калиткой меняют смету. Точную цену с учётом всех нюансов даст бесплатный выезд замерщика или калькулятор забора.',
  },
];

export const LEAD_PLOT_OPTIONS = [
  { value: '4', label: '4 сотки (≈80 м)', perimeterM: 80 },
  { value: '6', label: '6 соток (≈100 м)', perimeterM: 100 },
  { value: '8', label: '8 соток (≈120 м)', perimeterM: 120 },
  { value: '10', label: '10 соток (≈130 м)', perimeterM: 130 },
  { value: '12', label: '12 соток (≈140 м)', perimeterM: 140 },
  { value: '15', label: '15 соток (≈160 м)', perimeterM: 160 },
  { value: '18', label: '18 соток (≈180 м)', perimeterM: 180 },
  { value: '20', label: '20 соток (≈180 м)', perimeterM: 180 },
  { value: '25', label: '25 соток (≈200 м)', perimeterM: 200 },
  { value: '30', label: '30 соток (≈220 м)', perimeterM: 220 },
  { value: '50', label: '50 соток (≈300 м)', perimeterM: 300 },
];

/**
 * Методика «Как рассчитать периметр забора самому» (ЧТЗ v6 TASK-ZN-1):
 * площадь → пропорции → периметр → погонные метры, разбор на примере 14 соток.
 */
export interface SelfCalcStep {
  step: string;
  title: string;
  text: string;
}

export const SELF_CALC_STEPS: SelfCalcStep[] = [
  {
    step: 'Шаг 1',
    title: 'Переведите сотки в квадратные метры',
    text: 'Одна сотка — это 100 м² (квадрат 10 × 10 м). Умножьте количество соток на 100: например, 14 соток — это 1 400 м². Это же число есть в межевом плане или выписке ЕГРН.',
  },
  {
    step: 'Шаг 2',
    title: 'Определите пропорции участка',
    text: 'Разделите площадь на длину и ширину. Стандартные дачные пропорции — от 1:1,25 до 1:2. Для 1 400 м² это либо 35 × 40 м (близко к квадрату), либо 20 × 70 м (вытянутый надел). Точные стороны видны на публичной кадастровой карте или по колышкам межи.',
  },
  {
    step: 'Шаг 3',
    title: 'Посчитайте периметр',
    text: 'Для прямоугольника P = 2 × (длина + ширина). Пример на 14 сотках: 2 × (35 + 40) = 150 м для компактного участка и 2 × (20 + 70) = 180 м для вытянутого. Квадрат той же площади (~37 × 37 м) даёт минимум — около 150 м.',
  },
  {
    step: 'Шаг 4',
    title: 'Переведите периметр в погонные метры забора',
    text: 'Периметр и есть длина забора в погонных метрах. Минусуйте только ширину ворот и калитки (обычно 4–5 м): 150 м периметра — это ~145 м забора плюс ворота с калиткой. Дальше умножайте на цену за метр из сметы ниже.',
  },
];

/**
 * Денежная таблица «Сколько будет стоить забор на N соток» (ЧТЗ v6 TASK-ZN-1):
 * деньги-формулировки «во сколько обойдётся», новые якоря 14/21 соток и 5 гектар.
 */
export interface CostBySotkiRow {
  sotki: string;
  perimeterM: number;
}

export const COST_BY_SOTKI: CostBySotkiRow[] = [
  { sotki: '6 соток', perimeterM: 100 },
  { sotki: '10 соток', perimeterM: 130 },
  { sotki: '14 соток', perimeterM: 150 },
  { sotki: '15 соток', perimeterM: 160 },
  { sotki: '20 соток', perimeterM: 180 },
  { sotki: '21 сотка', perimeterM: 200 },
  { sotki: '50 соток (5 гектар)', perimeterM: 300 },
];

/**
 * Компактная таблица для гео-страниц (ЧТЗ v6 TASK-ZN-5): 3–5 строк
 * «сотки → погонные метры» со ссылкой на полную таблицу ZN-01L.
 */
export const GEO_MINI_SOTKI_TABLE: SotkiRow[] = SOTKI_PERIMETER_TABLE.filter(
  (row) =>
    row.sotki === '6 соток' ||
    row.sotki === '10 соток' ||
    row.sotki === '15 соток' ||
    row.sotki === '20 соток' ||
    row.sotki === '50 соток (5 гектар)'
);
