'use client';

import { useState, useEffect } from 'react';
import { DataTable } from '@/components/admin/References/DataTable';
import { ReferenceForm } from '@/components/admin/References/ReferenceForm';
import { Modal } from '@/components/ui/modal';
import { SimplifiedPurchasePriceInput } from '@/components/admin/References/SimplifiedPurchasePriceInput';
import { calculateMargin, getMarginEmoji } from '@/lib/utils/marginCalculator';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';

interface LagType {
  id: string;
  name: string;
  description: string | null;
  width: number;
  height: number;
  metalThickness: number;
  basePricePerMeter: number;
  length: number;
  purchasePricePerMeter: number | null;
  image: string | null;
  active: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface SessionUser {
  id: string;
  email: string;
  name?: string | null;
  role: 'ADMIN' | 'MANAGER' | 'CONTENT_MANAGER';
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

  const fetchLags = async () => {
    console.log('[LAGS PAGE] Fetching lags, page:', page, 'pageSize:', pageSize);
    setIsLoading(true);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        ...(search && { search }),
      });

      console.log('[LAGS PAGE] Fetch request:', `/api/admin/lag-types?${params}`);

      const response = await fetch(`/api/admin/lag-types?${params}`);
      const data = await response.json();

      console.log('[LAGS PAGE] Response status:', response.status);
      console.log('[LAGS PAGE] Response data:', JSON.stringify(data, null, 2));

      if (response.ok) {
        setLags(data.lags);
        setTotal(data.total);
        console.log('[LAGS PAGE] Set lags:', data.lags.length);
      } else {
        console.error('[LAGS PAGE] Error fetching lag types:', data.error);
      }
    } catch (error) {
      console.error('[LAGS PAGE] Error fetching lag types:', error);
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
      basePricePerMeter: 150,
      length: 2.5,
      purchasePricePerMeter: null,
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
      length: lag.length,
      purchasePricePerMeter: lag.purchasePricePerMeter,
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
        toast.success('Лага успешно удалена');
        fetchLags();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Ошибка удаления');
      }
    } catch (error) {
      console.error('Error deleting lag type:', error);
      toast.error('Ошибка удаления');
    }
  };

  const handleToggleActive = async (lag: LagType) => {
    try {
      const response = await fetch(`/api/admin/lag-types/${lag.id}`, {
        method: 'PATCH',
      });

      if (response.ok) {
        toast.success('Статус изменен');
        fetchLags();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Ошибка изменения статуса');
      }
    } catch (error) {
      console.error('Error toggling lag type:', error);
      toast.error('Ошибка изменения статуса');
    }
  };

  const handleFormChange = (name: string, value: any) => {
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handlePurchasePriceChange = (value: number | null) => {
    setFormValues((prev) => ({ ...prev, purchasePricePerMeter: value }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    console.log('[LAGS PAGE] ========== FORM SUBMIT STARTED ==========');
    console.log('[LAGS PAGE] Event type:', e.type);
    console.log('[LAGS PAGE] Event target:', e.target);
    
    e.preventDefault();
    console.log('[LAGS PAGE] preventDefault called');
    
    console.log('[LAGS PAGE] Form values:', JSON.stringify(formValues, null, 2));
    console.log('[LAGS PAGE] Editing lag:', editingLag ? editingLag.id : 'new');

    try {
      const url = editingLag
        ? `/api/admin/lag-types/${editingLag.id}`
        : '/api/admin/lag-types';
      const method = editingLag ? 'PUT' : 'POST';
      
      console.log('[LAGS PAGE] Sending request:', method, url);
      console.log('[LAGS PAGE] Request body:', JSON.stringify(formValues, null, 2));

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formValues),
      });
      
      console.log('[LAGS PAGE] Response status:', response.status);
      console.log('[LAGS PAGE] Response OK:', response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log('[LAGS PAGE] Success response:', data);
        toast.success(editingLag ? 'Лага успешно обновлена' : 'Лага успешно создана');
        setIsModalOpen(false);
        fetchLags();
      } else {
        const data = await response.json();
        console.error('[LAGS PAGE] Error response:', data);
        
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
      console.error('[LAGS PAGE] Exception:', error);
      toast.error('Ошибка сохранения');
    }
    
    console.log('[LAGS PAGE] ========== FORM SUBMIT ENDED ==========');
  };

  const isAdmin = currentUser?.role === 'ADMIN';

  const columns = [
    { key: 'name', label: 'Название' },
    { key: 'description', label: 'Описание' },
    { 
      key: 'section', 
      label: 'Сечение', 
      render: (lag: LagType) => `${lag.width}x${lag.height} мм`
    },
    { 
      key: 'metalThickness', 
      label: 'Толщина металла', 
      render: (lag: LagType) => `${lag.metalThickness} мм`
    },
    { 
      key: 'length', 
      label: 'Длина', 
      render: (lag: LagType) => `${lag.length} м`
    },
    { 
      key: 'basePricePerMeter', 
      label: 'Розничная стоимость', 
      render: (lag: LagType) => `${lag.basePricePerMeter} ₽/м.п.`
    },
    ...(isAdmin ? [{
      key: 'purchasePricePerMeter' as const,
      label: 'Цена закупки за ед.',
      render: (lag: LagType) => {
        if (lag.purchasePricePerMeter === null) {
          return <span className="text-gray-400">Не указана</span>;
        }
        const margin = calculateMargin(lag.basePricePerMeter, lag.purchasePricePerMeter);
        const marginEmoji = getMarginEmoji(margin?.marginPercent ?? null);
        return (
          <span title={`Цена закупки: ${lag.purchasePricePerMeter} ₽/м.п.\nМаржа: ${margin?.marginPercent.toFixed(1)}%`}>
            {lag.purchasePricePerMeter} ₽/м.п. {marginEmoji}
          </span>
        );
      }
    }] : []),
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
      name: 'length',
      label: 'Длина (м)',
      type: 'number' as const,
      required: true,
      min: 1.5,
      max: 6.0,
      step: 0.1,
    },
    {
      name: 'basePricePerMeter',
      label: 'Розничная стоимость (руб/м.п.)',
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
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <ReferenceForm
            fields={formFields}
            values={formValues}
            onChange={handleFormChange}
            onSubmit={handleFormSubmit}
            onCancel={() => setIsModalOpen(false)}
            submitLabel={editingLag ? 'Обновить' : 'Создать'}
            renderForm={false}
            showButtons={false}
          />

          {isAdmin && (
            <div className="mt-6">
              <SimplifiedPurchasePriceInput
                purchasePricePerMeter={formValues.purchasePricePerMeter ?? null}
                basePricePerMeter={formValues.basePricePerMeter || 0}
                onChange={handlePurchasePriceChange}
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                console.log('[LAGS PAGE] Cancel button clicked');
                setIsModalOpen(false);
              }}
            >
              Отмена
            </Button>
            <Button 
              type="submit"
              onClick={() => {
                console.log('[LAGS PAGE] Submit button clicked');
              }}
            >
              {editingLag ? 'Обновить' : 'Создать'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
