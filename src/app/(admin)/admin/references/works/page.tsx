'use client';

import { useState, useEffect } from 'react';
import { DataTable } from '@/components/admin/References/DataTable';
import { Modal } from '@/components/ui/modal';
import { formatPrice } from '@/lib/utils/formatters';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';
import { X, Plus } from 'lucide-react';

interface Relation {
  id: string;
  fenceType: string;
  fenceTypeName?: string;
}

interface Work {
  id: string;
  name: string;
  description: string | null;
  category: string;
  categoryName: string;
  unit: string;
  unitName: string;
  price: number;
  useInCalculator: boolean;
  active: boolean;
  sortOrder: number;
  relations: Relation[];
  createdAt: string;
  updatedAt: string;
}

interface SessionUser {
  id: string;
  email: string;
  name?: string | null;
  role: 'ADMIN' | 'MANAGER' | 'CONTENT_MANAGER';
}

interface FenceType {
  value: string;
  label: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  MOUNTING: 'Монтаж',
  DELIVERY: 'Доставка',
  ADDITIONAL: 'Доп.работы',
  MEASUREMENT: 'Замер',
};

const UNIT_LABELS: Record<string, string> = {
  M: 'м',
  KM: 'км',
  PCS: 'шт',
  FIXED: 'фикс.',
  M2: 'м²',
};

