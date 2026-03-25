'use client';

import { useState, useEffect } from 'react';
import { DataTable } from '@/components/admin/References/DataTable';
import { Modal } from '@/components/ui/modal';
import { SimplifiedPurchasePriceInput } from '@/components/admin/References/SimplifiedPurchasePriceInput';
import { calculateMargin, getMarginEmoji } from '@/lib/utils/marginCalculator';
import { formatDimension, formatPrice } from '@/lib/utils/formatters';
import { handleApiListResponse } from '@/lib/utils/apiResponse';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { RelatedMountingHardware } from '@/components/admin/References/RelatedMountingHardware';
import { RelatedWorksByReference } from '@/components/admin/Works/RelatedWorksByReference';

interface Panel3D {
  id: string;
  name: string;
  description: string | null;
  panelHeight: number;
  panelWidth: number;
  rodDiameter: number;
  cellWidth: number;
  cellHeight: number;
  retailPricePerUnit: number;
  purchasePricePerUnit: number | null;
  image: string | null;
  active: boolean;
  validFrom: string | null;
  validUntil: string | null;
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

const formatValidFrom = (date: string | Date | null): string => {
  if (!date) return 'С момента добавления';
  const d = new Date(date);
  return d.toLocaleDateString('ru-RU');
};

export default function Panel3dPage() {
  const [panel3ds, setPanel3ds] = useState<Panel3D[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [validityFilter, setValidityFilter] = useState<'all' | 'active' | 'expired' | 'expiring_soon'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPanel3d, setEditingPanel3d] = useState<Panel3D | null>(null);
  const [formValues, setFormValues] = useState<Partial<Panel3D> & { confirmDuplicate?: boolean }>({});
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

  const fetchPanel3ds = async () => {
    setIsLoading(true);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        search,
        validityFilter,
      });

      const res = await fetch(`/api/admin/panel3d?${params.toString()}`, {
        credentials: 'include',
      });
      const data = await res.json();

