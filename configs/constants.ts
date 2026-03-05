export const APP_CONFIG = {
  name: 'Заборы и Навесы',
  description: 'Профессиональная установка заборов и навесов',
  domain: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  phone: '+7 (900) 123-45-67',
  email: 'info@fences.ru',
} as const;

export const CALCULATOR_CONFIG = {
  fence: {
    minLength: 10,
    maxLength: 1000,
    minHeight: 1.5,
    maxHeight: 3.5,
    postStep: 2.5,
    defaultLagRows: 2,
    coatings: {
      GALVANIZED: { name: 'Оцинковка', coef: 1.0 },
      POLYMER_SINGLE: { name: 'Полимерное (одностороннее)', coef: 1.1 },
      POLYMER_DOUBLE: { name: 'Полимерное (двустороннее)', coef: 1.2 },
    },
  },
  canopy: {
    minLength: 3,
    maxLength: 50,
    minWidth: 2,
    maxWidth: 20,
    minHeight: 2,
    maxHeight: 6,
    areaCoefs: {
      'single-slope': 1.0,
      'double-slope': 1.1,
      'arch': 1.15,
    },
  },
} as const;

export const ORDER_STATUS_LABELS = {
  NEW: 'Новая',
  IN_PROGRESS: 'В работе',
  COMPLETED: 'Завершена',
  CANCELLED: 'Отменена',
} as const;

export const ORDER_STATUS_COLORS = {
  NEW: 'bg-yellow-100 text-yellow-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
} as const;
