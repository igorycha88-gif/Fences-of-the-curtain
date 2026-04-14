'use client';

import { useState, useEffect, useCallback } from 'react';
import { DataTable } from '@/components/admin/References/DataTable';
import { Modal } from '@/components/ui/modal';
import { SimplifiedPurchasePriceInput } from '@/components/admin/References/SimplifiedPurchasePriceInput';
import { calculateMargin, getMarginEmoji } from '@/lib/utils/marginCalculator';
import { formatDimension, formatPrice, formatSection } from '@/lib/utils/formatters';
import { ColumnHeaderWithTooltip } from '@/components/admin/References/ColumnHeaderWithTooltip';
import { PriorityColumn } from '@/components/admin/References/shared';
import { calculateSectionProperties } from '@/lib/sectionCalculator';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';

interface ProfileItem {
  id: string;
  name: string;
  description: string | null;
  sectionWidth: number;
  sectionHeight: number;
  wallThickness: number;
  length: number;
  steelGrade: string;
  yieldStrength: number;
  sectionArea: number;
  momentOfInertiaX: number;
  momentOfInertiaY: number;
  sectionModulusX: number;
  sectionModulusY: number;
  radiusOfGyrationX: number;
  radiusOfGyrationY: number;
  weightPerMeter: number;
  retailPricePerMeter: number;
  purchasePricePerMeter: number | null;
  retailPricePerUnit: number;
  purchasePricePerUnit: number | null;
  image: string | null;
  active: boolean;
  validFrom: string | null;
  expirationDate: string | null;
  priority: number;
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
  return new Date(date).toLocaleDateString('ru-RU');
};

const formatValidFrom = (date: string | Date | null): string => {
  if (!date) return 'С момента добавления';
  return new Date(date).toLocaleDateString('ru-RU');
};

interface TrussProfilePageProps {
  title: string;
  category: 'POST' | 'CROSSBEAM' | 'STRUT' | 'ARCH';
  itemName: string;
  defaultValues?: Partial<ProfileItem>;
}

