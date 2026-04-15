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

interface MeshType {
  id: string;
  name: string;
  description: string | null;
  height: number;
  cellSize: number;
  wireThickness: number;
  coating: string;
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

const COATING_OPTIONS = [
  { value: 'Оцинковка', label: 'Оцинковка' },
  { value: 'Полимерное', label: 'Полимерное' },
];

export default function MeshPage() {
  const [meshes, setMeshes] = useState<MeshType[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [validityFilter, setValidityFilter] = useState<'all' | 'active' | 'expired' | 'expiring_soon'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMesh, setEditingMesh] = useState<MeshType | null>(null);
  const [formValues, setFormValues] = useState<Partial<MeshType>>({});
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);

  const pageSize = 20;

  useEffect(() => {
    fetch('/api/auth/session')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setCurrentUser(data.user);
      })
      .catch((err) => console.error('Error fetching session:', err));
  }, []);

  const fetchMeshes = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        search,
        validityFilter,
      });
      const res = await fetch(`/api/admin/materials/mesh-types?${params.toString()}`, {
        credentials: 'include',
      });
      const data = await res.json();
      const { items, total: totalCount, page: currentPage } = handleApiListResponse<MeshType>(data, []);
      setMeshes(items);
      setTotal(totalCount || 0);
      setPage(currentPage || page);
    } catch (error) {
      console.error('Error fetching meshes:', error);
      toast.error('Ошибка загрузки списка сетки-рабицы');
      setMeshes([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMeshes();
  }, [page, search, validityFilter]);

  const handleCreate = () => {
    const newMesh: MeshType = {
      id: '',
      name: '',
      description: '',
      height: 1500,
      cellSize: 50,
      wireThickness: 2.0,
      coating: 'Оцинковка',
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
    setEditingMesh(newMesh);
    setFormValues(newMesh);
    setIsModalOpen(true);
  };

  const handleEdit = (item: MeshType) => {
    setEditingMesh(item);
    setFormValues(item);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!editingMesh) return;
    const url = editingMesh.id
      ? `/api/admin/materials/mesh-types/${editingMesh.id}`
      : '/api/admin/materials/mesh-types';
    const method = editingMesh.id ? 'PUT' : 'POST';
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
      toast.success(editingMesh.id ? 'Сетка-рабица обновлена' : 'Сетка-рабица создана');
      setIsModalOpen(false);
      setEditingMesh(null);
      setFormValues({});
      await fetchMeshes();
    } catch (error) {
      console.error('Error saving mesh:', error);
      toast.error('Ошибка сохранения');
    }
  };

  const handleDelete = async (item: MeshType) => {
    if (!confirm('Удалить сетку-рабицу?')) return;
    try {
      const res = await fetch(`/api/admin/materials/mesh-types/${item.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const error = await res.json();
        toast.error(error.error || 'Ошибка удаления');
        return;
      }
      toast.success('Сетка-рабица удалена');
      await fetchMeshes();
    } catch (error) {
      console.error('Error deleting mesh:', error);
      toast.error('Ошибка удаления');
    }
  };

  const handleToggleActive = async (item: MeshType) => {
    try {
      const res = await fetch(`/api/admin/materials/mesh-types/${item.id}`, {
        method: 'PATCH',
        credentials: 'include',
      });
      if (!res.ok) {
        const error = await res.json();
        toast.error(error.error || 'Ошибка изменения статуса');
        return;
      }
      toast.success(item.active ? 'Сетка-рабица деактивирована' : 'Сетка-рабица активирована');
      await fetchMeshes();
    } catch (error) {
      console.error('Error toggling mesh active:', error);
      toast.error('Ошибка изменения статуса');
    }
  };

  const isAdmin = currentUser?.role === 'ADMIN';

  const columns = [
    { key: 'name', label: 'Название' },
    {
      key: 'height',
      label: 'Высота (мм)',
      render: (item: MeshType) => formatDimension(item.height),
    },
    {
      key: 'cellSize',
      label: 'Ячейка (мм)',
      render: (item: MeshType) => `${item.cellSize} мм`,
    },
    {
      key: 'wireThickness',
      label: 'Пруток (мм)',
      render: (item: MeshType) => `${item.wireThickness} мм`,
    },
    {
      key: 'coating',
      label: 'Покрытие',
      render: (item: MeshType) => item.coating,
    },
    {
      key: 'retailPricePerUnit',
      label: 'Розница за м.п. (₽)',
      render: (item: MeshType) => formatPrice(item.retailPricePerUnit),
    },
    ...(isAdmin ? [{
      key: 'purchasePricePerUnit' as const,
      label: 'Закупка за м.п. (₽)',
      render: (item: MeshType) => {
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
      render: (item: MeshType) => {
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
      render: (item: MeshType) => item.priority,
    },
  ];

  const filterOptions = [
    { value: 'all', label: 'Все' },
    { value: 'active', label: 'Активные' },
    { value: 'expired', label: 'Истёкшие' },
    { value: 'expiring_soon', label: 'Скоро истекают' },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Сетка-рабица</h1>

      <DataTable<MeshType>
        title="Сетка-рабица"
        data={meshes}
        columns={columns}
        total={total}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onSearch={setSearch}
        onAdd={handleCreate}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleActive={handleToggleActive}
        isLoading={isLoading}
        searchPlaceholder="Поиск по названию..."
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingMesh(null); setFormValues({}); }}
        title={editingMesh?.id ? 'Редактировать сетку-рабицу' : 'Новая сетка-рабица'}
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto p-4">
          <div>
            <label className="block text-sm font-medium mb-1">Название *</label>
            <input
              type="text"
              value={formValues.name || ''}
              onChange={(e) => setFormValues({ ...formValues, name: e.target.value })}
              className="w-full border rounded px-3 py-2"
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Высота (мм) *</label>
              <input
                type="number"
                value={formValues.height || ''}
                onChange={(e) => setFormValues({ ...formValues, height: Number(e.target.value) })}
                className="w-full border rounded px-3 py-2"
                min={500}
                max={4000}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Размер ячейки (мм) *</label>
              <input
                type="number"
                value={formValues.cellSize || ''}
                onChange={(e) => setFormValues({ ...formValues, cellSize: Number(e.target.value) })}
                className="w-full border rounded px-3 py-2"
                min={10}
                max={100}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Толщина прутка (мм) *</label>
              <input
                type="number"
                value={formValues.wireThickness || ''}
                onChange={(e) => setFormValues({ ...formValues, wireThickness: Number(e.target.value) })}
                className="w-full border rounded px-3 py-2"
                min={0.5}
                max={10}
                step={0.1}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Покрытие *</label>
              <select
                value={formValues.coating || 'Оцинковка'}
                onChange={(e) => setFormValues({ ...formValues, coating: e.target.value })}
                className="w-full border rounded px-3 py-2"
              >
                {COATING_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Розничная цена за м.п. (₽) *</label>
              <input
                type="number"
                value={formValues.retailPricePerUnit || ''}
                onChange={(e) => setFormValues({ ...formValues, retailPricePerUnit: Number(e.target.value) })}
                className="w-full border rounded px-3 py-2"
                min={0}
              />
            </div>
            {isAdmin && (
              <SimplifiedPurchasePriceInput
                purchasePrice={formValues.purchasePricePerUnit ?? null}
                retailPrice={formValues.retailPricePerUnit || 0}
                onChange={(val) => setFormValues({ ...formValues, purchasePricePerUnit: val })}
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Действует с</label>
              <input
                type="date"
                value={formValues.validFrom ? new Date(formValues.validFrom).toISOString().split('T')[0] : ''}
                onChange={(e) => setFormValues({ ...formValues, validFrom: e.target.value ? new Date(e.target.value).toISOString() : null })}
                className="w-full border rounded px-3 py-2"
              />
              <span className="text-xs text-gray-500">{formatValidFrom(formValues.validFrom ?? null)}</span>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Действует до</label>
              <input
                type="date"
                value={formValues.validUntil ? new Date(formValues.validUntil).toISOString().split('T')[0] : ''}
                onChange={(e) => setFormValues({ ...formValues, validUntil: e.target.value ? new Date(e.target.value).toISOString() : null })}
                className="w-full border rounded px-3 py-2"
              />
              <span className="text-xs text-gray-500">{formatDate(formValues.validUntil ?? null)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Приоритет</label>
              <input
                type="number"
                value={formValues.priority ?? 0}
                onChange={(e) => setFormValues({ ...formValues, priority: Number(e.target.value) })}
                className="w-full border rounded px-3 py-2"
                min={0}
                max={100}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Изображение (URL)</label>
              <input
                type="text"
                value={formValues.image || ''}
                onChange={(e) => setFormValues({ ...formValues, image: e.target.value })}
                className="w-full border rounded px-3 py-2"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formValues.active ?? true}
              onChange={(e) => setFormValues({ ...formValues, active: e.target.checked })}
              className="rounded"
            />
            <label className="text-sm font-medium">Активна</label>
          </div>

          {editingMesh?.id && isAdmin && (
            <div className="border-t pt-4 space-y-4">
              <RelatedMountingHardware
                referenceType="MESH"
                referenceId={editingMesh.id}
              />
              <RelatedWorksByReference
                referenceType="MESH"
                referenceId={editingMesh.id}
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => { setIsModalOpen(false); setEditingMesh(null); setFormValues({}); }}>
              Отмена
            </Button>
            <Button onClick={handleSave}>
              {editingMesh?.id ? 'Сохранить' : 'Создать'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
