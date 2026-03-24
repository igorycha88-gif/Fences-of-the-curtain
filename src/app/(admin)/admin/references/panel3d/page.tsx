'use client';

import { useState, useEffect } from 'react';
import { DataTable } from '@/components/admin/References/DataTable';
import { Modal } from '@/components/ui/modal';
import { SimplifiedPurchasePriceInput } from '@/components/admin/References/SimplifiedPurchasePriceInput';
import { calculateMargin, getMarginEmoji } from '@/lib/utils/marginCalculator';
import { formatDimension, formatPrice } from '@/lib/utils/formatters';
import { ColumnHeaderWithTooltip } from '@/components/admin/References/ColumnHeaderWithTooltip';
import { PriorityColumn } from '@/components/admin/References/shared';
import { handleApiListResponse } from '@/lib/utils/apiResponse';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';

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

      const res = await fetch(`/api/admin/panel3d?${params.toString()}`);
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
    setEditingPanel3d({
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
    });
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

  const columns = [
    {
      key: 'name',
      label: <ColumnHeaderWithTooltip title="Название" tooltip="Наименование 3D-панели" />,
      render: (item: Panel3D) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{item.name}</span>
          {!item.active && <span className="ml-2 text-xs text-muted-foreground"> (неактивна)</span>}
        </div>
      ),
    },
    {
      key: 'panelHeight',
      label: <ColumnHeaderWithTooltip title="Высота" tooltip="Высота панели в миллиметрах" />,
      render: (item: Panel3D) => formatDimension(item.panelHeight),
    },
    {
      key: 'panelWidth',
      label: <ColumnHeaderWithTooltip title="Ширина" tooltip="Ширина панели в миллиметрах" />,
      render: (item: Panel3D) => formatDimension(item.panelWidth),
    },
    {
      key: 'rodDiameter',
      label: <ColumnHeaderWithTooltip title="Диаметр прутка" tooltip="Диаметр прутка в миллиметрах" />,
      render: (item: Panel3D) => `${item.rodDiameter} мм`,
    },
    {
      key: 'cellWidth',
      label: <ColumnHeaderWithTooltip title="Ширина ячейки" tooltip="Ширина ячейки в миллиметрах" />,
      render: (item: Panel3D) => `${item.cellWidth} мм`,
    },
    {
      key: 'cellHeight',
      label: <ColumnHeaderWithTooltip title="Высота ячейки" tooltip="Высота ячейки в миллиметрах" />,
      render: (item: Panel3D) => `${item.cellHeight} мм`,
    },
    {
      key: 'retailPricePerUnit',
      label: <ColumnHeaderWithTooltip title="Розничная цена" tooltip="Розничная цена за единицу" />,
      render: (item: Panel3D) => formatPrice(item.retailPricePerUnit),
    },
    {
      key: 'purchasePricePerUnit',
      label: <ColumnHeaderWithTooltip title="Закупочная цена" tooltip="Закупочная цена за единицу" />,
      render: (item: Panel3D) => item.purchasePricePerUnit ? formatPrice(item.purchasePricePerUnit) : '—',
    },
    {
      key: 'validFrom',
      label: 'Действует с',
      render: (item: Panel3D) => formatValidFrom(item.validFrom),
    },
    {
      key: 'validUntil',
      label: 'Действует до',
      render: (item: Panel3D) => item.validUntil ? formatDate(item.validUntil) : 'Бессрочно',
    },
    {
      key: 'priority',
      label: (
        <ColumnHeaderWithTooltip
          title="Приоритет"
          tooltip="Меньшее значение = выше приоритет"
        />
      ),
      render: (item: Panel3D) => item.priority,
    },
  ];

  const isAdmin = currentUser?.role === 'ADMIN';

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">3D-панели</h1>
        <Button onClick={handleCreate}>Добавить</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <div className="space-y-2">
          <div>
            <input
              type="text"
              placeholder="Поиск по названию..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <select
              value={validityFilter}
              onChange={(e) => setValidityFilter(e.target.value as typeof validityFilter)}
              className="w-full"
            >
              <option value="all">Все</option>
              <option value="active">Активные</option>
              <option value="expired">Истёкшие</option>
              <option value="expiring_soon">Истекают скоро</option>
            </select>
          </div>
        </div>

        <div className="col-span-3">
          <DataTable
            title="3D-панели"
            columns={columns}
            data={panel3ds}
            isLoading={isLoading}
            total={total}
            page={page}
            pageSize={pageSize}
            searchPlaceholder="Поиск по названию..."
            onSearch={setSearch}
            onPageChange={setPage}
            onAdd={handleCreate}
            onEdit={handleEdit}
            onToggleActive={handleToggleActive}
            onDelete={handleDelete}
          />
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingPanel3d(null);
          setFormValues({});
        }}
        title={editingPanel3d?.id ? 'Редактирование 3D-панели' : 'Создание 3D-панели'}
      >
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Название *</label>
              <input
                type="text"
                value={formValues.name || ''}
                onChange={(e) => setFormValues({ ...formValues, name: e.target.value })}
                className="w-full"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Описание</label>
              <textarea
                value={formValues.description || ''}
                onChange={(e) => setFormValues({ ...formValues, description: e.target.value })}
                className="w-full"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Высота панели (мм) *</label>
              <input
                type="number"
                value={formValues.panelHeight || 2000}
                onChange={(e) => setFormValues({ ...formValues, panelHeight: parseInt(e.target.value) })}
                className="w-full"
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
                className="w-full"
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
                className="w-full"
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
                className="w-full"
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
                className="w-full"
                min="20"
                max="200"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Розничная цена (₽) *</label>
              <input
                type="number"
                value={formValues.retailPricePerUnit || 0}
                onChange={(e) => setFormValues({ ...formValues, retailPricePerUnit: parseFloat(e.target.value) })}
                className="w-full"
                min="0"
                max="100000"
                step="0.01"
                required
              />
            </div>

            <div>
              <SimplifiedPurchasePriceInput
                purchasePrice={formValues.purchasePricePerUnit ?? null}
                retailPrice={formValues.retailPricePerUnit ?? 0}
                onChange={(val) => setFormValues({ ...formValues, purchasePricePerUnit: val })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Действует с</label>
              <input
                type="date"
                value={formValues.validFrom ? new Date(formValues.validFrom).toISOString().split('T')[0] : ''}
                onChange={(e) => setFormValues({ ...formValues, validFrom: e.target.value ? new Date(e.target.value).toISOString() : null })}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Действует до</label>
              <input
                type="date"
                value={formValues.validUntil ? new Date(formValues.validUntil).toISOString().split('T')[0] : ''}
                onChange={(e) => setFormValues({ ...formValues, validUntil: e.target.value ? new Date(e.target.value).toISOString() : null })}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Приоритет *</label>
              <input
                type="number"
                value={formValues.priority || 0}
                onChange={(e) => setFormValues({ ...formValues, priority: parseInt(e.target.value) })}
                className="w-full"
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
                className="w-full"
              />
            </div>

            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formValues.active !== undefined ? formValues.active : true}
                  onChange={(e) => setFormValues({ ...formValues, active: e.target.checked })}
                />
                <span>Активна</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button type="submit" disabled={isLoading}>
              {editingPanel3d?.id ? 'Сохранить' : 'Создать'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Отмена
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
