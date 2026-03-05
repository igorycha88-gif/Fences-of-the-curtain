'use client';

import { useState, useEffect } from 'react';
import { DataTable } from '@/components/admin/References/DataTable';
import { ReferenceForm } from '@/components/admin/References/ReferenceForm';
import { Modal } from '@/components/ui/modal';

interface CoatingType {
  id: string;
  name: string;
  description: string | null;
  baseCost: number;
  markupCoef: number;
  image: string | null;
  active: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export default function CoatingsPage() {
  const [coatings, setCoatings] = useState<CoatingType[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoating, setEditingCoating] = useState<CoatingType | null>(null);
  const [formValues, setFormValues] = useState<Partial<CoatingType>>({});

  const pageSize = 20;

  const fetchCoatings = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        ...(search && { search }),
      });

      const response = await fetch(`/api/admin/coating-types?${params}`);
      const data = await response.json();

      if (response.ok) {
        setCoatings(data.coatings);
        setTotal(data.total);
      } else {
        console.error('Error fetching coating types:', data.error);
      }
    } catch (error) {
      console.error('Error fetching coating types:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCoatings();
  }, [page, search]);

  const handleAdd = () => {
    setEditingCoating(null);
    setFormValues({
      name: '',
      description: '',
      baseCost: 0,
      markupCoef: 1.0,
      active: true,
      sortOrder: 0,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (coating: CoatingType) => {
    setEditingCoating(coating);
    setFormValues({
      name: coating.name,
      description: coating.description || '',
      baseCost: coating.baseCost,
      markupCoef: coating.markupCoef,
      active: coating.active,
      sortOrder: coating.sortOrder,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (coating: CoatingType) => {
    if (!confirm(`Удалить тип покрытия "${coating.name}"?`)) return;

    try {
      const response = await fetch(`/api/admin/coating-types/${coating.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchCoatings();
      } else {
        const data = await response.json();
        alert(data.error || 'Ошибка удаления');
      }
    } catch (error) {
      console.error('Error deleting coating type:', error);
      alert('Ошибка удаления');
    }
  };

  const handleToggleActive = async (coating: CoatingType) => {
    try {
      const response = await fetch(`/api/admin/coating-types/${coating.id}`, {
        method: 'PATCH',
      });

      if (response.ok) {
        fetchCoatings();
      } else {
        const data = await response.json();
        alert(data.error || 'Ошибка изменения статуса');
      }
    } catch (error) {
      console.error('Error toggling coating type:', error);
      alert('Ошибка изменения статуса');
    }
  };

  const handleFormChange = (name: string, value: any) => {
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingCoating
        ? `/api/admin/coating-types/${editingCoating.id}`
        : '/api/admin/coating-types';
      const method = editingCoating ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formValues),
      });

      if (response.ok) {
        setIsModalOpen(false);
        fetchCoatings();
      } else {
        const data = await response.json();
        alert(data.error || 'Ошибка сохранения');
      }
    } catch (error) {
      console.error('Error saving coating type:', error);
      alert('Ошибка сохранения');
    }
  };

  const columns = [
    { key: 'name', label: 'Название' },
    { key: 'description', label: 'Описание' },
    {
      key: 'baseCost',
      label: 'Базовая стоимость (руб/м²)',
      render: (coating: CoatingType) => coating.baseCost.toFixed(2),
    },
    {
      key: 'markupCoef',
      label: 'Коэф. наценки',
      render: (coating: CoatingType) => coating.markupCoef.toFixed(2),
    },
    { key: 'sortOrder', label: 'Порядок' },
    { key: 'active', label: 'Активен' },
  ];

  const formFields = [
    { name: 'name', label: 'Название', type: 'text' as const, required: true },
    { name: 'description', label: 'Описание', type: 'textarea' as const },
    {
      name: 'baseCost',
      label: 'Базовая стоимость (руб/м²)',
      type: 'number' as const,
      required: true,
      min: 0,
      step: 0.01,
    },
    {
      name: 'markupCoef',
      label: 'Коэффициент наценки',
      type: 'number' as const,
      required: true,
      min: 1.0,
      max: 3.0,
      step: 0.01,
    },
    { name: 'sortOrder', label: 'Порядок сортировки', type: 'number' as const },
    { name: 'active', label: 'Активен', type: 'checkbox' as const },
  ];

  return (
    <div className="container mx-auto py-8">
      <DataTable
        title="Типы покрытия"
        columns={columns}
        data={coatings}
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
        title={editingCoating ? 'Редактировать тип покрытия' : 'Создать тип покрытия'}
      >
        <ReferenceForm
          fields={formFields}
          values={formValues}
          onChange={handleFormChange}
          onSubmit={handleFormSubmit}
          onCancel={() => setIsModalOpen(false)}
          submitLabel={editingCoating ? 'Обновить' : 'Создать'}
        />
      </Modal>
    </div>
  );
}
