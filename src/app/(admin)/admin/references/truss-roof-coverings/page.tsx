'use client';

import { useState, useEffect, useCallback } from 'react';
import { DataTable } from '@/components/admin/References/DataTable';
import { Modal } from '@/components/ui/modal';
import { SimplifiedPurchasePriceInput } from '@/components/admin/References/SimplifiedPurchasePriceInput';
import { calculateMargin, getMarginEmoji } from '@/lib/utils/marginCalculator';
import { formatPrice, formatDimension } from '@/lib/utils/formatters';
import { ColumnHeaderWithTooltip } from '@/components/admin/References/ColumnHeaderWithTooltip';
import { PriorityColumn } from '@/components/admin/References/shared';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';

interface CoveringItem {
  id: string;
  name: string;
  description: string | null;
  weightPerSqm: number;
  thickness: number | null;
  width: number | null;
  usefulWidth: number | null;
  standardLength: number | null;
  coating: string | null;
  coatingType: string | null;
  color: string | null;
  retailPricePerSqm: number;
  purchasePricePerSqm: number | null;
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

const COATING_TYPES = [
  { value: '', label: 'Не указан' },
  { value: 'metal_tile', label: 'Металлочерепица' },
  { value: 'polycarbonate', label: 'Поликарбонат' },
  { value: 'profnastil', label: 'Профнастил' },
];

const formatDate = (date: string | Date | null): string => {
  if (!date) return 'Бессрочно';
  return new Date(date).toLocaleDateString('ru-RU');
};

const formatValidFrom = (date: string | Date | null): string => {
  if (!date) return 'С момента добавления';
  return new Date(date).toLocaleDateString('ru-RU');
};

const coatingTypeLabel = (v: string | null) => {
  if (!v) return '';
  const found = COATING_TYPES.find(c => c.value === v);
  return found ? found.label : v;
};

export default function TrussRoofCoveringsPage() {
  const [items, setItems] = useState<CoveringItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [validityFilter, setValidityFilter] = useState<'all' | 'active' | 'expired' | 'expiring_soon'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CoveringItem | null>(null);
  const [formValues, setFormValues] = useState<Partial<CoveringItem>>({});
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);

