'use client';

import { useState } from 'react';
import { X, Send, Loader2, CheckCircle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { metrikaEvents } from '@/lib/seo/metrika';
import { trackEvent } from '@/lib/analytics';
import { EVENT_NAMES } from '@/types/analytics';

interface EstimateItem {
  category: string;
  nomenclatureId: string | null;
  nomenclatureName: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  totalPrice: number;
}

interface FenceEstimateData {
  estimateId: string;
  items: EstimateItem[];
  totals: {
    materials: number;
    installation: number;
    grandTotal: number;
  };
  parameters: {
    fenceTypeId: string;
    fenceTypeName: string;
    length: number;
    height: number;
    lagRows: number;
    coating?: string;
    gate?: {
      type: string;
      length: number;
      selectedName: string;
    };
    wicket?: {
      width: number;
      height: number;
      selectedName: string;
    };
  };
  calculatedAt: string;
}

interface SingleOrderFormProps {
  calculatedCost: number;
  onClose: () => void;
  onSuccess: () => void;
}

interface MultiOrderFormProps {
  multiEstimateId: string;
  estimates: Array<{
    index: number;
    result: FenceEstimateData;
  }>;
  totals: {
    totalMaterials: number;
    totalInstallation: number;
    grandTotal: number;
  };
  onClose: () => void;
  onSuccess: () => void;
}

type OrderFormProps = SingleOrderFormProps | MultiOrderFormProps;

function isMultiOrderFormProps(props: OrderFormProps): props is MultiOrderFormProps {
  return 'multiEstimateId' in props && 'estimates' in props;
}

interface FormData {
  clientName: string;
  phone: string;
  email: string;
  message: string;
}

const initialFormData: FormData = {
  clientName: '',
  phone: '',
  email: '',
  message: '',
};

function formatPhoneNumber(value: string): string {
  const digits = value.replace(/\D/g, '');
  
  if (digits.length === 0) return '+7 ';
  if (digits.length <= 1) return '+7 ';
  if (digits.length <= 4) return `+7 (${digits.slice(1)}`;
  if (digits.length <= 7) return `+7 (${digits.slice(1, 4)}) ${digits.slice(4)}`;
  if (digits.length <= 9) return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9, 11)}`;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(value);
}

function EstimateBreakdown({ estimate, index }: { estimate: FenceEstimateData; index: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 bg-secondary/30 hover:bg-secondary/50 transition-colors"
      >
        <div className="text-left">
          <p className="font-semibold">
            Забор {index + 1}: {estimate.parameters.fenceTypeName}
          </p>
          <p className="text-sm text-muted-foreground">
            {estimate.parameters.length} м × {estimate.parameters.height} м
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-bold text-primary">
            {formatCurrency(estimate.totals.grandTotal)}
          </span>
          {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </button>

      {expanded && (
        <div className="p-4 space-y-3">
          <div className="space-y-1">
            {estimate.items.map((item, i) => (
              <div key={i} className="flex justify-between items-center text-sm py-1 border-b border-border/30">
                <span className="text-muted-foreground">{item.nomenclatureName}</span>
                <span className="font-medium">{formatCurrency(item.totalPrice)}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-between text-sm pt-2">
            <span className="text-muted-foreground">Материалы</span>
            <span>{formatCurrency(estimate.totals.materials)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Монтаж</span>
            <span>{formatCurrency(estimate.totals.installation)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrderForm(props: OrderFormProps) {
  const isMulti = isMultiOrderFormProps(props);
  const calculatedCost = isMulti ? props.totals.grandTotal : props.calculatedCost;

  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setFormData({ ...formData, phone: formatted });
    if (fieldErrors.phone) {
      setFieldErrors({ ...fieldErrors, phone: '' });
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (formData.clientName.trim().length < 2) {
      errors.clientName = 'Имя должно содержать минимум 2 символа';
    }

    const phoneRegex = /^\+7\s*\(\d{3}\)\s*\d{3}-\d{2}-\d{2}$/;
    if (!phoneRegex.test(formData.phone)) {
      errors.phone = 'Введите телефон в формате +7 (XXX) XXX-XX-XX';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Введите корректный email';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) return;

    setLoading(true);
    try {
      const requestBody: Record<string, unknown> = {
        ...formData,
      };

      if (isMulti) {
        requestBody.isMultiEstimate = true;
        requestBody.multiEstimateId = props.multiEstimateId;
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === 'SESSION_EXPIRED') {
          setError('Время сессии истекло. Пожалуйста, выполните расчет заново.');
          return;
        }
        if (data.error === 'RATE_LIMIT_EXCEEDED') {
          setError('Слишком много запросов. Попробуйте позже.');
          return;
        }
        setError(data.message || 'Ошибка отправки заявки');
        return;
      }

      setSuccess(true);
      metrikaEvents.orderFormSubmit('fence', isMulti ? (props as MultiOrderFormProps).totals.grandTotal : (props as SingleOrderFormProps).calculatedCost);
      trackEvent(EVENT_NAMES.CONTACT_FORM_SUBMIT, { formType: isMulti ? 'multi_estimate' : 'single_estimate' });
      setTimeout(() => {
        props.onSuccess();
      }, 2000);
    } catch (err) {
      setError('Ошибка отправки заявки. Попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-card rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h3 className="text-xl font-bold mb-2">Заявка отправлена!</h3>
          <p className="text-muted-foreground">
            Мы свяжемся с вами в ближайшее время
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold">Оформить заявку</h3>
          <button
            onClick={props.onClose}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 mb-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isMulti && (
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                Типы заборов ({props.estimates.length})
              </h4>
              {props.estimates.map(({ index, result }) => (
                <EstimateBreakdown key={result.estimateId} estimate={result} index={index} />
              ))}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">
              Ваше имя <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={formData.clientName}
              onChange={(e) => {
                setFormData({ ...formData, clientName: e.target.value });
                if (fieldErrors.clientName) {
                  setFieldErrors({ ...fieldErrors, clientName: '' });
                }
              }}
              placeholder="Иван Петров"
              className={`w-full px-4 py-3 bg-secondary/50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all ${
                fieldErrors.clientName ? 'border-destructive' : 'border-border'
              }`}
            />
            {fieldErrors.clientName && (
              <p className="text-sm text-destructive mt-1">{fieldErrors.clientName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Телефон <span className="text-destructive">*</span>
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={handlePhoneChange}
              placeholder="+7 (___) ___-__-__"
              className={`w-full px-4 py-3 bg-secondary/50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all ${
                fieldErrors.phone ? 'border-destructive' : 'border-border'
              }`}
            />
            {fieldErrors.phone && (
              <p className="text-sm text-destructive mt-1">{fieldErrors.phone}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Email <span className="text-muted-foreground">(необязательно)</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value });
                if (fieldErrors.email) {
                  setFieldErrors({ ...fieldErrors, email: '' });
                }
              }}
              placeholder="email@example.com"
              className={`w-full px-4 py-3 bg-secondary/50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all ${
                fieldErrors.email ? 'border-destructive' : 'border-border'
              }`}
            />
            {fieldErrors.email && (
              <p className="text-sm text-destructive mt-1">{fieldErrors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Сообщение <span className="text-muted-foreground">(необязательно)</span>
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Дополнительная информация..."
              rows={3}
              className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
            />
          </div>

          <div className="bg-primary/5 p-4 rounded-xl space-y-2">
            {isMulti ? (
              <>
                {props.estimates.map(({ index, result }) => (
                  <div key={result.estimateId} className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">
                      {result.parameters.fenceTypeName} ({result.parameters.length} м)
                    </span>
                    <span className="font-medium">{formatCurrency(result.totals.grandTotal)}</span>
                  </div>
                ))}
                <div className="border-t border-primary/20 pt-2 flex justify-between items-center">
                  <span className="font-bold">Итого:</span>
                  <span className="text-2xl font-bold text-primary">
                    {formatCurrency(props.totals.grandTotal)}
                  </span>
                </div>
              </>
            ) : (
              <div className="flex justify-between items-center">
                <span className="font-medium">Стоимость по расчету:</span>
                <span className="text-xl font-bold text-primary">
                  {formatCurrency(calculatedCost)}
                </span>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={props.onClose}
              className="flex-1 px-4 py-3 border border-border rounded-xl hover:bg-secondary transition-colors font-medium"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Отправка...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Отправить заявку
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
