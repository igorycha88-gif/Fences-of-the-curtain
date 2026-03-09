'use client';

import { useState, useEffect } from 'react';
import { DataTable } from '@/components/admin/References/DataTable';
import { Modal } from '@/components/ui/modal';
import { SimplifiedPurchasePriceInput } from '@/components/admin/References/SimplifiedPurchasePriceInput';
import { calculateMargin, getMarginEmoji } from '@/lib/utils/marginCalculator';
import { formatDimension, formatPrice, formatSection } from '@/lib/utils/formatters';
import { LAGS_COLUMN_TOOLTIPS } from '@/lib/constants/columnTooltips';
import { ColumnHeaderWithTooltip } from '@/components/admin/References/ColumnHeaderWithTooltip';
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
  validFrom: string | null;
  expirationDate: string | null;
  createdAt: string;
  updatedAt: string;
}

interface SessionUser {
  id: string;
  email: string;
  name?: string | null;
  role: 'ADMIN' | 'MANAGER' | 'CONTENT_MANAGER';
}

interface DuplicateWarning {
  type: string;
  message: string;
  duplicates: Array<{
    id: string;
    name: string;
    basePricePerMeter: number;
    validFrom: string | null;
    expirationDate: string | null;
    active: boolean;
  }>;
  suggestions: {
    setExpirationForExisting: string | null;
  };
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

export default function LagsPage() {
  const [lags, setLags] = useState<LagType[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [validityFilter, setValidityFilter] = useState<'all' | 'active' | 'expired' | 'expiring_soon'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLag, setEditingLag] = useState<LagType | null>(null);
  const [formValues, setFormValues] = useState<Partial<LagType> & { confirmDuplicate?: boolean; updateExistingExpiration?: string }>({});
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<DuplicateWarning | null>(null);

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
    setIsLoading(true);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        validityFilter,
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
  }, [page, search, validityFilter]);

  const handleAdd = () => {
    setEditingLag(null);
    setDuplicateWarning(null);
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
      validFrom: null,
      expirationDate: null,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (lag: LagType) => {
    setEditingLag(lag);
    setDuplicateWarning(null);
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
      validFrom: lag.validFrom,
      expirationDate: lag.expirationDate,
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

  const handleConfirmDuplicate = () => {
    if (duplicateWarning?.duplicates[0]) {
      setFormValues((prev) => ({
        ...prev,
        confirmDuplicate: true,
        updateExistingExpiration: duplicateWarning.duplicates[0].id,
      }));
      setDuplicateWarning(null);
    }
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

      const data = await response.json();

      if (response.ok) {
        if (data.warning) {
          setDuplicateWarning(data.warning);
          return;
        }
        toast.success(editingLag ? 'Лага успешно обновлена' : 'Лага успешно создана');
        setIsModalOpen(false);
        fetchLags();
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
      key: 'section', 
      label: <ColumnHeaderWithTooltip title="Сечение (мм)" tooltip={LAGS_COLUMN_TOOLTIPS.section} />, 
      render: (lag: LagType) => formatSection(lag.width, lag.height)
    },
    { 
      key: 'metalThickness', 
      label: <ColumnHeaderWithTooltip title="Толщина металла (мм)" tooltip={LAGS_COLUMN_TOOLTIPS.metalThickness} />, 
      render: (lag: LagType) => formatDimension(lag.metalThickness)
    },
    { 
      key: 'length', 
      label: <ColumnHeaderWithTooltip title="Длина (м)" tooltip={LAGS_COLUMN_TOOLTIPS.length} />, 
      render: (lag: LagType) => formatDimension(lag.length)
    },
    { 
      key: 'basePricePerMeter', 
      label: <ColumnHeaderWithTooltip title="Розничная стоимость (₽)" tooltip={LAGS_COLUMN_TOOLTIPS.basePricePerMeter} />, 
      render: (lag: LagType) => formatPrice(lag.basePricePerMeter)
    },
    {
      key: 'validFrom',
      label: 'Дата начала',
      render: (lag: LagType) => (
        <span className={lag.validFrom ? '' : 'text-gray-400'}>
          {formatValidFrom(lag.validFrom)}
        </span>
      ),
    },
    {
      key: 'expirationDate',
      label: 'Срок действия',
      render: (lag: LagType) => {
        const isExpired = lag.expirationDate && new Date(lag.expirationDate) < new Date();
        const isExpiringSoon = lag.expirationDate && !isExpired && 
          new Date(lag.expirationDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        return (
          <span className={
            isExpired ? 'text-red-500' : 
            isExpiringSoon ? 'text-yellow-600' : 
            !lag.expirationDate ? 'text-gray-400' : ''
          }>
            {formatDate(lag.expirationDate)}
          </span>
        );
      },
    },
    ...(isAdmin ? [{
      key: 'purchasePricePerMeter' as const,
      label: <ColumnHeaderWithTooltip title="Цена закупки за ед. (₽)" tooltip={LAGS_COLUMN_TOOLTIPS.purchasePricePerMeter} />,
      render: (lag: LagType) => {
        if (lag.purchasePricePerMeter === null) {
          return <span className="text-gray-400">Не указана</span>;
        }
        const margin = calculateMargin(lag.basePricePerMeter, lag.purchasePricePerMeter);
        const marginEmoji = getMarginEmoji(margin?.marginPercent ?? null);
        return (
          <span title={`Цена закупки: ${lag.purchasePricePerMeter} ₽\nМаржа: ${margin?.marginPercent.toFixed(1)}%`}>
            {formatPrice(lag.purchasePricePerMeter)} {marginEmoji}
          </span>
        );
      }
    }] : []),
    { 
      key: 'active', 
      label: 'Активен',
      render: (lag: LagType) => (
        <button
          onClick={() => handleToggleActive(lag)}
          className="cursor-pointer hover:scale-110 transition-transform duration-200 inline-flex items-center justify-center min-h-[44px] min-w-[44px]"
          title="Нажмите, чтобы изменить статус"
        >
          {lag.active ? (
            <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          )}
        </button>
      )
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
        onClose={() => { setIsModalOpen(false); setDuplicateWarning(null); }}
        title={editingLag ? 'Редактировать лагу' : 'Создать лагу'}
      >
        {duplicateWarning ? (
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
              <h3 className="font-semibold text-yellow-800 mb-2">Номенклатура с такими параметрами уже существует</h3>
              {duplicateWarning.duplicates.map((dup) => (
                <div key={dup.id} className="bg-white p-3 rounded mb-2 text-sm">
                  <div className="font-medium">{dup.name || 'Без названия'}</div>
                  <div>Розничная цена: {dup.basePricePerMeter} ₽</div>
                  <div>Период: {formatValidFrom(dup.validFrom)} - {formatDate(dup.expirationDate)}</div>
                  <div>Статус: {dup.active ? 'Активна' : 'Неактивна'}</div>
                </div>
              ))}
              <p className="text-sm text-yellow-700 mt-2">
                Для создания новой номенклатуры цена должна отличаться и период не должен пересекаться.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setDuplicateWarning(null); setIsModalOpen(false); }}>
                Отмена
              </Button>
              <Button onClick={handleConfirmDuplicate}>
                Автоматически установить срок действия для существующей
              </Button>
            </div>
          </div>
        ) : (
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Ширина сечения (мм) *</label>
                <input
                  type="number"
                  value={formValues.width || ''}
                  onChange={(e) => handleFormChange('width', parseFloat(e.target.value))}
                  className="w-full border rounded px-3 py-2"
                  min={20}
                  max={100}
                  step={1}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Высота сечения (мм) *</label>
                <input
                  type="number"
                  value={formValues.height || ''}
                  onChange={(e) => handleFormChange('height', parseFloat(e.target.value))}
                  className="w-full border rounded px-3 py-2"
                  min={20}
                  max={100}
                  step={1}
                  required
                />
              </div>
            </div>

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
              <div>
                <label className="block text-sm font-medium mb-1">Длина (м) *</label>
                <input
                  type="number"
                  value={formValues.length || ''}
                  onChange={(e) => handleFormChange('length', parseFloat(e.target.value))}
                  className="w-full border rounded px-3 py-2"
                  min={1.5}
                  max={6.0}
                  step={0.1}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Розничная стоимость (₽) *</label>
              <input
                type="number"
                value={formValues.basePricePerMeter || ''}
                onChange={(e) => handleFormChange('basePricePerMeter', parseFloat(e.target.value))}
                className="w-full border rounded px-3 py-2"
                min={0}
                step={0.01}
                required
              />
            </div>

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

            {isAdmin && (
              <div className="mt-4">
                <SimplifiedPurchasePriceInput
                  purchasePricePerMeter={formValues.purchasePricePerMeter ?? null}
                  basePricePerMeter={formValues.basePricePerMeter || 0}
                  onChange={handlePurchasePriceChange}
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Отмена
              </Button>
              <Button type="submit">
                {editingLag ? 'Обновить' : 'Создать'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
