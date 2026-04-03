export type AnalyticsEvent = {
  eventName: string;
  sessionId: string;
  userId?: string;
  page?: string;
  referrer?: string;
  properties?: Record<string, unknown>;
  timestamp: string;
};

export type UserJourneyStep =
  | 'page_view'
  | 'calculator_open'
  | 'calculator_fence_type_select'
  | 'calculator_configure'
  | 'calculator_calculate'
  | 'calculator_export'
  | 'portfolio_view'
  | 'portfolio_item_click'
  | 'contacts_view'
  | 'contact_form_submit'
  | 'services_view'
  | 'phone_click'
  | 'exit';

export const EVENT_NAMES = {
  PAGE_VIEW: 'page_view',
  CALCULATOR_OPEN: 'calculator_open',
  CALCULATOR_FENCE_TYPE_SELECT: 'calculator_fence_type_select',
  CALCULATOR_CONFIGURE: 'calculator_configure',
  CALCULATOR_CALCULATE: 'calculator_calculate',
  CALCULATOR_EXPORT: 'calculator_export',
  PORTFOLIO_VIEW: 'portfolio_view',
  PORTFOLIO_ITEM_CLICK: 'portfolio_item_click',
  CONTACTS_VIEW: 'contacts_view',
  CONTACT_FORM_SUBMIT: 'contact_form_submit',
  SERVICES_VIEW: 'services_view',
  PHONE_CLICK: 'phone_click',
  SESSION_END: 'session_end',
} as const;

export type EventName = (typeof EVENT_NAMES)[keyof typeof EVENT_NAMES];
