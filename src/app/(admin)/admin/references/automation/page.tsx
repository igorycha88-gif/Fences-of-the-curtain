'use client';

import { useState, useEffect } from 'react';
import { DataTable } from '@/components/admin/References/DataTable';
import { Modal } from '@/components/ui/modal';
import { SimplifiedPurchasePriceInput } from '@/components/admin/References/SimplifiedPurchasePriceInput';
import { calculateMargin, getMarginEmoji } from '@/lib/utils/marginCalculator';
import { formatPrice } from '@/lib/utils/formatters';
import { PriorityColumn } from '@/components/admin/References/shared';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { RelatedMountingHardware } from '@/components/admin/References/RelatedMountingHardware';
import { RelatedWorks } from '@/components/admin/Works/RelatedWorks';
import { RelatedWorksByReference } from '@/components/admin/Works/RelatedWorksByReference';

interface AutomationType {
  id: string;
  name: string;
  description: string | null;
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

export default function AutomationPage() {
  const [items, setItems] = useState<AutomationType[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [validityFilter, setValidityFilter] = useState<'all' | 'active' | 'expired' | 'expiring_soon'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AutomationType | null>(null);
  const [formValues, setFormValues] = useState<Partial<AutomationType>>({});
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);

  const pageSize = 20;

  useEffect(() => {
    fetch('/api/auth/session', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setCurrentUser(data.user);
        }
      })
      .catch((err) => console.error('Error fetching session:', err));
  }, []);

  const fetchItems = async () => {
    setIsLoading(true);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        validityFilter,
        ...(search && { search }),
      });

      const response = await fetch(`/api/admin/automation-types?${params}`, { credentials: 'include' });
      const data = await response.json();

      if (response.ok) {
        setItems(data.items || []);
        setTotal(data.total || 0);
      } else {
        setItems([]);
        setTotal(0);
        console.error('Error fetching automation types:', data.error);
      }
    } catch (error) {
      console.error('Error fetching automation types:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [page, search, validityFilter]);

  const handleAdd = () => {
    setEditingItem(null);
    setFormValues({
      name: '',
      description: '',
      retailPrice: 0,
      purchasePrice: null,
      active: true,
      validFrom: null,
      expirationDate: null,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (item: AutomationType) => {
    setEditingItem(item);
    setFormValues({
      name: item.name,
      description: item.description || '',
      retailPrice: item.retailPrice,
      purchasePrice: item.purchasePrice,
      active: item.active,
      validFrom: item.validFrom,
      expirationDate: item.expirationDate,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (item: AutomationType) => {
    if (!confirm(`Удалить автоматику "${item.name}"?`)) return;

    try {
      const response = await fetch(`/api/admin/automation-types/${item.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        toast.success('Автоматика успешно удалена');
        fetchItems();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Ошибка удаления');
      }
    } catch (error) {
      console.error('Error deleting automation type:', error);
      toast.error('Ошибка удаления');
    }
  };

  const handleToggleActive = async (item: AutomationType) => {
    try {
      const response = await fetch(`/api/admin/automation-types/${item.id}`, {
        method: 'PATCH',
        credentials: 'include',
      });

      if (response.ok) {
        toast.success('Статус изменен');
        fetchItems();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Ошибка изменения статуса');
      }
    } catch (error) {
      console.error('Error toggling automation type:', error);
      toast.error('Ошибка изменения статуса');
    }
  };

  const handlePriorityChange = async (id: string, newPriority: number) => {
    const response = await fetch('/api/admin/automation-types/reorder', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, newPriority }),
      credentials: 'include',
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Ошибка изменения приоритета');
    }

    fetchItems();
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
      const url = editingItem
        ? `/api/admin/automation-types/${editingItem.id}`
        : '/api/admin/automation-types';
      const method = editingItem ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formValues),
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(editingItem ? 'Автоматика успешно обновлена' : 'Автоматика успешно создана');
        setIsModalOpen(false);
        fetchItems();
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
      key: 'description',
      label: 'Описание',
      render: (item: AutomationType) => (
        <span className="text-sm text-gray-500 truncate max-w-[200px] block">
          {item.description || '—'}
        </span>
      ),
    },
    {
      key: 'retailPrice',
      label: 'Розничная цена (₽)',
      render: (item: AutomationType) => formatPrice(item.retailPrice),
    },
    {
      key: 'expirationDate',
      label: 'Срок действия',
      render: (item: AutomationType) => {
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
      key: 'purchasePrice' as const,
      label: 'Цена закупки (₽)',
      render: (item: AutomationType) => {
        if (item.purchasePrice === null) {
          return <span className="text-gray-400">Не указана ⚪</span>;
        }
        const margin = calculateMargin(item.retailPrice, item.purchasePrice);
        const marginEmoji = getMarginEmoji(margin?.marginPercent ?? null);
        return (
          <span title={`Цена закупки: ${item.purchasePrice} ₽\nМаржа: ${margin?.marginPercent.toFixed(1)}%`}>
            {formatPrice(item.purchasePrice)} {marginEmoji}
          </span>
        );
      }
    }] : []),
    {
      key: 'priority',
      label: 'Приоритет',
      render: (item: AutomationType) => (
        <PriorityColumn
          value={item.priority}
          totalItems={total}
          onChange={async (newPriority) => {
            await handlePriorityChange(item.id, newPriority);
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
        title="Автоматика"
        columns={columns}
        data={items}
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
        title={editingItem ? 'Редактировать автоматику' : 'Создать автоматику'}
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
              rows={3}
            />
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

          {isAdmin && editingItem && (
            <RelatedMountingHardware
              referenceType="AUTOMATION"
              referenceId={editingItem.id}
            />
          )}

          {isAdmin && editingItem && (
            <RelatedWorks
              fenceType="AUTOMATION"
            />
          )}

          {isAdmin && editingItem && (
            <RelatedWorksByReference
              referenceType="AUTOMATION"
              referenceId={editingItem.id}
            />
          )}

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
