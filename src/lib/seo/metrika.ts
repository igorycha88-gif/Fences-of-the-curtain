declare global {
  interface Window {
    ym: (id: number, action: string, ...args: unknown[]) => void;
  }
}

const METRIKA_ID = typeof window !== 'undefined'
  ? parseInt(process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID || '0', 10)
  : 0;

function reachGoal(target: string, params?: Record<string, unknown>): void {
  if (typeof window !== 'undefined' && METRIKA_ID && window.ym) {
    window.ym(METRIKA_ID, 'reachGoal', target, params);
  }
}

export const metrikaEvents = {
  calculatorStart(type: 'fence' | 'canopy') {
    reachGoal('calculator_start', { type });
  },

  calculatorComplete(type: 'fence' | 'canopy', value: number) {
    reachGoal('calculator_complete', { type, value });
  },

  contactFormSubmit() {
    reachGoal('contact_form_submit');
  },

  phoneClick() {
    reachGoal('phone_click');
  },

  portfolioView(slug: string) {
    reachGoal('portfolio_view', { slug });
  },
};
