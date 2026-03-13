export enum WorkCategory {
  MOUNTING = 'MOUNTING',
  DELIVERY = 'DELIVERY',
  ADDITIONAL = 'ADDITIONAL',
  MEASUREMENT = 'MEASUREMENT',
}

export enum WorkUnit {
  M = 'M',
  KM = 'KM',
  PCS = 'PCS',
  FIXED = 'FIXED',
  M2 = 'M2',
}

export const WorkCategoryNames: Record<WorkCategory, string> = {
  [WorkCategory.MOUNTING]: 'Монтаж',
  [WorkCategory.DELIVERY]: 'Доставка',
  [WorkCategory.ADDITIONAL]: 'Доп.работы',
  [WorkCategory.MEASUREMENT]: 'Замер',
};

export const WorkUnitNames: Record<WorkUnit, string> = {
  [WorkUnit.M]: 'м',
  [WorkUnit.KM]: 'км',
  [WorkUnit.PCS]: 'шт',
  [WorkUnit.FIXED]: 'фикс.',
  [WorkUnit.M2]: 'м²',
};

export const WORK_CATEGORIES = [
  { value: WorkCategory.MOUNTING, label: 'Монтаж' },
  { value: WorkCategory.DELIVERY, label: 'Доставка' },
  { value: WorkCategory.ADDITIONAL, label: 'Доп.работы' },
  { value: WorkCategory.MEASUREMENT, label: 'Замер' },
];

export const WORK_UNITS = [
  { value: WorkUnit.M, label: 'м (погонные метры)' },
  { value: WorkUnit.KM, label: 'км (километры)' },
  { value: WorkUnit.PCS, label: 'шт (штуки)' },
  { value: WorkUnit.FIXED, label: 'фикс. (фиксированная сумма)' },
  { value: WorkUnit.M2, label: 'м² (квадратные метры)' },
];
