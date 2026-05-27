'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

interface PromotionData {
  id: string;
  fenceTypeId: string;
  name: string;
  discountType: 'MATERIALS' | 'WORKS' | 'BOTH';
  discountPercent: number;
  bannerTitle: string | null;
  bannerText: string | null;
  active: boolean;
  startDate: string | null;
  endDate: string | null;
}

interface PromotionSectionProps {
  fenceTypeId: string;
}

const defaultForm = {
  name: '',
  discountType: 'BOTH' as 'MATERIALS' | 'WORKS' | 'BOTH',
  discountPercent: 10,
  bannerTitle: '',
  bannerText: '',
  startDate: '',
  endDate: '',
};

export function PromotionSection({ fenceTypeId }: PromotionSectionProps) {
  const [promotion, setPromotion] = useState<PromotionData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState(defaultForm);

  const fetchPromotion = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/admin/promotions?fenceTypeId=${fenceTypeId}`,
        { credentials: 'include' }
      );
      if (response.ok) {
        const data = await response.json();
        if (data.promotion) {
          setPromotion(data.promotion);
          setForm({
            name: data.promotion.name,
            discountType: data.promotion.discountType,
            discountPercent: data.promotion.discountPercent,
            bannerTitle: data.promotion.bannerTitle || '',
            bannerText: data.promotion.bannerText || '',
            startDate: data.promotion.startDate
              ? new Date(data.promotion.startDate).toISOString().slice(0, 10)
              : '',
            endDate: data.promotion.endDate
              ? new Date(data.promotion.endDate).toISOString().slice(0, 10)
              : '',
          });
        } else {
          setPromotion(null);
          setForm(defaultForm);
        }
      }
    } catch (error) {
      console.error('[PromotionSection] Error fetching:', error);
    } finally {
      setIsLoading(false);
    }
  }, [fenceTypeId]);

  useEffect(() => {
    if (fenceTypeId) {
      fetchPromotion();
    }
  }, [fenceTypeId, fetchPromotion]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.discountPercent < 1 || form.discountPercent > 50) {
      toast.error('Процент скидки: от 1 до 50');
      return;
    }

    try {
      const payload: Record<string, unknown> = {
        fenceTypeId,
        name: form.name,
        discountType: form.discountType,
        discountPercent: form.discountPercent,
        bannerTitle: form.bannerTitle || null,
        bannerText: form.bannerText || null,
        active: false,
      };

      if (form.startDate) payload.startDate = form.startDate;
      if (form.endDate) payload.endDate = form.endDate;

      let response: Response;

      if (promotion) {
        response = await fetch(`/api/admin/promotions/${promotion.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          credentials: 'include',
        });
      } else {
        response = await fetch('/api/admin/promotions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          credentials: 'include',
        });
      }

      if (response.ok) {
        toast.success(promotion ? 'Акция обновлена' : 'Акция создана');
        setIsEditing(false);
        fetchPromotion();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Ошибка сохранения');
      }
    } catch (error) {
      console.error('[PromotionSection] Error saving:', error);
      toast.error('Ошибка сохранения');
    }
  };

  const handleToggle = async () => {
    if (!promotion) return;

    try {
      const response = await fetch(
        `/api/admin/promotions/${promotion.id}/toggle`,
        {
          method: 'PATCH',
          credentials: 'include',
        }
      );

      if (response.ok) {
        const data = await response.json();
        toast.success(data.active ? 'Акция активирована' : 'Акция деактивирована');
        fetchPromotion();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Ошибка');
      }
    } catch (error) {
      toast.error('Ошибка');
    }
  };

  const handleDelete = async () => {
    if (!promotion) return;
    if (!confirm('Удалить акцию?')) return;

    try {
      const response = await fetch(`/api/admin/promotions/${promotion.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        toast.success('Акция удалена');
        setPromotion(null);
        setForm(defaultForm);
        setIsEditing(false);
      } else {
        const data = await response.json();
        toast.error(data.error || 'Ошибка удаления');
      }
    } catch (error) {
      toast.error('Ошибка удаления');
    }
  };

  const discountTypeLabel = (type: string) => {
    switch (type) {
      case 'MATERIALS': return 'Материалы';
      case 'WORKS': return 'Работы';
      case 'BOTH': return 'Материалы + Работы';
      default: return type;
    }
  };

  return (
    <div className="mt-6 border-t pt-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Акция
        </h3>
        {promotion && (
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              promotion.active
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {promotion.active ? 'Активна' : 'Неактивна'}
            </span>
            <button
              onClick={handleToggle}
              className={`px-3 py-1 rounded text-xs font-medium ${
                promotion.active
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              {promotion.active ? 'Деактивировать' : 'Активировать'}
            </button>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-500 mb-4">
        Настройте акционную скидку для данного типа забора. Скидка применяется к финальной стоимости (с учетом удорожания).
      </p>

      {isLoading ? (
        <p className="text-sm text-gray-500">Загрузка...</p>
      ) : promotion && !isEditing ? (
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">Название:</span>{' '}
              <span className="font-medium">{promotion.name}</span>
            </div>
            <div>
              <span className="text-gray-500">Скидка:</span>{' '}
              <span className="font-medium text-red-600">-{promotion.discountPercent}%</span>
            </div>
            <div>
              <span className="text-gray-500">Тип:</span>{' '}
              <span className="font-medium">{discountTypeLabel(promotion.discountType)}</span>
            </div>
            <div>
              <span className="text-gray-500">Заголовок баннера:</span>{' '}
              <span className="font-medium">{promotion.bannerTitle || '—'}</span>
            </div>
            {promotion.bannerText && (
              <div className="col-span-2">
                <span className="text-gray-500">Текст баннера:</span>{' '}
                <span>{promotion.bannerText}</span>
              </div>
            )}
            <div>
              <span className="text-gray-500">Начало:</span>{' '}
              <span>{promotion.startDate ? new Date(promotion.startDate).toLocaleDateString('ru-RU') : '—'}</span>
            </div>
            <div>
              <span className="text-gray-500">Окончание:</span>{' '}
              <span>{promotion.endDate ? new Date(promotion.endDate).toLocaleDateString('ru-RU') : '—'}</span>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => setIsEditing(true)}
              className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
            >
              Редактировать
            </button>
            <button
              onClick={handleDelete}
              className="px-3 py-1.5 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200"
            >
              Удалить
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Название акции *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full border rounded px-2 py-1.5 text-sm"
                placeholder="Летняя скидка на профнастил"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Скидка (%)
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={form.discountPercent}
                onChange={(e) => setForm((prev) => ({ ...prev, discountPercent: Number(e.target.value) }))}
                className="w-full border rounded px-2 py-1.5 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Скидка на
              </label>
              <select
                value={form.discountType}
                onChange={(e) => setForm((prev) => ({ ...prev, discountType: e.target.value as any }))}
                className="w-full border rounded px-2 py-1.5 text-sm"
              >
                <option value="BOTH">Материалы + Работы</option>
                <option value="MATERIALS">Только материалы</option>
                <option value="WORKS">Только работы</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Заголовок баннера
              </label>
              <input
                type="text"
                value={form.bannerTitle}
                onChange={(e) => setForm((prev) => ({ ...prev, bannerTitle: e.target.value }))}
                className="w-full border rounded px-2 py-1.5 text-sm"
                placeholder="Скидка 10% на заборы из профнастила!"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Текст баннера (опционально)
              </label>
              <textarea
                value={form.bannerText}
                onChange={(e) => setForm((prev) => ({ ...prev, bannerText: e.target.value }))}
                className="w-full border rounded px-2 py-1.5 text-sm"
                rows={2}
                placeholder="Подробное описание акции..."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Дата начала (опционально)
              </label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))}
                className="w-full border rounded px-2 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Дата окончания (опционально)
              </label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))}
                className="w-full border rounded px-2 py-1.5 text-sm"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button
              type="submit"
              className="px-4 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            >
              {promotion ? 'Обновить' : 'Создать'}
            </button>
            {promotion && (
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-1.5 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
              >
                Отмена
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
