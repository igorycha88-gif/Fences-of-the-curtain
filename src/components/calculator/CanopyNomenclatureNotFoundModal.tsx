'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Send, Loader2, CheckCircle, AlertCircle, Ruler } from 'lucide-react';

function formatPrice(value: number): string {
  return Math.round(value).toLocaleString('ru-RU') + ' руб.';
}

interface CanopyParameters {
  canopyType: string;
  canopyTypeLabel: string;
  purpose: string;
  purposeLabel: string;
  postTypeId?: string;
  postTypeName?: string;
  length: number;
  width: number;
  height: number;
  ridgeHeight: number;
  roofCoveringId: string;
  roofCoveringName: string;
  installationType: string;
  installationTypeLabel: string;
  hasWaterSystem: boolean;
}

interface CanopyNomenclatureNotFoundModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  canopyParameters: CanopyParameters;
  totalCost?: number;
  pricePerSqm?: number;
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

export default function CanopyNomenclatureNotFoundModal({
  isOpen,
  onClose,
  onSuccess,
  canopyParameters,
  totalCost,
  pricePerSqm,
}: CanopyNomenclatureNotFoundModalProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const handleClose = useCallback(() => {
    if (!loading) {
      setFormData(initialFormData);
      setError(null);
      setFieldErrors({});
      setSuccess(false);
      onClose();
    }
  }, [loading, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleClose]);

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
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          isIndividualRequest: true,
          canopyParameters,
          totalCost,
          pricePerSqm,
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
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch {
      setError('Ошибка отправки заявки. Попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) handleClose();
  };

  if (!isOpen) return null;

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={handleBackdropClick}>
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200" onClick={handleBackdropClick}>
      <div className="bg-card rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">Индивидуальный расчёт навеса</h3>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
            aria-label="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-6">
          <p className="text-sm text-muted-foreground">
            Для выбранных вами параметров подготовлен расчёт. 
            Оставьте контакты — менеджер свяжется с вами, уточнит детали и подготовит персональное предложение.
          </p>
        </div>

        {typeof totalCost === 'number' && (
          <div className="bg-primary/10 border-2 border-primary/30 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-muted-foreground">Предварительная стоимость:</span>
            </div>
            <div className="text-2xl font-bold text-primary mb-1">
              {formatPrice(totalCost)}
            </div>
            {typeof pricePerSqm === 'number' && (
              <div className="text-xs text-muted-foreground">
                Площадь: {(canopyParameters.length * canopyParameters.width).toLocaleString('ru-RU')} м² × {pricePerSqm.toLocaleString('ru-RU')} руб./м²
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 mb-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
              Комментарий <span className="text-muted-foreground">(необязательно)</span>
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Опишите ваши пожелания..."
              rows={3}
              maxLength={1000}
              className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
            />
          </div>

          <div className="bg-secondary/30 border border-border/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Ruler className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Параметры вашего навеса:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Тип:</span>{' '}
                <span className="font-medium">{canopyParameters.canopyTypeLabel}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Назначение:</span>{' '}
                <span className="font-medium">{canopyParameters.purposeLabel}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Длина:</span>{' '}
                <span className="font-medium">{canopyParameters.length} м</span>
              </div>
              <div>
                <span className="text-muted-foreground">Ширина:</span>{' '}
                <span className="font-medium">{canopyParameters.width} м</span>
              </div>
              <div>
                <span className="text-muted-foreground">Высота:</span>{' '}
                <span className="font-medium">{canopyParameters.height} м</span>
              </div>
              <div>
                <span className="text-muted-foreground">Высота конька:</span>{' '}
                <span className="font-medium">{canopyParameters.ridgeHeight} м</span>
              </div>
              <div>
                <span className="text-muted-foreground">Кровля:</span>{' '}
                <span className="font-medium">{canopyParameters.roofCoveringName}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Установка:</span>{' '}
                <span className="font-medium">{canopyParameters.installationTypeLabel}</span>
              </div>
              {canopyParameters.hasWaterSystem && (
                <div>
                  <span className="text-muted-foreground">Водосток:</span>{' '}
                  <span className="font-medium">Да</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-3 border border-border rounded-xl hover:bg-secondary transition-colors font-medium"
            >
              Закрыть
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