export function useTrussProfilePage({ title, category, itemName, defaultValues }: TrussProfilePageProps) {
  const [items, setItems] = useState<ProfileItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [validityFilter, setValidityFilter] = useState<'all' | 'active' | 'expired' | 'expiring_soon'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ProfileItem | null>(null);
  const [formValues, setFormValues] = useState<Partial<ProfileItem> & { confirmDuplicate?: boolean }>({});
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<any>(null);
  const [showEngineering, setShowEngineering] = useState(false);
  const [engineeringOverride, setEngineeringOverride] = useState(false);

  const pageSize = 20;
  const apiBase = '/api/admin/truss-profiles';
  const isAdmin = currentUser?.role === 'ADMIN';

  useEffect(() => {
    fetch('/api/auth/session', { credentials: 'include' })
      .then(res => res.json())
      .then(data => { if (data.user) setCurrentUser(data.user); })
      .catch(console.error);
  }, []);

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        category,
        page: page.toString(),
        pageSize: pageSize.toString(),
        validityFilter,
        active: 'all',
        ...(search && { search }),
      });
      const res = await fetch(`${apiBase}?${params}`, { credentials: 'include' });
      const data = await res.json();
      if (res.ok) {
        const profiles = (data.profiles || []).map((p: any) => ({ ...p, active: p.isActive }));
        setItems(profiles);
        setTotal(data.total || 0);
      } else {
        setItems([]);
        setTotal(0);
      }
    } catch {
      setItems([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [category, page, search, validityFilter]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const autoCalc = useCallback((sw: number, sh: number, wt: number) => {
    if (!engineeringOverride && sw > 0 && sh > 0 && wt > 0) {
      const props = calculateSectionProperties(sw, sh, wt);
      setFormValues(prev => ({
        ...prev,
        sectionArea: props.sectionArea,
        momentOfInertiaX: props.momentOfInertiaX,
        momentOfInertiaY: props.momentOfInertiaY,
        sectionModulusX: props.sectionModulusX,
        sectionModulusY: props.sectionModulusY,
        radiusOfGyrationX: props.radiusOfGyrationX,
        radiusOfGyrationY: props.radiusOfGyrationY,
        weightPerMeter: props.weightPerMeter,
        retailPricePerMeter: prev.length ? Math.round((prev.retailPricePerUnit || 0) / prev.length * 100) / 100 : 0,
      }));
    }
  }, [engineeringOverride]);

  const handleAdd = () => {
    setEditingItem(null);
    setDuplicateWarning(null);
    setEngineeringOverride(false);
    setShowEngineering(false);
    setFormValues({
      name: '',
      description: '',
      sectionWidth: defaultValues?.sectionWidth ?? 60,
      sectionHeight: defaultValues?.sectionHeight ?? 60,
      wallThickness: defaultValues?.wallThickness ?? 2.5,
      length: defaultValues?.length ?? 6.0,
      retailPricePerUnit: defaultValues?.retailPricePerUnit ?? 0,
      purchasePricePerUnit: null,
      retailPricePerMeter: 0,
      purchasePricePerMeter: null,
      sectionArea: 0,
      momentOfInertiaX: 0,
      momentOfInertiaY: 0,
      sectionModulusX: 0,
      sectionModulusY: 0,
      radiusOfGyrationX: 0,
      radiusOfGyrationY: 0,
      weightPerMeter: 0,
      steelGrade: 'S235',
      yieldStrength: 235,
      active: true,
      validFrom: null,
      expirationDate: null,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (item: ProfileItem) => {
    setEditingItem(item);
    setDuplicateWarning(null);
    setEngineeringOverride(true);
    setShowEngineering(false);
    setFormValues({ ...item });
    setIsModalOpen(true);
  };

  const handleDelete = async (item: ProfileItem) => {
    if (!confirm(`Удалить "${item.name}"?`)) return;
    try {
      const res = await fetch(`${apiBase}/${item.id}`, {
        method: 'DELETE', credentials: 'include',
      });
      if (res.ok) { toast.success(`${itemName} успешно удален`); fetchItems(); }
      else { const d = await res.json(); toast.error(d.error || 'Ошибка удаления'); }
    } catch { toast.error('Ошибка удаления'); }
  };

  const handleToggleActive = async (item: ProfileItem) => {
    try {
      const res = await fetch(`${apiBase}/${item.id}`, {
        method: 'PATCH', credentials: 'include',
      });
      if (res.ok) { toast.success('Статус изменен'); fetchItems(); }
      else { const d = await res.json(); toast.error(d.error || 'Ошибка'); }
    } catch { toast.error('Ошибка'); }
  };

  const handlePriorityChange = async (id: string, newPriority: number) => {
    const res = await fetch(`${apiBase}/reorder`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, newPriority }),
      credentials: 'include',
    });
    if (!res.ok) {
      const d = await res.json();
      throw new Error(d.error || 'Ошибка');
    }
    fetchItems();
  };

  const handleFormChange = (name: string, value: any) => {
    setFormValues(prev => ({ ...prev, [name]: value }));
    if (['sectionWidth', 'sectionHeight', 'wallThickness'].includes(name)) {
      const sw = name === 'sectionWidth' ? value : formValues.sectionWidth;
      const sh = name === 'sectionHeight' ? value : formValues.sectionHeight;
      const wt = name === 'wallThickness' ? value : formValues.wallThickness;
      autoCalc(sw, sh, wt);
    }
    if (name === 'length' || name === 'retailPricePerUnit') {
      const len = name === 'length' ? value : formValues.length;
      const price = name === 'retailPricePerUnit' ? value : formValues.retailPricePerUnit;
      if (len && price) {
        setFormValues(prev => ({
          ...prev,
          [name]: value,
          retailPricePerMeter: Math.round(price / len * 100) / 100,
        }));
      }
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingItem ? `${apiBase}/${editingItem.id}` : apiBase;
      const method = editingItem ? 'PUT' : 'POST';
      const body = {
        ...formValues,
        category,
        isActive: formValues.active,
        active: undefined,
        confirmDuplicate: undefined,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'include',
      });
      const data = await res.json();

      if (res.ok) {
        if (data.warning) {
          setDuplicateWarning(data.warning);
          return;
        }
        toast.success(editingItem ? `${itemName} успешно обновлен` : `${itemName} успешно создан`);
        setIsModalOpen(false);
        fetchItems();
      } else {
        if (Array.isArray(data.error)) {
          const msgs = data.error.map((err: any) => `${err.path?.join('.') || ''}: ${err.message}`).join(', ');
          toast.error(`Ошибка валидации: ${msgs}`);
        } else {
          toast.error(data.error || 'Ошибка сохранения');
        }
      }
    } catch {
      toast.error('Ошибка сохранения');
    }
  };

  const handleConfirmDuplicate = () => {
    if (duplicateWarning?.duplicates?.[0]) {
      setFormValues(prev => ({
        ...prev,
        confirmDuplicate: true,
      }));
      setDuplicateWarning(null);
    }
  };

  const columns = [
    { key: 'name', label: 'Название' },
    {
      key: 'section',
      label: <ColumnHeaderWithTooltip title="Сечение (мм)" tooltip="Размеры сечения профиля (ширина × высота)" />,
      render: (item: ProfileItem) => <span>{formatSection(item.sectionWidth, item.sectionHeight)} мм</span>,
    },
    {
      key: 'wallThickness',
      label: <ColumnHeaderWithTooltip title="Толщина (мм)" tooltip="Толщина стенки профиля" />,
      render: (item: ProfileItem) => formatDimension(item.wallThickness),
    },
    {
      key: 'length',
      label: 'Длина (мм)',
      render: (item: ProfileItem) => Math.round(item.length * 1000),
    },
    {
      key: 'weightPerMeter',
      label: 'Вес (кг/м)',
      render: (item: ProfileItem) => formatDimension(item.weightPerMeter),
    },
    {
      key: 'retailPricePerUnit',
      label: 'Розничная цена за ед. (₽)',
      render: (item: ProfileItem) => formatPrice(item.retailPricePerUnit),
    },
    {
      key: 'validFrom',
      label: 'Дата начала',
      render: (item: ProfileItem) => (
        <span className={item.validFrom ? '' : 'text-gray-400'}>{formatValidFrom(item.validFrom)}</span>
      ),
    },
    {
      key: 'expirationDate',
      label: 'Срок действия',
      render: (item: ProfileItem) => {
        const isExpired = item.expirationDate && new Date(item.expirationDate) < new Date();
        const isExpiringSoon = item.expirationDate && !isExpired &&
          new Date(item.expirationDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        return (
          <span className={
            isExpired ? 'text-red-500' :
            isExpiringSoon ? 'text-yellow-600' :
            !item.expirationDate ? 'text-gray-400' : ''
          }>
            {formatDate(item.expirationDate)}
          </span>
        );
      },
    },
    ...(isAdmin ? [{
      key: 'purchasePricePerUnit',
      label: 'Закупка за ед. (₽)',
      render: (item: ProfileItem) => {
        const margin = calculateMargin(item.retailPricePerUnit, item.purchasePricePerUnit);
        const emoji = getMarginEmoji(margin?.marginPercent ?? null);
        const text = item.purchasePricePerUnit
          ? `${formatPrice(item.purchasePricePerUnit)} ${emoji}`
          : `Не указана ${emoji}`;
        return (
          <span className="cursor-help"
            title={margin ? `Маржа: ${margin.marginPercent.toFixed(1)}% (${margin.marginAbsolute.toFixed(2)} ₽)` : 'Не указана'}
          >
            {text}
          </span>
        );
      },
    }] : []),
    {
      key: 'priority',
      label: 'Приоритет',
      render: (item: ProfileItem) => (
        <PriorityColumn
          value={item.priority}
          totalItems={total}
          onChange={async (p) => { await handlePriorityChange(item.id, p); toast.success('Приоритет обновлён'); }}
        />
      ),
    },
  ];

  const filterOptions = [
    { value: 'all', label: 'Все' },
    { value: 'active', label: 'Активные' },
    { value: 'expired', label: 'Истек срок' },
    { value: 'expiring_soon', label: 'Истекает скоро (7 дней)' },
  ];

  const renderForm = () => {
    if (duplicateWarning) {
      return (
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
            <h3 className="font-semibold text-yellow-800 mb-2">Профиль с такими параметрами уже существует</h3>
            {duplicateWarning.duplicates?.map((dup: any) => (
              <div key={dup.id} className="bg-white p-3 rounded mb-2 text-sm">
                <div className="font-medium">{dup.name || 'Без названия'}</div>
                <div>Цена: {dup.retailPricePerUnit} ₽</div>
                <div>Период: {formatValidFrom(dup.validFrom)} - {formatDate(dup.expirationDate)}</div>
                <div>Статус: {dup.active ? 'Активен' : 'Неактивен'}</div>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setDuplicateWarning(null); setIsModalOpen(false); }}>Отмена</Button>
            <Button onClick={handleConfirmDuplicate}>Всё равно создать</Button>
          </div>
        </div>
      );
    }

    return (
      <form onSubmit={handleFormSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Название *</label>
          <input type="text" value={formValues.name || ''} onChange={e => handleFormChange('name', e.target.value)}
            className="w-full border rounded px-3 py-2" required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Описание</label>
          <textarea value={formValues.description || ''} onChange={e => handleFormChange('description', e.target.value)}
            className="w-full border rounded px-3 py-2" rows={2} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Ширина сечения (мм) *</label>
            <input type="number" value={formValues.sectionWidth || ''} onChange={e => handleFormChange('sectionWidth', parseFloat(e.target.value))}
              className="w-full border rounded px-3 py-2" min={20} max={200} step={1} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Высота сечения (мм) *</label>
            <input type="number" value={formValues.sectionHeight || ''} onChange={e => handleFormChange('sectionHeight', parseFloat(e.target.value))}
              className="w-full border rounded px-3 py-2" min={20} max={200} step={1} required />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Толщина стенки (мм) *</label>
            <input type="number" value={formValues.wallThickness || ''} onChange={e => handleFormChange('wallThickness', parseFloat(e.target.value))}
              className="w-full border rounded px-3 py-2" min={1} max={10} step={0.1} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Длина (мм) *</label>
            <input type="number" value={formValues.length ? Math.round(formValues.length * 1000) : ''}
              onChange={e => handleFormChange('length', parseFloat(e.target.value) / 1000)}
              className="w-full border rounded px-3 py-2" min={1000} max={12000} step={100} required />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Розничная стоимость за ед. (₽) *</label>
          <input type="number" value={formValues.retailPricePerUnit || ''} onChange={e => handleFormChange('retailPricePerUnit', parseFloat(e.target.value))}
            className="w-full border rounded px-3 py-2" min={0} step={0.01} required />
        </div>

        <button type="button" onClick={() => setShowEngineering(!showEngineering)}
          className="text-sm text-blue-600 hover:underline flex items-center gap-1">
          {showEngineering ? '▼' : '▶'} Расчётные характеристики (автоматически)
        </button>

        {showEngineering && (
          <div className="border rounded-lg p-4 bg-gray-50 space-y-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500">
                Автоматически рассчитываются из размеров сечения по ГОСТ 30245-2012
              </span>
              <label className="flex items-center gap-2 text-xs">
                <input type="checkbox" checked={engineeringOverride}
                  onChange={e => setEngineeringOverride(e.target.checked)} className="rounded" />
                Ручной ввод
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'sectionArea', label: 'Площадь сечения (см²)' },
                { key: 'weightPerMeter', label: 'Вес (кг/м)' },
                { key: 'momentOfInertiaX', label: 'Момент инерции X (см⁴)' },
                { key: 'momentOfInertiaY', label: 'Момент инерции Y (см⁴)' },
                { key: 'sectionModulusX', label: 'Момент сопротивления X (см³)' },
                { key: 'sectionModulusY', label: 'Момент сопротивления Y (см³)' },
                { key: 'radiusOfGyrationX', label: 'Радиус инерции X (см)' },
                { key: 'radiusOfGyrationY', label: 'Радиус инерции Y (см)' },
                { key: 'retailPricePerMeter', label: 'Цена за метр (₽)' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-xs font-medium mb-1 text-gray-600">{label}</label>
                  <input type="number" step="any"
                    value={(formValues as any)[key] ?? 0}
                    onChange={e => handleFormChange(key, parseFloat(e.target.value) || 0)}
                    className="w-full border rounded px-2 py-1 text-sm"
                    readOnly={!engineeringOverride}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="border-t pt-4">
          <h4 className="font-medium mb-3">Период действия (опционально)</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Дата начала действия</label>
              <input type="date"
                value={formValues.validFrom ? new Date(formValues.validFrom).toISOString().split('T')[0] : ''}
                onChange={e => handleFormChange('validFrom', e.target.value || null)}
                className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Срок действия</label>
              <input type="date"
                value={formValues.expirationDate ? new Date(formValues.expirationDate).toISOString().split('T')[0] : ''}
                onChange={e => handleFormChange('expirationDate', e.target.value || null)}
                className="w-full border rounded px-3 py-2" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input type="checkbox" id="active" checked={formValues.active ?? true}
            onChange={e => handleFormChange('active', e.target.checked)} className="rounded" />
          <label htmlFor="active" className="text-sm font-medium">Активен</label>
        </div>

        {isAdmin && (
          <SimplifiedPurchasePriceInput
            purchasePrice={formValues.purchasePricePerUnit ?? null}
            retailPrice={formValues.retailPricePerUnit || 0}
            onChange={v => setFormValues(prev => ({ ...prev, purchasePricePerUnit: v }))}
          />
        )}

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Отмена</Button>
          <Button type="submit">{editingItem ? 'Обновить' : 'Создать'}</Button>
        </div>
      </form>
    );
  };

  return {
    items, total, page, search, validityFilter, isLoading, isModalOpen, currentUser,
    columns, filterOptions, renderForm, duplicateWarning, editingItem,
    setPage, setSearch, setValidityFilter,
    handleAdd, handleEdit, handleDelete, handleToggleActive,
    setIsModalOpen: (v: boolean) => { setIsModalOpen(v); if (!v) setDuplicateWarning(null); },
    title, pageSize, itemName,
  };
}
