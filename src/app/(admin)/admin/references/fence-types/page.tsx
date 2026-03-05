'use client';

import { useState, useEffect } from 'react';
import { DataTable } from '@/components/admin/References/DataTable';
import { ReferenceForm } from '@/components/admin/References/ReferenceForm';
import { Modal } from '@/components/ui/modal';
import { FenceTypeInput } from '@/lib/validators/fenceType';

interface FenceType {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  difficultyCoef: number;
  postSpacing: number;
  defaultLagRows: number;
  active: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export default function FenceTypesPage() {
  const [types, setTypes] = useState<FenceType[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<FenceType | null>(null);
  const [formValues, setFormValues] = useState<Partial<FenceTypeInput>>({});

  const pageSize = 20;

  const fetchTypes = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        ...(search && { search }),
      });

      const response = await fetch(`/api/admin/materials/fence-types?${params}`);
      const data = await response.json();

      if (response.ok) {
        setTypes(data.types);
        setTotal(data.total);
      } else {
        console.error('Error fetching fence types:', data.error);
      }
    } catch (error) {
      console.error('Error fetching fence types:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTypes();
  }, [page, search]);

  const handleAdd = () => {
    setEditingType(null);
    setFormValues({
      name: '',
      description: '',
      difficultyCoef: 1.0,
      postSpacing: 2.5,
      defaultLagRows: 2,
      active: true,
      sortOrder: 0,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (type: FenceType) => {
    setEditingType(type);
    setFormValues({
      name: type.name,
      description: type.description || '',
      image: type.image || '',
      difficultyCoef: type.difficultyCoef,
      postSpacing: type.postSpacing,
      defaultLagRows: (type.defaultLagRows === 2 || type.defaultLagRows === 3 ? type.defaultLagRows : 2) as 2 | 3,
      active: type.active,
      sortOrder: type.sortOrder,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (type: FenceType) => {
    if (!confirm(`Удалить тип забора "${type.name}"?`)) return;

    try {
      const response = await fetch(`/api/admin/materials/fence-types/${type.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchTypes();
      } else {
        const data = await response.json();
        alert(data.error || 'Ошибка удаления');
      }
    } catch (error) {
      console.error('Error deleting fence type:', error);
      alert('Ошибка удаления');
    }
  };

  const handleToggleActive = async (type: FenceType) => {
    try {
      const response = await fetch(`/api/admin/materials/fence-types/${type.id}`, {
        method: 'PATCH',
      });

      if (response.ok) {
        fetchTypes();
      } else {
        const data = await response.json();
        alert(data.error || 'Ошибка изменения статуса');
      }
    } catch (error) {
      console.error('Error toggling fence type:', error);
      alert('Ошибка изменения статуса');
    }
  };

  const handleFormChange = (name: string, value: any) => {
    if (name === 'defaultLagRows') {
      value = value === 2 || value === 3 ? value : 2;
    }
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingType
        ? `/api/admin/materials/fence-types/${editingType.id}`
        : '/api/admin/materials/fence-types';
      const method = editingType ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formValues),
      });

      if (response.ok) {
        setIsModalOpen(false);
        fetchTypes();
      } else {
        const data = await response.json();
        alert(data.error || 'Ошибка сохранения');
      }
    } catch (error) {
      console.error('Error saving fence type:', error);
      alert('Ошибка сохранения');
    }
  };

  const columns = [
    { key: 'name', label: 'Название' },
    { key: 'description', label: 'Описание' },
    {
      key: 'difficultyCoef',
      label: 'Коэф. сложности',
      render: (type: FenceType) => type.difficultyCoef.toFixed(2),
    },
    {
      key: 'postSpacing',
      label: 'Шаг столбов (м)',
      render: (type: FenceType) => type.postSpacing.toFixed(1),
    },
    { key: 'defaultLagRows', label: 'Кол-во лаг' },
    { key: 'sortOrder', label: 'Порядок' },
    { key: 'active', label: 'Активен' },
  ];

  const formFields = [
    { name: 'name', label: 'Название', type: 'text' as const, required: true },
    { name: 'description', label: 'Описание', type: 'textarea' as const },
    {
      name: 'difficultyCoef',
      label: 'Коэффициент сложности',
      type: 'number' as const,
      required: true,
      min: 0.5,
      max: 3.0,
      step: 0.1,
    },
    {
      name: 'postSpacing',
      label: 'Шаг установки столбов (м)',
      type: 'number' as const,
      required: true,
      min: 1.5,
      max: 4.0,
      step: 0.1,
    },
    {
      name: 'defaultLagRows',
      label: 'Количество лаг',
      type: 'select' as const,
      required: true,
      options: [
        { value: '2', label: '2 ряда' },
        { value: '3', label: '3 ряда' },
      ],
    },
    { name: 'sortOrder', label: 'Порядок сортировки', type: 'number' as const },
    { name: 'active', label: 'Активен', type: 'checkbox' as const },
  ];

  return (
    <div className="container mx-auto py-8">
      <DataTable
        title="Типы заборов"
        columns={columns}
        data={types}
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
        title={editingType ? 'Редактировать тип забора' : 'Создать тип забора'}
      >
        <ReferenceForm
          fields={formFields}
          values={formValues}
          onChange={handleFormChange}
          onSubmit={handleFormSubmit}
          onCancel={() => setIsModalOpen(false)}
          submitLabel={editingType ? 'Обновить' : 'Создать'}
        />
      </Modal>
    </div>
  );
}
