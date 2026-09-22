'use client';

import { useState } from 'react';
import { Send, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export interface LeadFormPlotOption {
  value: string;
  label: string;
  perimeterM: number;
}

interface LeadFormProps {
  source: string;
  plotOptions: LeadFormPlotOption[];
  defaultPlotValue?: string;
  title?: string;
  submitLabel?: string;
}

function formatPhoneNumber(value: string): string {
  const digits = value.replace(/\D/g, '');

  if (digits.length === 0) return '+7 ';
  if (digits.length <= 1) return '+7 ';
  if (digits.length <= 4) return `+7 (${digits.slice(1)}`;
  if (digits.length <= 7) return `+7 (${digits.slice(1, 4)}) ${digits.slice(4)}`;
  if (digits.length <= 9) return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9, 11)}`;
}

export default function LeadForm({
  source,
  plotOptions,
  defaultPlotValue,
  title = 'Точный расчёт с выездом — бесплатно',
  submitLabel = 'Получить точную смету',
}: LeadFormProps) {
  const [clientName, setClientName] = useState('');
  const [phone, setPhone] = useState('');
  const [plot, setPlot] = useState(defaultPlotValue || plotOptions[0]?.value || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const selectedPlot = plotOptions.find((option) => option.value === plot) || plotOptions[0];

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhoneNumber(e.target.value));
    if (fieldErrors.phone) {
      setFieldErrors({ ...fieldErrors, phone: '' });
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (clientName.trim().length < 2) {
      errors.clientName = 'Имя должно содержать минимум 2 символа';
    }

    const phoneRegex = /^\+7\s*\(\d{3}\)\s*\d{3}-\d{2}-\d{2}$/;
    if (!phoneRegex.test(phone)) {
      errors.phone = 'Введите телефон в формате +7 (XXX) XXX-XX-XX';
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
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: clientName.trim(),
          phone,
          message: `Заявка с расчётной страницы «${source}»: точный расчёт с выездом`,
          isIndividualRequest: true,
          fenceParameters: {
            fenceTypeId: 'seo-landing',
            fenceTypeName: `Точный расчёт с выездом (страница «${source}»)`,
            length: selectedPlot?.perimeterM ?? 100,
            height: 2,
            plotLabel: selectedPlot?.label,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === 'RATE_LIMIT_EXCEEDED') {
          setError('Слишком много запросов. Попробуйте позже.');
          return;
        }
        setError(data.message || 'Ошибка отправки заявки');
        return;
      }

      setSuccess(true);
    } catch {
      setError('Ошибка отправки заявки. Попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="card-modern p-6 text-center" data-testid="lead-form-success">
        <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold mb-2">Заявка отправлена!</h3>
        <p className="text-sm text-muted-foreground">
          Замерщик свяжется с вами в течение 15 минут в рабочее время (пн–сб 9:00–18:00).
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card-modern p-6" data-testid="lead-form" noValidate>
      <h3 className="text-lg font-bold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Замерщик приедет с рулеткой и образцами, зафиксирует точный периметр до сантиметра —
        смета бесплатная и ни к чему не обязывает.
      </p>

      <div className="space-y-3">
        <div>
          <label htmlFor={`lead-name-${source}`} className="text-sm font-medium">
            Ваше имя
          </label>
          <input
            id={`lead-name-${source}`}
            type="text"
            value={clientName}
            onChange={(e) => {
              setClientName(e.target.value);
              if (fieldErrors.clientName) {
                setFieldErrors({ ...fieldErrors, clientName: '' });
              }
            }}
            placeholder="Иван"
            className="w-full mt-1 px-4 py-2.5 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
            maxLength={100}
          />
          {fieldErrors.clientName && (
            <p className="text-xs text-red-500 mt-1" role="alert">{fieldErrors.clientName}</p>
          )}
        </div>

        <div>
          <label htmlFor={`lead-phone-${source}`} className="text-sm font-medium">
            Телефон
          </label>
          <input
            id={`lead-phone-${source}`}
            type="tel"
            value={phone}
            onChange={handlePhoneChange}
            placeholder="+7 (___) ___-__-__"
            className="w-full mt-1 px-4 py-2.5 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          {fieldErrors.phone && (
            <p className="text-xs text-red-500 mt-1" role="alert">{fieldErrors.phone}</p>
          )}
        </div>

        {plotOptions.length > 0 && (
          <div>
            <label htmlFor={`lead-plot-${source}`} className="text-sm font-medium">
              Размер участка
            </label>
            <select
              id={`lead-plot-${source}`}
              value={plot}
              onChange={(e) => setPlot(e.target.value)}
              className="w-full mt-1 px-4 py-2.5 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              {plotOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 text-sm text-red-500" role="alert">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          {submitLabel}
        </button>

        <p className="text-xs text-muted-foreground">
          Нажимая кнопку, вы соглашаетесь с обработкой персональных данных.
        </p>
      </div>
    </form>
  );
}