  const pageSize = 20;
  const apiBase = '/api/admin/truss-roof-coverings';
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
        page: page.toString(),
        pageSize: pageSize.toString(),
        validityFilter,
        active: 'all',
        ...(search && { search }),
      });
      const res = await fetch(`${apiBase}?${params}`, { credentials: 'include' });
      const data = await res.json();
      if (res.ok) {
        const coverings = (data.coverings || []).map((c: any) => ({ ...c, active: c.isActive }));
        setItems(coverings);
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
  }, [page, search, validityFilter]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleAdd = () => {
    setEditingItem(null);
    setFormValues({
      name: '', description: '',
      weightPerSqm: 5, thickness: null, width: null, usefulWidth: null,
      standardLength: null, coating: '', coatingType: '', color: '',
      retailPricePerSqm: 0, purchasePricePerSqm: null,
      active: true, validFrom: null, expirationDate: null,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (item: CoveringItem) => {
    setEditingItem(item);
    setFormValues({ ...item });
    setIsModalOpen(true);
  };

  const handleDelete = async (item: CoveringItem) => {
    if (!confirm(`Удалить "${item.name}"?`)) return;
    try {
      const res = await fetch(`${apiBase}/${item.id}`, {
        method: 'DELETE', credentials: 'include',
      });
      if (res.ok) { toast.success('Покрытие удалено'); fetchItems(); }
      else { const d = await res.json(); toast.error(d.error || 'Ошибка'); }
    } catch { toast.error('Ошибка'); }
  };

  const handleToggleActive = async (item: CoveringItem) => {
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
    if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Ошибка'); }
    fetchItems();
  };

  const handleFormChange = (name: string, value: any) => {
    setFormValues(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingItem ? `${apiBase}/${editingItem.id}` : apiBase;
      const method = editingItem ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formValues, isActive: formValues.active, active: undefined }),
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(editingItem ? 'Покрытие обновлено' : 'Покрытие создано');
        setIsModalOpen(false);
        fetchItems();
      } else {
        if (Array.isArray(data.error)) {
          const msgs = data.error.map((err: any) => `${err.path?.join('.') || ''}: ${err.message}`).join(', ');
          toast.error(`Ошибка: ${msgs}`);
        } else {
          toast.error(data.error || 'Ошибка');
        }
      }
    } catch { toast.error('Ошибка сохранения'); }
  };

  const columns = [
    { key: 'name', label: 'Название' },
    {
      key: 'coatingType',
      label: 'Тип',
      render: (item: CoveringItem) => coatingTypeLabel(item.coatingType),
    },
    {
      key: 'weightPerSqm',
      label: <ColumnHeaderWithTooltip title="Вес (кг/м²)" tooltip="Вес покрытия на квадратный метр" />,
      render: (item: CoveringItem) => formatDimension(item.weightPerSqm),
    },
    {
      key: 'thickness',
      label: 'Толщина',
      render: (item: CoveringItem) => item.thickness ? `${item.thickness} мм` : '-',
    },
    {
      key: 'retailPricePerSqm',
      label: 'Розничная цена за м² (₽)',
      render: (item: CoveringItem) => formatPrice(item.retailPricePerSqm),
    },
    {
      key: 'validFrom',
      label: 'Дата начала',
      render: (item: CoveringItem) => (
        <span className={item.validFrom ? '' : 'text-gray-400'}>{formatValidFrom(item.validFrom)}</span>
      ),
    },
    {
      key: 'expirationDate',
      label: 'Срок действия',
      render: (item: CoveringItem) => {
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
      key: 'purchasePricePerSqm',
      label: 'Закупка за м² (₽)',
      render: (item: CoveringItem) => {
        const margin = calculateMargin(item.retailPricePerSqm, item.purchasePricePerSqm);
        const emoji = getMarginEmoji(margin?.marginPercent ?? null);
        const text = item.purchasePricePerSqm
          ? `${formatPrice(item.purchasePricePerSqm)} ${emoji}`
          : `Не указана ${emoji}`;
        return (
          <span className="cursor-help"
            title={margin ? `Маржа: ${margin.marginPercent.toFixed(1)}%` : 'Не указана'}
          >{text}</span>
        );
      },
    }] : []),
    {
      key: 'priority',
      label: 'Приоритет',
      render: (item: CoveringItem) => (
        <PriorityColumn value={item.priority} totalItems={total}
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

  return (
    <div className="container mx-auto py-8">
      <div className="mb-4 flex gap-4 items-center">
        <select value={validityFilter} onChange={e => setValidityFilter(e.target.value as any)}
          className="border rounded px-3 py-2">
          {filterOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <DataTable
        title="Покрытие крыши (фермы)" columns={columns} data={items} total={total}
        page={page} pageSize={pageSize} searchPlaceholder="Поиск по названию..."
        onSearch={setSearch} onPageChange={setPage} onAdd={handleAdd} onEdit={handleEdit}
        onDelete={handleDelete} onToggleActive={handleToggleActive} isLoading={isLoading}
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Редактировать покрытие' : 'Создать покрытие'}>
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
              <label className="block text-sm font-medium mb-1">Тип покрытия *</label>
              <select value={formValues.coatingType || ''} onChange={e => handleFormChange('coatingType', e.target.value)}
                className="w-full border rounded px-3 py-2">
                {COATING_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Вес (кг/м²) *</label>
              <input type="number" value={formValues.weightPerSqm || ''} onChange={e => handleFormChange('weightPerSqm', parseFloat(e.target.value))}
                className="w-full border rounded px-3 py-2" min={0} step={0.1} required />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Толщина (мм)</label>
              <input type="number" value={formValues.thickness || ''} onChange={e => handleFormChange('thickness', e.target.value ? parseFloat(e.target.value) : null)}
                className="w-full border rounded px-3 py-2" min={0} step={0.1} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Ширина (мм)</label>
              <input type="number" value={formValues.width || ''} onChange={e => handleFormChange('width', e.target.value ? parseFloat(e.target.value) : null)}
                className="w-full border rounded px-3 py-2" min={0} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Полезная ширина (мм)</label>
              <input type="number" value={formValues.usefulWidth || ''} onChange={e => handleFormChange('usefulWidth', e.target.value ? parseFloat(e.target.value) : null)}
                className="w-full border rounded px-3 py-2" min={0} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Длина (мм)</label>
              <input type="number" value={formValues.standardLength || ''} onChange={e => handleFormChange('standardLength', e.target.value ? parseFloat(e.target.value) : null)}
                className="w-full border rounded px-3 py-2" min={0} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Покрытие/марка</label>
              <input type="text" value={formValues.coating || ''} onChange={e => handleFormChange('coating', e.target.value)}
                className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Цвет</label>
              <input type="text" value={formValues.color || ''} onChange={e => handleFormChange('color', e.target.value)}
                className="w-full border rounded px-3 py-2" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Розничная цена за м² (₽) *</label>
            <input type="number" value={formValues.retailPricePerSqm || ''} onChange={e => handleFormChange('retailPricePerSqm', parseFloat(e.target.value))}
              className="w-full border rounded px-3 py-2" min={0} step={0.01} required />
          </div>
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
              purchasePrice={formValues.purchasePricePerSqm ?? null}
              retailPrice={formValues.retailPricePerSqm || 0}
              onChange={v => setFormValues(prev => ({ ...prev, purchasePricePerSqm: v }))}
            />
          )}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Отмена</Button>
            <Button type="submit">{editingItem ? 'Обновить' : 'Создать'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
