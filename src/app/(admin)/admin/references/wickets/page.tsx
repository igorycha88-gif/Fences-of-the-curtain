'use client';

import { useState, useEffect } from 'react';
import { DataTable } from '@/components/admin/References/DataTable';
import { Modal } from '@/components/ui/modal';
import { SimplifiedPurchasePriceInput } from '@/components/admin/References/SimplifiedPurchasePriceInput';
import { calculateMargin, getMarginEmoji } from '@/lib/utils/marginCalculator';
import { formatDimension, formatPrice, formatSection } from '@/lib/utils/formatters';
import { WICKETS_COLUMN_TOOLTIPS } from '@/lib/constants/columnTooltips';
import { ColumnHeaderWithTooltip } from '@/components/admin/References/ColumnHeaderWithTooltip';
import { PriorityColumn } from '@/components/admin/References/shared';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { RelatedMountingHardware } from '@/components/admin/References/RelatedMountingHardware';
import { RelatedWorks } from '@/components/admin/Works/RelatedWorks';
import { RelatedWorksByReference } from '@/components/admin/Works/RelatedWorksByReference';

interface WicketType {
  id: string;
  name: string;
  description: string | null;
  metalThickness: number;
  sectionWidth: number;
  sectionHeight: number;
  wicketHeight: number;
  wicketLength: number;
  retailPrice: number;
  purchasePrice: number | null;
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
  const d = new Date(date);
  return d.toLocaleDateString('ru-RU');
};

