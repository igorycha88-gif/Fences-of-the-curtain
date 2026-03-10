'use client';

import { useState, useEffect } from 'react';
import { DataTable } from '@/components/admin/References/DataTable';
import { Modal } from '@/components/ui/modal';
import { calculateMargin, getMarginEmoji } from '@/lib/utils/marginCalculator';
import { calculatePricePerUnit, calculateProfnastilMargin } from '@/lib/utils/priceCalculator';
import { formatDimension, formatPrice } from '@/lib/utils/formatters';
import { COATING_TYPES } from '@/lib/validators/profnastilType';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';

interface ProfnastilType {
  id: string;
  name: string;
  description: string | null;
  metalThickness: number;
  fullWidth: number;
  usefulWidth: number;
  length: number;
  coating: string;
  color: string | null;
  purchasePricePerMeter: number | null;
  retailPricePerMeter: number;
  purchasePricePerUnit?: number | null;
  retailPricePerUnit?: number | null;
  validFrom: string | null;
  validUntil: string | null;
  active: boolean;
  image: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface SessionUser {
  id: string;
  email: string;
  name?: string | null;
  role: 'ADMIN' | 'MANAGER' | 'CONTENT_MANAGER';
}

const formatDate = (date: string | Date | null): string => {
  if (!date) return 'Бессрочно';
  const d = new Date(date);
  return d.toLocaleDateString('ru-RU');
};

const formatValidFrom = (date: string | Date | null): string => {
  if (!date) return 'С момента добавления';
  const d = new Date(date);
  return d.toLocaleDateString('ru-RU');
};

export default function ProfnastilPage() {
  const [profnastil, setProfnastil] = useState<ProfnastilType[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [validityFilter, setValidityFilter] = useState<'all' | 'active' | 'expired' | 'expiring_soon'>('all');
  const [coatingFilter, setCoatingFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ProfnastilType | null>(null);
  const [formValues, setFormValues] = useState<Partial<ProfnastilType>>({});
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);

  const pageSize = 20;

  useEffect(() => {
    fetch('/api/auth/session')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setCurrentUser(data.user);
        }
      })
      .catch((err) => console.error('Error fetching session:', err));
  }, []);

  const fetchProfnastil = async () => {
    setIsLoading(true);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        validityFilter,
        ...(search && { search }),
        ...(coatingFilter !== 'all' && { coating: coatingFilter }),
      });

      const response = await fetch(`/api/admin/profnastil-types?${params}`);
      const data = await response.json();

      if (response.ok) {
        setProfnastil(data.profnastil);
        setTotal(data.total);
      } else {
        console.error('Error fetching profnastil types:', data.error);
      }
    } catch (error) {
      console.error('Error fetching profnastil types:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfnastil();
  }, [page, search, validityFilter, coatingFilter]);

  const handleAdd = () => {
    setEditingItem(null);
    setFormValues({
      name: '',
      description: '',
      metalThickness: 0.5,
      fullWidth: 1200,
      usefulWidth: 1150,
      length: 2000,
      coating: '',
      color: '',
      purchasePricePerMeter: null,
      retailPricePerMeter: 0,
      active: true,
      validFrom: null,
      validUntil: null,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (item: ProfnastilType) => {
    setEditingItem(item);
    setFormValues({
      name: item.name,
      description: item.description || '',
      metalThickness: item.metalThickness,
      fullWidth: item.fullWidth,
      usefulWidth: item.usefulWidth,
      length: item.length,
      coating: item.coating,
      color: item.color || '',
      purchasePricePerMeter: item.purchasePricePerMeter,
      retailPricePerMeter: item.retailPricePerMeter,
      active: item.active,
      validFrom: item.validFrom,
      validUntil: item.validUntil,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (item: ProfnastilType) => {
    if (!confirm(`Удалить "${item.name}"?`)) return;

    try {
      const response = await fetch(`/api/admin/profnastil-types/${item.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Номенклатура успешно удалена');
        fetchProfnastil();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Ошибка удаления');
      }
    } catch (error) {
      console.error('Error deleting profnastil type:', error);
      toast.error('Ошибка удаления');
    }
  };

  const handleToggleActive = async (item: ProfnastilType) => {
    try {
      const response = await fetch(`/api/admin/profnastil-types/${item.id}`, {
        method: 'PATCH',
      });

      if (response.ok) {
        toast.success('Статус изменен');
        fetchProfnastil();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Ошибка изменения статуса');
      }
    } catch (error) {
      console.error('Error toggling profnastil type:', error);
      toast.error('Ошибка изменения статуса');
    }
  };

  const handleFormChange = (name: string, value: any) => {
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingItem
        ? `/api/admin/profnastil-types/${editingItem.id}`
        : '/api/admin/profnastil-types';
      const method = editingItem ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formValues),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(editingItem ? 'Номенклатура успешно обновлена' : 'Номенклатура успешно создана');
        setIsModalOpen(false);
        fetchProfnastil();
      } else {
        if (Array.isArray(data.error)) {
          const errorMessages = data.error.map((err: any) => {
            const field = err.path?.join('.') || 'field';
            return `${field}: ${err.message}`;
          }).join(', ');
          toast.error(`Ошибка валидации: ${errorMessages}`);
        } else {
          toast.error(data.error || 'Ошибка сохранения');
        }
      }
    } catch (error) {
      console.error('Exception:', error);
      toast.error('Ошибка сохранения');
    }
  };

  const isAdmin = currentUser?.role === 'ADMIN';

  const calculatedPurchasePricePerUnit = formValues.usefulWidth && formValues.length && formValues.purchasePricePerMeter
    ? calculatePricePerUnit(formValues.usefulWidth, formValues.length, formValues.purchasePricePerMeter)
    : null;

  const calculatedRetailPricePerUnit = formValues.usefulWidth && formValues.length && formValues.retailPricePerMeter
    ? calculatePricePerUnit(formValues.usefulWidth, formValues.length, formValues.retailPricePerMeter)
    : null;

  const marginInfo = formValues.usefulWidth && formValues.length && formValues.retailPricePerMeter
    ? calculateProfnastilMargin(
        formValues.retailPricePerMeter,
        formValues.purchasePricePerMeter,
        formValues.usefulWidth,
        formValues.length
      )
    : null;

  const columns = [
    { key: 'name', label: 'Название' },
    { 
      key: 'metalThickness', 
      label: 'Толщина (мм)', 
      render: (item: ProfnastilType) => formatDimension(item.metalThickness)
    },
    { 
      key: 'usefulWidth', 
      label: 'Ширина (мм)', 
      render: (item: ProfnastilType) => formatDimension(item.usefulWidth)
    },
    { 
      key: 'length', 
      label: 'Высота (мм)', 
      render: (item: ProfnastilType) => Math.round(item.length)
    },
    { key: 'coating', label: 'Покрытие' },
    { key: 'color', label: 'Цвет', render: (item: ProfnastilType) => item.color || '-' },
    {
      key: 'retailPricePerUnit',
      label: 'Розница за ед. (₽)',
      render: (item: ProfnastilType) => {
        const price = item.retailPricePerUnit ?? calculatePricePerUnit(item.usefulWidth, item.length, item.retailPricePerMeter);
        return price !== null ? formatPrice(price) : '-';
      }
    },
    {
      key: 'validUntil',
      label: 'Срок действия',
      render: (item: ProfnastilType) => {
        const isExpired = item.validUntil && new Date(item.validUntil) < new Date();
        const isExpiringSoon = item.validUntil && !isExpired && 
          new Date(item.validUntil) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        return (
          <span className={
            isExpired ? 'text-red-500' : 
            isExpiringSoon ? 'text-yellow-600' : 
            !item.validUntil ? 'text-gray-400' : ''
          }>
            {formatDate(item.validUntil)}
          </span>
        );
      },
    },
    ...(isAdmin ? [{
      key: 'purchasePricePerUnit' as const,
      label: 'Закупка за ед. (₽)',
      render: (item: ProfnastilType) => {
        const price = item.purchasePricePerUnit ?? calculatePricePerUnit(item.usefulWidth, item.length, item.purchasePricePerMeter);
        if (price === null) {
          return <span className="text-gray-400">Не указана</span>;
        }
        const margin = calculateMargin(item.retailPricePerMeter, item.purchasePricePerMeter);
        const marginEmoji = getMarginEmoji(margin?.marginPercent ?? null);
        return (
          <span title={`Цена закупки: ${price} ₽\nМаржа: ${margin?.marginPercent.toFixed(1)}%`}>
            {formatPrice(price)} {marginEmoji}
          </span>
        );
      }
    }] : []),
    { 
      key: 'active', 
      label: 'Активен',
      render: (item: ProfnastilType) => (
        <button
          onClick={() => handleToggleActive(item)}
          className="cursor-pointer hover:scale-110 transition-transform duration-200 inline-flex items-center justify-center min-h-[44px] min-w-[44px]"
          title="Нажмите, чтобы изменить статус"
        >
          {item.active ? (
            <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          )}
        </button>
      )
    },
  ];

  const filterOptions = [
    { value: 'all', label: 'Все' },
    { value: 'active', label: 'Активные' },
    { value: 'expired', label: 'Истек срок' },
    { value: 'expiring_soon', label: 'Истекает скоро (7 дней)' },
  ];

  const coatingFilterOptions = [
    { value: 'all', label: 'Все покрытия' },
    ...COATING_TYPES.map((c) => ({ value: c, label: c })),
  ];

  return (
    <div className="container mx-auto py-8">
      <div className="mb-4 flex gap-4 items-center">
        <select
          value={validityFilter}
          onChange={(e) => setValidityFilter(e.target.value as any)}
          className="border rounded px-3 py-2"
        >
          {filterOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <select
          value={coatingFilter}
          onChange={(e) => setCoatingFilter(e.target.value)}
          className="border rounded px-3 py-2"
        >
          {coatingFilterOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <DataTable
        title="Профнастил"
        columns={columns}
        data={profnastil}
        total={total}
        page={page}
        pageSize={pageSize}
        searchPlaceholder="Поиск по названию, цвету, покрытию..."
        onSearch={setSearch}
        onPageChange={setPage}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleActive={handleToggleActive}
        isLoading={isLoading}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Редактировать номенклатуру' : 'Создать номенклатуру'}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium mb-1">Название *</label>
            <input
              type="text"
              value={formValues.name || ''}
              onChange={(e) => handleFormChange('name', e.target.value)}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Описание</label>
            <textarea
              value={formValues.description || ''}
              onChange={(e) => handleFormChange('description', e.target.value)}
              className="w-full border rounded px-3 py-2"
              rows={2}
            />
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Характеристики</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Толщина металла (мм) *</label>
                <input
                  type="number"
                  value={formValues.metalThickness || ''}
                  onChange={(e) => handleFormChange('metalThickness', parseFloat(e.target.value))}
                  className="w-full border rounded px-3 py-2"
                  min={0.3}
                  max={1.5}
                  step={0.05}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Полная ширина (мм) *</label>
                <input
                  type="number"
                  value={formValues.fullWidth || ''}
                  onChange={(e) => handleFormChange('fullWidth', parseInt(e.target.value))}
                  className="w-full border rounded px-3 py-2"
                  min={500}
                  max={1500}
                  step={1}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Полезная ширина (мм) *</label>
                <input
                  type="number"
                  value={formValues.usefulWidth || ''}
                  onChange={(e) => handleFormChange('usefulWidth', parseInt(e.target.value))}
                  className="w-full border rounded px-3 py-2"
                  min={400}
                  max={1400}
                  step={1}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Высота (мм) *</label>
                <input
                  type="number"
                  value={formValues.length || ''}
                  onChange={(e) => handleFormChange('length', parseInt(e.target.value))}
                  className="w-full border rounded px-3 py-2"
                  min={500}
                  max={12000}
                  step={1}
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Покрытие *</label>
              <select
                value={formValues.coating || ''}
                onChange={(e) => handleFormChange('coating', e.target.value)}
                className="w-full border rounded px-3 py-2"
                required
              >
                <option value="" disabled>Выберите покрытие...</option>
                {COATING_TYPES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Цвет</label>
              <input
                type="text"
                value={formValues.color || ''}
                onChange={(e) => handleFormChange('color', e.target.value)}
                className="w-full border rounded px-3 py-2"
                placeholder="Например: RAL 8017"
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Цены</h4>
            
            {isAdmin && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Цена за м.п. закупка (₽)</label>
                <input
                  type="number"
                  value={formValues.purchasePricePerMeter ?? ''}
                  onChange={(e) => handleFormChange('purchasePricePerMeter', e.target.value ? parseFloat(e.target.value) : null)}
                  className="w-full border rounded px-3 py-2"
                  min={0}
                  step={0.01}
                />
                <div className="text-sm text-gray-500 mt-1">
                  ↳ Цена закупки за ед.: {calculatedPurchasePricePerUnit !== null ? `${formatPrice(calculatedPurchasePricePerUnit)} ₽` : 'Не указана'}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">Розничная стоимость за м.п. (₽) *</label>
              <input
                type="number"
                value={formValues.retailPricePerMeter || ''}
                onChange={(e) => handleFormChange('retailPricePerMeter', parseFloat(e.target.value))}
                className="w-full border rounded px-3 py-2"
                min={0}
                step={0.01}
                required
              />
              <div className="text-sm text-gray-500 mt-1">
                ↳ Розничная стоимость за ед.: {calculatedRetailPricePerUnit !== null ? `${formatPrice(calculatedRetailPricePerUnit)} ₽` : '-'}
              </div>
            </div>

            {isAdmin && marginInfo && marginInfo.marginPerMeterPercent !== null && (
              <div className="mt-4 p-4 bg-gray-50 rounded border">
                <h5 className="font-medium mb-2">Расчет маржи</h5>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600">За метр погонный:</span>
                    <div className="ml-4">
                      Маржа: {marginInfo.marginPerMeterPercent.toFixed(1)}% {getMarginEmoji(marginInfo.marginPerMeterPercent)}
                      <span className="ml-2 text-gray-500">
                        ({marginInfo.marginPerMeterAbsolute?.toFixed(2)} ₽/м.п.)
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">За единицу (лист):</span>
                    <div className="ml-4">
                      Маржа: {marginInfo.marginPerUnitPercent?.toFixed(1)}% {getMarginEmoji(marginInfo.marginPerUnitPercent)}
                      <span className="ml-2 text-gray-500">
                        ({marginInfo.marginPerUnitAbsolute?.toFixed(2)} ₽/лист)
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 mt-2">
                    🟢 Маржа ≥ 30% | 🟡 10-30% | 🔴 &lt; 10% | ⚪ Не указана
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Сроки действия</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Дата начала действия</label>
                <input
                  type="date"
                  value={formValues.validFrom ? new Date(formValues.validFrom).toISOString().split('T')[0] : ''}
                  onChange={(e) => handleFormChange('validFrom', e.target.value ? new Date(e.target.value) : null)}
                  className="w-full border rounded px-3 py-2"
                />
                <p className="text-xs text-gray-500 mt-1">Пусто = с момента добавления</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Срок действия</label>
                <input
                  type="date"
                  value={formValues.validUntil ? new Date(formValues.validUntil).toISOString().split('T')[0] : ''}
                  onChange={(e) => handleFormChange('validUntil', e.target.value ? new Date(e.target.value) : null)}
                  className="w-full border rounded px-3 py-2"
                />
                <p className="text-xs text-gray-500 mt-1">Пусто = бессрочно</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="active"
              checked={formValues.active ?? true}
              onChange={(e) => handleFormChange('active', e.target.checked)}
              className="rounded"
            />
            <label htmlFor="active" className="text-sm font-medium">Активен</label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Отмена
            </Button>
            <Button type="submit">
              {editingItem ? 'Обновить' : 'Создать'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