      const { items, total: totalCount, page: currentPage } = handleApiListResponse<Panel3D>(data, []);
      setPanel3ds(items);
      setTotal(totalCount || 0);
      setPage(currentPage || page);
    } catch (error) {
      console.error('Error fetching panel3ds:', error);
      toast.error('Ошибка загрузки списка 3D-панелей');
      setPanel3ds([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPanel3ds();
  }, [page, search, validityFilter]);

  const handleCreate = () => {
    const newPanel3d = {
      id: '',
      name: '',
      description: '',
      panelHeight: 2000,
      panelWidth: 2500,
      rodDiameter: 4,
      cellWidth: 50,
      cellHeight: 200,
      retailPricePerUnit: 0,
      purchasePricePerUnit: null,
      image: '',
      active: true,
      validFrom: null,
      validUntil: null,
      priority: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setEditingPanel3d(newPanel3d);
    setFormValues(newPanel3d);
    setIsModalOpen(true);
  };

  const handleEdit = (item: Panel3D) => {
    setEditingPanel3d(item);
    setFormValues(item);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!editingPanel3d) return;

    const url = editingPanel3d.id
      ? `/api/admin/panel3d/${editingPanel3d.id}`
      : '/api/admin/panel3d';

    const method = editingPanel3d.id ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formValues),
      });

      if (!res.ok) {
        const error = await res.json();
        toast.error(error.error || 'Ошибка сохранения');
        return;
      }

      const data = await res.json();
      toast.success(editingPanel3d.id ? '3D-панель обновлена' : '3D-панель создана');

      setIsModalOpen(false);
      setEditingPanel3d(null);
      setFormValues({});

      await fetchPanel3ds();
    } catch (error) {
      console.error('Error saving panel3d:', error);
      toast.error('Ошибка сохранения');
    }
  };

  const handleDelete = async (item: Panel3D) => {
    if (!confirm('Удалить 3D-панель?')) return;

    try {
      const res = await fetch(`/api/admin/panel3d/${item.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!res.ok) {
        const error = await res.json();
        toast.error(error.error || 'Ошибка удаления');
        return;
      }

      toast.success('3D-панель удалена');
      await fetchPanel3ds();
    } catch (error) {
      console.error('Error deleting panel3d:', error);
      toast.error('Ошибка удаления');
    }
  };

  const handleToggleActive = async (item: Panel3D) => {
    try {
      const res = await fetch(`/api/admin/panel3d/${item.id}`, {
        method: 'PATCH',
        credentials: 'include',
      });

      if (!res.ok) {
        const error = await res.json();
        toast.error(error.error || 'Ошибка изменения статуса');
        return;
      }

      toast.success(item.active ? '3D-панель активирована' : '3D-панель деактивирована');
      await fetchPanel3ds();
    } catch (error) {
      console.error('Error toggling panel3d active:', error);
      toast.error('Ошибка изменения статуса');
    }
  };

  const isAdmin = currentUser?.role === 'ADMIN';

  const columns = [
    { key: 'name', label: 'Название' },
    {
      key: 'panelHeight',
      label: 'Высота (мм)',
      render: (item: Panel3D) => formatDimension(item.panelHeight),
    },
    {
      key: 'panelWidth',
      label: 'Ширина (мм)',
      render: (item: Panel3D) => formatDimension(item.panelWidth),
    },
    {
      key: 'rodDiameter',
      label: 'Диаметр прутка (мм)',
      render: (item: Panel3D) => `${item.rodDiameter} мм`,
    },
    {
      key: 'cellWidth',
      label: 'Ширина ячейки (мм)',
      render: (item: Panel3D) => `${item.cellWidth} мм`,
    },
    {
      key: 'cellHeight',
      label: 'Высота ячейки (мм)',
      render: (item: Panel3D) => `${item.cellHeight} мм`,
    },
    {
      key: 'retailPricePerUnit',
      label: 'Розница за ед. (₽)',
      render: (item: Panel3D) => formatPrice(item.retailPricePerUnit),
    },
    ...(isAdmin ? [{
      key: 'purchasePricePerUnit' as const,
      label: 'Закупка за ед. (₽)',
      render: (item: Panel3D) => {
        if (item.purchasePricePerUnit === null) {
          return <span className="text-gray-400">Не указана</span>;
        }
        const margin = calculateMargin(item.retailPricePerUnit, item.purchasePricePerUnit);
        const marginEmoji = getMarginEmoji(margin?.marginPercent ?? null);
        return (
          <span title={`Цена закупки: ${item.purchasePricePerUnit} ₽\nМаржа: ${margin?.marginPercent?.toFixed(1) ?? '-'}%`}>
            {formatPrice(item.purchasePricePerUnit)} {marginEmoji}
          </span>
        );
      }
    }] : []),
    {
      key: 'validUntil',
      label: 'Срок действия',
      render: (item: Panel3D) => {
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
    { 
      key: 'priority', 
      label: 'Приоритет',
      render: (item: Panel3D) => item.priority,
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
        <select
          value={validityFilter}
          onChange={(e) => setValidityFilter(e.target.value as any)}
          className="border rounded px-3 py-2"
        >
          {filterOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <DataTable
        title="3D-панели"
        columns={columns}
        data={panel3ds}
        total={total}
        page={page}
        pageSize={pageSize}
        searchPlaceholder="Поиск по названию..."
        onSearch={setSearch}
        onPageChange={setPage}
        onAdd={handleCreate}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleActive={handleToggleActive}
        isLoading={isLoading}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingPanel3d(null);
          setFormValues({});
        }}
        title={editingPanel3d?.id ? 'Редактировать номенклатуру' : 'Создать номенклатуру'}
      >
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium mb-1">Название *</label>
            <input
              type="text"
              value={formValues.name || ''}
              onChange={(e) => setFormValues({ ...formValues, name: e.target.value })}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Описание</label>
            <textarea
              value={formValues.description || ''}
              onChange={(e) => setFormValues({ ...formValues, description: e.target.value })}
              className="w-full border rounded px-3 py-2"
              rows={2}
            />
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Характеристики</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Высота панели (мм) *</label>
                <input
                  type="number"
                  value={formValues.panelHeight || 2000}
                  onChange={(e) => setFormValues({ ...formValues, panelHeight: parseInt(e.target.value) })}
                  className="w-full border rounded px-3 py-2"
                  min="500"
                  max="3000"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Ширина панели (мм) *</label>
                <input
                  type="number"
                  value={formValues.panelWidth || 2500}
                  onChange={(e) => setFormValues({ ...formValues, panelWidth: parseInt(e.target.value) })}
                  className="w-full border rounded px-3 py-2"
                  min="500"
                  max="3000"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Диаметр прутка (мм) *</label>
                <input
                  type="number"
                  value={formValues.rodDiameter || 4}
                  onChange={(e) => setFormValues({ ...formValues, rodDiameter: parseFloat(e.target.value) })}
                  className="w-full border rounded px-3 py-2"
                  min="2"
                  max="6"
                  step="0.1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Ширина ячейки (мм) *</label>
                <input
                  type="number"
                  value={formValues.cellWidth || 50}
                  onChange={(e) => setFormValues({ ...formValues, cellWidth: parseInt(e.target.value) })}
                  className="w-full border rounded px-3 py-2"
                  min="20"
                  max="200"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Высота ячейки (мм) *</label>
                <input
                  type="number"
                  value={formValues.cellHeight || 200}
                  onChange={(e) => setFormValues({ ...formValues, cellHeight: parseInt(e.target.value) })}
                  className="w-full border rounded px-3 py-2"
                  min="20"
                  max="200"
                  required
                />
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Цены</h4>
            <div>
              <label className="block text-sm font-medium mb-1">Розничная стоимость за ед. (₽) *</label>
              <input
                type="number"
                value={formValues.retailPricePerUnit || 0}
                onChange={(e) => setFormValues({ ...formValues, retailPricePerUnit: parseFloat(e.target.value) })}
                className="w-full border rounded px-3 py-2"
                min="0"
                max="100000"
                step="0.01"
                required
              />
            </div>

            {isAdmin && (
              <div className="mt-4">
                <SimplifiedPurchasePriceInput
                  purchasePrice={formValues.purchasePricePerUnit ?? null}
                  retailPrice={formValues.retailPricePerUnit ?? 0}
                  onChange={(val) => setFormValues({ ...formValues, purchasePricePerUnit: val })}
                />
              </div>
            )}

            {isAdmin && formValues.retailPricePerUnit && formValues.purchasePricePerUnit && (
              <div className="mt-4 p-4 bg-gray-50 rounded border">
                <h5 className="font-medium mb-2">📊 Расчет маржи</h5>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600">Маржа:</span>
                    <span className="ml-2">
                      {(() => {
                        const margin = calculateMargin(formValues.retailPricePerUnit, formValues.purchasePricePerUnit);
                        return margin ? `${margin.marginPercent.toFixed(1)}% ${getMarginEmoji(margin.marginPercent)}` : '-';
                      })()}
                    </span>
                    <span className="ml-2 text-gray-500">
                      ({(() => {
                        const margin = calculateMargin(formValues.retailPricePerUnit, formValues.purchasePricePerUnit);
                        return margin ? `${margin.marginAbsolute?.toFixed(2)} ₽/ед.` : '';
                      })()})
                    </span>
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
                  onChange={(e) => setFormValues({ ...formValues, validFrom: e.target.value ? new Date(e.target.value).toISOString() : null })}
                  className="w-full border rounded px-3 py-2"
                />
                <p className="text-xs text-gray-500 mt-1">Пусто = с момента добавления</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Срок действия</label>
                <input
                  type="date"
                  value={formValues.validUntil ? new Date(formValues.validUntil).toISOString().split('T')[0] : ''}
                  onChange={(e) => setFormValues({ ...formValues, validUntil: e.target.value ? new Date(e.target.value).toISOString() : null })}
                  className="w-full border rounded px-3 py-2"
                />
                <p className="text-xs text-gray-500 mt-1">Пусто = бессрочно</p>
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Дополнительно</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Приоритет *</label>
                <input
                  type="number"
                  value={formValues.priority || 0}
                  onChange={(e) => setFormValues({ ...formValues, priority: parseInt(e.target.value) })}
                  className="w-full border rounded px-3 py-2"
                  min="0"
                  max="100"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Изображение</label>
                <input
                  type="text"
                  value={formValues.image || ''}
                  onChange={(e) => setFormValues({ ...formValues, image: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 mt-4">
              <input
                type="checkbox"
                id="active"
                checked={formValues.active !== undefined ? formValues.active : true}
                onChange={(e) => setFormValues({ ...formValues, active: e.target.checked })}
                className="rounded"
              />
              <label htmlFor="active" className="text-sm font-medium">Активен</label>
            </div>
          </div>

          {isAdmin && editingPanel3d?.id && (
            <>
              <RelatedMountingHardware
                referenceType="PANEL_3D"
                referenceId={editingPanel3d.id}
              />

              <RelatedWorksByReference
                referenceType="PANEL_3D"
                referenceId={editingPanel3d.id}
              />
            </>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={isLoading}>
              {editingPanel3d?.id ? 'Обновить' : 'Создать'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