export default function WicketsPage() {
  const [wickets, setWickets] = useState<WicketType[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [validityFilter, setValidityFilter] = useState<'all' | 'active' | 'expired' | 'expiring_soon'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWicket, setEditingWicket] = useState<WicketType | null>(null);
  const [formValues, setFormValues] = useState<Partial<WicketType>>({});
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

  const fetchWickets = async () => {
    setIsLoading(true);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        validityFilter,
        ...(search && { search }),
      });

      const response = await fetch(`/api/admin/wicket-types?${params}`);
      const data = await response.json();

      if (response.ok) {
        setWickets(data.wickets);
        setTotal(data.total);
      } else {
        console.error('Error fetching wicket types:', data.error);
      }
    } catch (error) {
      console.error('Error fetching wicket types:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWickets();
  }, [page, search, validityFilter]);

  const handleAdd = () => {
    setEditingWicket(null);
    setFormValues({
      name: '',
      description: '',
      metalThickness: 2.0,
      sectionWidth: 40,
      sectionHeight: 40,
      wicketHeight: 2000,
      wicketLength: 1000,
      retailPrice: 0,
      purchasePrice: null,
      active: true,
      validFrom: null,
      expirationDate: null,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (wicket: WicketType) => {
    setEditingWicket(wicket);
    setFormValues({
      name: wicket.name,
      description: wicket.description || '',
      metalThickness: wicket.metalThickness,
      sectionWidth: wicket.sectionWidth,
      sectionHeight: wicket.sectionHeight,
      wicketHeight: wicket.wicketHeight,
      wicketLength: wicket.wicketLength,
      retailPrice: wicket.retailPrice,
      purchasePrice: wicket.purchasePrice,
      active: wicket.active,
      validFrom: wicket.validFrom,
      expirationDate: wicket.expirationDate,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (wicket: WicketType) => {
    if (!confirm(`Удалить калитку "${wicket.name}"?`)) return;

    try {
      const response = await fetch(`/api/admin/wicket-types/${wicket.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Калитка успешно удалена');
        fetchWickets();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Ошибка удаления');
      }
    } catch (error) {
      console.error('Error deleting wicket type:', error);
      toast.error('Ошибка удаления');
    }
  };

  const handleToggleActive = async (wicket: WicketType) => {
    try {
      const response = await fetch(`/api/admin/wicket-types/${wicket.id}`, {
        method: 'PATCH',
      });

      if (response.ok) {
        toast.success('Статус изменен');
        fetchWickets();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Ошибка изменения статуса');
      }
    } catch (error) {
      console.error('Error toggling wicket type:', error);
      toast.error('Ошибка изменения статуса');
    }
  };

  const handlePriorityChange = async (id: string, newPriority: number) => {
    const response = await fetch('/api/admin/wicket-types/reorder', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, newPriority }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Ошибка изменения приоритета');
    }

    fetchWickets();
  };

  const handleFormChange = (name: string, value: any) => {
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handlePurchasePriceChange = (value: number | null) => {
    setFormValues((prev) => ({ ...prev, purchasePrice: value }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingWicket
        ? `/api/admin/wicket-types/${editingWicket.id}`
        : '/api/admin/wicket-types';
      const method = editingWicket ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formValues),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(editingWicket ? 'Калитка успешно обновлена' : 'Калитка успешно создана');
        setIsModalOpen(false);
        fetchWickets();
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

  const columns = [
    { key: 'name', label: 'Название' },
    { 
      key: 'metalThickness', 
      label: <ColumnHeaderWithTooltip title="Толщина металла (мм)" tooltip={WICKETS_COLUMN_TOOLTIPS.metalThickness} />, 
      render: (wicket: WicketType) => formatDimension(wicket.metalThickness)
    },
    { 
      key: 'section', 
      label: <ColumnHeaderWithTooltip title="Сечение (мм)" tooltip={WICKETS_COLUMN_TOOLTIPS.section} />, 
      render: (wicket: WicketType) => formatSection(wicket.sectionWidth, wicket.sectionHeight)
    },
    { 
      key: 'wicketHeight', 
      label: <ColumnHeaderWithTooltip title="Высота (мм)" tooltip={WICKETS_COLUMN_TOOLTIPS.wicketHeight} />, 
      render: (wicket: WicketType) => formatDimension(wicket.wicketHeight)
    },
    { 
      key: 'wicketLength', 
      label: <ColumnHeaderWithTooltip title="Длина (мм)" tooltip={WICKETS_COLUMN_TOOLTIPS.wicketLength} />, 
      render: (wicket: WicketType) => formatDimension(wicket.wicketLength)
    },
    {
      key: 'expirationDate',
      label: 'Срок действия',
      render: (wicket: WicketType) => {
        const isExpired = wicket.expirationDate && new Date(wicket.expirationDate) < new Date();
        const isExpiringSoon = wicket.expirationDate && !isExpired && 
          new Date(wicket.expirationDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        return (
          <span className={
            isExpired ? 'text-red-500' : 
            isExpiringSoon ? 'text-yellow-600' : 
            !wicket.expirationDate ? 'text-gray-400' : ''
          }>
            {formatDate(wicket.expirationDate)}
          </span>
        );
      },
    },
    ...(isAdmin ? [{
      key: 'purchasePrice' as const,
      label: <ColumnHeaderWithTooltip title="Цена закупки за ед. (₽)" tooltip={WICKETS_COLUMN_TOOLTIPS.purchasePrice} />,
      render: (wicket: WicketType) => {
        if (wicket.purchasePrice === null) {
          return <span className="text-gray-400">Не указана ⚪</span>;
        }
        const margin = calculateMargin(wicket.retailPrice, wicket.purchasePrice);
        const marginEmoji = getMarginEmoji(margin?.marginPercent ?? null);
        return (
          <span title={`Цена закупки: ${wicket.purchasePrice} ₽\nМаржа: ${margin?.marginPercent.toFixed(1)}%`}>
            {formatPrice(wicket.purchasePrice)} {marginEmoji}
          </span>
        );
      }
    }] : []),
    { 
      key: 'priority', 
      label: 'Приоритет',
      render: (wicket: WicketType) => (
        <PriorityColumn
          value={wicket.priority}
          totalItems={total}
          onChange={async (newPriority) => {
            await handlePriorityChange(wicket.id, newPriority);
            toast.success('Приоритет обновлён');
          }}
        />
      )
    },
  ];

  const validityFilterOptions = [
    { value: 'all', label: 'Все' },
    { value: 'active', label: 'Активные' },
    { value: 'expired', label: 'Истек срок' },
    { value: 'expiring_soon', label: 'Истекает скоро (7 дней)' },
  ];

  return (
    <div className="container mx-auto py-8">
      <div className="mb-4 flex gap-4 items-center">
        <select
          value={validityFilter}
          onChange={(e) => setValidityFilter(e.target.value as any)}
          className="border rounded px-3 py-2"
        >
          {validityFilterOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <DataTable
        title="Калитки"
        columns={columns}
        data={wickets}
        total={total}
        page={page}
        pageSize={pageSize}
        searchPlaceholder="Поиск по названию..."
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
        title={editingWicket ? 'Редактировать калитку' : 'Создать калитку'}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
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
            <h4 className="font-medium mb-3">Технические характеристики</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Толщина металла (мм) *</label>
                <input
                  type="number"
                  value={formValues.metalThickness || ''}
                  onChange={(e) => handleFormChange('metalThickness', parseFloat(e.target.value))}
                  className="w-full border rounded px-3 py-2"
                  min={1.0}
                  max={5.0}
                  step={0.1}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium mb-1">Ширина сечения (мм) *</label>
                <input
                  type="number"
                  value={formValues.sectionWidth || ''}
                  onChange={(e) => handleFormChange('sectionWidth', parseFloat(e.target.value))}
                  className="w-full border rounded px-3 py-2"
                  min={20}
                  max={200}
                  step={1}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Высота сечения (мм) *</label>
                <input
                  type="number"
                  value={formValues.sectionHeight || ''}
                  onChange={(e) => handleFormChange('sectionHeight', parseFloat(e.target.value))}
                  className="w-full border rounded px-3 py-2"
                  min={20}
                  max={200}
                  step={1}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium mb-1">Высота калитки (мм) *</label>
                <input
                  type="number"
                  value={formValues.wicketHeight || ''}
                  onChange={(e) => handleFormChange('wicketHeight', parseFloat(e.target.value))}
                  className="w-full border rounded px-3 py-2"
                  min={500}
                  max={2500}
                  step={1}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Длина (мм) *</label>
                <input
                  type="number"
                  value={formValues.wicketLength || ''}
                  onChange={(e) => handleFormChange('wicketLength', parseFloat(e.target.value))}
                  className="w-full border rounded px-3 py-2"
                  min={500}
                  max={2000}
                  step={1}
                  required
                />
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Ценообразование</h4>
            <div>
              <label className="block text-sm font-medium mb-1">Розничная стоимость (₽) *</label>
              <input
                type="number"
                value={formValues.retailPrice || ''}
                onChange={(e) => handleFormChange('retailPrice', parseFloat(e.target.value))}
                className="w-full border rounded px-3 py-2"
                min={0}
                step={0.01}
                required
              />
            </div>
          </div>

          {isAdmin && (
            <div className="mt-4">
              <SimplifiedPurchasePriceInput
                purchasePrice={formValues.purchasePrice ?? null}
                retailPrice={formValues.retailPrice || 0}
                onChange={handlePurchasePriceChange}
              />
            </div>
          )}

          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Период действия (опционально)</h4>
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
                  value={formValues.expirationDate ? new Date(formValues.expirationDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => handleFormChange('expirationDate', e.target.value ? new Date(e.target.value) : null)}
                  className="w-full border rounded px-3 py-2"
                />
                <p className="text-xs text-gray-500 mt-1">Пусто = бессрочно</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Если указать срок, номенклатура автоматически деактивируется в 01:00 следующего дня
            </p>
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

          {isAdmin && editingWicket && (
            <RelatedMountingHardware
              referenceType="WICKET"
              referenceId={editingWicket.id}
            />
          )}

          {isAdmin && editingWicket && (
            <RelatedWorks
              fenceType="WICKET"
            />
          )}

          {isAdmin && editingWicket && (
            <RelatedWorksByReference
              referenceType="WICKET"
              referenceId={editingWicket.id}
            />
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Отмена
            </Button>
            <Button type="submit">
              {editingWicket ? 'Обновить' : 'Создать'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
