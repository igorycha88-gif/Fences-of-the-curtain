'use client';

import { useState, useEffect } from 'react';
import { DataTable } from '@/components/admin/References/DataTable';
import { ReferenceForm } from '@/components/admin/References/ReferenceForm';
import { Modal } from '@/components/ui/modal';

interface LagType {
  id: string;
  name: string;
  description: string | null;
  width: number;
  height: number;
  metalThickness: number;
  basePricePerMeter: number;
  availableLengths: Array<{
    length: number;
    priceCoef: number;
  }> | null;
  image: string | null;
  active: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export default function LagsPage() {
  const [lags, setLags] = useState<LagType[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLag, setEditingLag] = useState<LagType | null>(null);
  const [formValues, setFormValues] = useState<Partial<LagType>>({});

  const pageSize = 20;

  const fetchLags = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        ...(search && { search }),
      });

      const response = await fetch(`/api/admin/lag-types?${params}`);
      const data = await response.json();

      if (response.ok) {
        setLags(data.lags);
        setTotal(data.total);
      } else {
        console.error('Error fetching lag types:', data.error);
      }
    } catch (error) {
      console.error('Error fetching lag types:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLags();
  }, [page, search]);

  const handleAdd = () => {
    setEditingLag(null);
    setFormValues({
      name: '',
      description: '',
      width: 40,
      height: 20,
      metalThickness: 2.0,
      basePricePerMeter: 0,
      active: true,
      sortOrder: 0,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (lag: LagType) => {
    setEditingLag(lag);
    setFormValues({
      name: lag.name,
      description: lag.description || '',
      width: lag.width,
      height: lag.height,
      metalThickness: lag.metalThickness,
      basePricePerMeter: lag.basePricePerMeter,
      active: lag.active,
      sortOrder: lag.sortOrder,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (lag: LagType) => {
    if (!confirm(`Удалить лагу "${lag.name}"?`)) return;

    try {
      const response = await fetch(`/api/admin/lag-types/${lag.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchLags();
      } else {
        const data = await response.json();
        alert(data.error || 'Ошибка удаления');
      }
    } catch (error) {
      console.error('Error deleting lag type:', error);
      alert('Ошибка удаления');
    }
  };

  const handleToggleActive = async (lag: LagType) => {
    try {
      const response = await fetch(`/api/admin/lag-types/${lag.id}`, {
        method: 'PATCH',
      });

      if (response.ok) {
        fetchLags();
      } else {
        const data = await response.json();
        alert(data.error || 'Ошибка изменения статуса');
      }
    } catch (error) {
      console.error('Error toggling lag type:', error);
      alert('Ошибка изменения статуса');
    }
  };

  const handleFormChange = (name: string, value: any) => {
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingLag
        ? `/api/admin/lag-types/${editingLag.id}`
        : '/api/admin/lag-types';
      const method = editingLag ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formValues),
      });

      if (response.ok) {
        setIsModalOpen(false);
        fetchLags();
      } else {
        const data = await response.json();
        alert(data.error || 'Ошибка сохранения');
      }
    } catch (error) {
      console.error('Error saving lag type:', error);
      alert('Ошибка сохранения');
    }
  };

  const columns = [
    { key: 'name', label: 'Название' },
    { key: 'description', label: 'Описание' },
    {
      key: 'width',
      label: 'Ширина (мм)',
      render: (lag: LagType) => lag.width.toFixed(0),
    },
    {
      key: 'height',
      label: 'Высота (мм)',
      render: (lag: LagType) => lag.height.toFixed(0),
    },
    {
      key: 'metalThickness',
      label: 'Толщина металла (мм)',
      render: (lag: LagType) => lag.metalThickness.toFixed(1),
    },
    {
      key: 'basePricePerMeter',
      label: 'Цена за м.п. (руб)',
      render: (lag: LagType) => lag.basePricePerMeter.toFixed(2),
    },
    { key: 'sortOrder', label: 'Порядок' },
    { key: 'active', label: 'Активен' },
  ];

  const formFields = [
    { name: 'name', label: 'Название', type: 'text' as const, required: true },
    { name: 'description', label: 'Описание', type: 'textarea' as const },
    {
      name: 'width',
      label: 'Ширина сечения (мм)',
      type: 'number' as const,
      required: true,
      min: 20,
      max: 100,
      step: 1,
    },
    {
      name: 'height',
      label: 'Высота сечения (мм)',
      type: 'number' as const,
      required: true,
      min: 20,
      max: 100,
      step: 1,
    },
    {
      name: 'metalThickness',
      label: 'Толщина металла (мм)',
      type: 'number' as const,
      required: true,
      min: 1.0,
      max: 5.0,
      step: 0.1,
    },
    {
      name: 'basePricePerMeter',
      label: 'Базовая цена за метр погонный (руб)',
      type: 'number' as const,
      required: true,
      min: 0,
      step: 0.01,
    },
    { name: 'sortOrder', label: 'Порядок сортировки', type: 'number' as const },
    { name: 'active', label: 'Активен', type: 'checkbox' as const },
  ];

  return (
    <div className="container mx-auto py-8">
      <DataTable
        title="Лаги"
        columns={columns}
        data={lags}
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
        title={editingLag ? 'Редактировать лагу' : 'Создать лагу'}
      >
        <ReferenceForm
          fields={formFields}
          values={formValues}
          onChange={handleFormChange}
          onSubmit={handleFormSubmit}
          onCancel={() => setIsModalOpen(false)}
          submitLabel={editingLag ? 'Обновить' : 'Создать'}
        />
      </Modal>
    </div>
  );
}