export default function WorksPage() {
  const [items, setItems] = useState<Work[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Work | null>(null);
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [fenceTypes, setFenceTypes] = useState<FenceType[]>([]);
  
  const [formValues, setFormValues] = useState<{
    name: string;
    description: string;
    category: string;
    unit: string;
    price: number;
    useInCalculator: boolean;
    sortOrder: number;
    active: boolean;
    relations: { fenceType: string }[];
  }>({
    name: '',
    description: '',
    category: '',
    unit: '',
    price: 0,
    useInCalculator: false,
    sortOrder: 0,
    active: true,
    relations: [],
  });

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

  useEffect(() => {
    fetch('/api/admin/works/fence-types')
      .then((res) => res.json())
      .then((data) => {
        setFenceTypes(data);
      })
      .catch((err) => console.error('Error fetching fence types:', err));
  }, []);

  const fetchItems = async () => {
    setIsLoading(true);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        ...(search && { search }),
        ...(category && { category }),
      });

      const response = await fetch(`/api/admin/works?${params}`);
      const data = await response.json();

      if (response.ok) {
        setItems(data.items);
        setTotal(data.total);
      } else {
        console.error('Error fetching works:', data.error);
      }
    } catch (error) {
      console.error('Error fetching works:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [page, search, category]);

  const handleAdd = () => {
    setEditingItem(null);
    setFormValues({
      name: '',
      description: '',
      category: '',
      unit: '',
      price: 0,
      useInCalculator: false,
      sortOrder: 0,
      active: true,
      relations: [],
    });
    setIsModalOpen(true);
  };

  const handleEdit = (item: Work) => {
    setEditingItem(item);
    setFormValues({
      name: item.name,
      description: item.description || '',
      category: item.category,
      unit: item.unit,
      price: item.price,
      useInCalculator: item.useInCalculator,
      sortOrder: item.sortOrder,
      active: item.active,
      relations: item.relations.map((r) => ({
        fenceType: r.fenceType,
      })),
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (item: Work) => {
    if (!confirm(`Удалить "${item.name}"?`)) return;

    try {
      const response = await fetch(`/api/admin/works/${item.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Работа успешно удалена');
        fetchItems();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Ошибка удаления');
      }
    } catch (error) {
      console.error('Error deleting work:', error);
      toast.error('Ошибка удаления');
    }
  };

  const handleToggleActive = async (item: Work) => {
    try {
      const response = await fetch(`/api/admin/works/${item.id}`, {
        method: 'PATCH',
      });

      if (response.ok) {
        toast.success('Статус изменен');
        fetchItems();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Ошибка изменения статуса');
      }
    } catch (error) {
      console.error('Error toggling work:', error);
      toast.error('Ошибка изменения статуса');
    }
  };

  const handleFormChange = (name: string, value: any) => {
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const addRelation = () => {
    setFormValues((prev) => ({
      ...prev,
      relations: [...prev.relations, { fenceType: 'PROFNASTIL' }],
    }));
  };

  const removeRelation = (index: number) => {
    setFormValues((prev) => ({
      ...prev,
      relations: prev.relations.filter((_, i) => i !== index),
    }));
  };

  const updateRelation = (index: number, fenceType: string) => {
    setFormValues((prev) => {
      const newRelations = [...prev.relations];
      newRelations[index] = { fenceType };
      return { ...prev, relations: newRelations };
    });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingItem
        ? `/api/admin/works/${editingItem.id}`
        : '/api/admin/works';
      const method = editingItem ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formValues),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(editingItem ? 'Работа успешно обновлена' : 'Работа успешно создана');
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
      key: 'category',
      label: 'Категория',
      render: (item: Work) => item.categoryName,
    },
    {
      key: 'unit',
      label: 'Единица',
      render: (item: Work) => item.unitName,
    },
    {
      key: 'price',
      label: 'Стоимость (₽)',
      render: (item: Work) => formatPrice(item.price) + `/${item.unitName}`,
    },
    {
      key: 'relations',
      label: 'Привязка',
      render: (item: Work) => {
        if (!item.relations || item.relations.length === 0) {
          return <span className="text-gray-400">—</span>;
        }
        const names = item.relations.map((r) => r.fenceTypeName || r.fenceType);
        return <span className="text-sm">{names.join(', ')}</span>;
      },
    },
    {
      key: 'useInCalculator',
      label: 'В калькуляторе',
      render: (item: Work) => {
        return item.useInCalculator ? (
          <span className="text-green-600">✓</span>
        ) : (
          <span className="text-gray-400">—</span>
        );
      },
    },
    {
      key: 'active',
      label: 'Активен',
      render: (item: Work) => {
        return item.active ? (
          <span className="text-green-600">✓</span>
        ) : (
          <span className="text-red-600">✗</span>
        );
      },
    },
  ];

  return (
    <div className="container mx-auto py-8">
      <DataTable
        title="Работы по монтажу"
        columns={columns}
        data={items}
        total={total}
        page={page}
        pageSize={pageSize}
        searchPlaceholder="Поиск по названию..."
        onSearch={setSearch}
        onPageChange={setPage}
        onAdd={isAdmin ? handleAdd : undefined}
        onEdit={isAdmin ? handleEdit : undefined}
        onDelete={isAdmin ? handleDelete : undefined}
        onToggleActive={isAdmin ? handleToggleActive : undefined}
        isLoading={isLoading}
        filters={[
          {
            key: 'category',
            label: 'Категория',
            value: category,
            onChange: setCategory,
            options: Object.entries(CATEGORY_LABELS).map(([value, label]) => ({
              value,
              label,
            })),
          },
        ]}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Редактировать работу' : 'Создать работу'}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Название *</label>
            <input
              type="text"
              value={formValues.name}
              onChange={(e) => handleFormChange('name', e.target.value)}
              className="w-full border rounded px-3 py-2"
              required
              minLength={2}
              maxLength={200}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Описание</label>
            <textarea
              value={formValues.description}
              onChange={(e) => handleFormChange('description', e.target.value)}
              className="w-full border rounded px-3 py-2"
              rows={3}
              maxLength={1000}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Категория *</label>
              <select
                value={formValues.category}
                onChange={(e) => handleFormChange('category', e.target.value)}
                className="w-full border rounded px-3 py-2"
                required
              >
                <option value="">Выберите категорию</option>
                {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Единица измерения *</label>
              <select
                value={formValues.unit}
                onChange={(e) => handleFormChange('unit', e.target.value)}
                className="w-full border rounded px-3 py-2"
                required
              >
                <option value="">Выберите единицу</option>
                {Object.entries(UNIT_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Стоимость за единицу (₽) *</label>
            <input
              type="number"
              value={formValues.price}
              onChange={(e) => handleFormChange('price', parseFloat(e.target.value) || 0)}
              className="w-full border rounded px-3 py-2"
              min={0}
              step={0.01}
              required
            />
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Расчёт в калькуляторе</h4>
            
            <div className="flex items-center gap-2 mb-3">
              <input
                type="checkbox"
                id="useInCalculator"
                checked={formValues.useInCalculator}
                onChange={(e) => handleFormChange('useInCalculator', e.target.checked)}
                className="rounded"
              />
              <label htmlFor="useInCalculator" className="text-sm font-medium">
                Использовать в калькуляторе
              </label>
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Привязка к типам заборов</h4>
            
            <div className="space-y-2 border rounded p-3 bg-gray-50">
              {formValues.relations.map((rel, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <select
                    value={rel.fenceType}
                    onChange={(e) => updateRelation(index, e.target.value)}
                    className="border rounded px-2 py-1 flex-1"
                  >
                    {fenceTypes.map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRelation(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addRelation}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Добавить тип забора
              </Button>
              <p className="text-xs text-gray-500 mt-2">
                Привязка устанавливается вручную в карточке работы
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Порядок сортировки</label>
            <input
              type="number"
              value={formValues.sortOrder}
              onChange={(e) => handleFormChange('sortOrder', parseInt(e.target.value) || 0)}
              className="w-full border rounded px-3 py-2"
              min={0}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="active"
              checked={formValues.active}
              onChange={(e) => handleFormChange('active', e.target.checked)}
              className="rounded"
            />
            <label htmlFor="active" className="text-sm font-medium">Активен</label>
          </div>

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
