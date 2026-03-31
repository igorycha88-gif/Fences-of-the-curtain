'use client';

import { useState, useEffect } from 'react';
import { DataTable } from '@/components/admin/References/DataTable';
import { Modal } from '@/components/ui/modal';
import { getMarginEmoji } from '@/lib/utils/marginCalculator';
import { calculatePricePerUnit, calculatePicketMargin } from '@/lib/utils/priceCalculator';
import { formatDimension, formatPrice } from '@/lib/utils/formatters';
import { PriorityColumn } from '@/components/admin/References/shared';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { RelatedMountingHardware } from '@/components/admin/References/RelatedMountingHardware';
import { RelatedWorks } from '@/components/admin/Works/RelatedWorks';
import { RelatedWorksByReference } from '@/components/admin/Works/RelatedWorksByReference';

interface PicketProfileType {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
  active: boolean;
}

interface PicketCoating {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
  active: boolean;
}

interface PicketType {
  id: string;
  name: string;
  description: string | null;
  metalThickness: number;
  width: number;
  length: number;
  color: string | null;
  purchasePricePerMeter: number | null;
  retailPricePerMeter: number;
  purchasePricePerUnit?: number | null;
  retailPricePerUnit?: number | null;
  validFrom: string | null;
  validUntil: string | null;
  active: boolean;
  image: string | null;
  priority: number;
  createdAt: string;
  updatedAt: string;
  profileTypeId: string;
  coatingId: string;
  picketProfile?: PicketProfileType;
  picketCoatingType?: PicketCoating;
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

export default function PicketPage() {
  const [pickets, setPickets] = useState<PicketType[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [validityFilter, setValidityFilter] = useState<'all' | 'active' | 'expired' | 'expiring_soon'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PicketType | null>(null);
  const [formValues, setFormValues] = useState<Partial<PicketType>>({});
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [profileTypes, setProfileTypes] = useState<PicketProfileType[]>([]);
  const [coatings, setCoatings] = useState<PicketCoating[]>([]);

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

    fetch('/api/admin/picket-profile-types')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setProfileTypes(data);
        }
      })
      .catch((err) => console.error('Error fetching profile types:', err));

    fetch('/api/admin/picket-coatings')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCoatings(data);
        }
      })
      .catch((err) => console.error('Error fetching coatings:', err));
  }, []);

  const fetchPickets = async () => {
    setIsLoading(true);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        validityFilter,
        ...(search && { search }),
      });

      const response = await fetch(`/api/admin/picket-types?${params}`);
      const data = await response.json();

      if (response.ok) {
        setPickets(data.pickets);
        setTotal(data.total);
      } else {
        console.error('Error fetching picket types:', data.error);
      }
    } catch (error) {
      console.error('Error fetching picket types:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPickets();
  }, [page, search, validityFilter]);

  const handleAdd = () => {
    setEditingItem(null);
    setFormValues({
      name: '',
      description: '',
      metalThickness: 0.5,
      width: 125,
      length: 2000,
      profileTypeId: profileTypes[0]?.id || '',
      coatingId: coatings[0]?.id || '',
      color: '',
      purchasePricePerMeter: null,
      retailPricePerMeter: 0,
      active: true,
      validFrom: null,
      validUntil: null,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (item: PicketType) => {
    setEditingItem(item);
    setFormValues({
      name: item.name,
      description: item.description || '',
      metalThickness: item.metalThickness,
      width: item.width,
      length: item.length,
      profileTypeId: item.profileTypeId,
      coatingId: item.coatingId,
      color: item.color || '',
      purchasePricePerMeter: item.purchasePricePerMeter,
      retailPricePerMeter: item.retailPricePerMeter,
      active: item.active,
      validFrom: item.validFrom,
      validUntil: item.validUntil,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (item: PicketType) => {
    if (!confirm(`Удалить "${item.name}"?`)) return;

    try {
      const response = await fetch(`/api/admin/picket-types/${item.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Номенклатура успешно удалена');
        fetchPickets();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Ошибка удаления');
      }
    } catch (error) {
      console.error('Error deleting picket type:', error);
      toast.error('Ошибка удаления');
    }
  };

  const handleToggleActive = async (item: PicketType) => {
    try {
      const response = await fetch(`/api/admin/picket-types/${item.id}`, {
        method: 'PATCH',
      });

      if (response.ok) {
        toast.success('Статус изменен');
        fetchPickets();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Ошибка изменения статуса');
      }
    } catch (error) {
      console.error('Error toggling picket type:', error);
      toast.error('Ошибка изменения статуса');
    }
  };

  const handlePriorityChange = async (id: string, newPriority: number) => {
    const response = await fetch('/api/admin/picket-types/reorder', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, newPriority }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Ошибка изменения приоритета');
    }

    fetchPickets();
  };

  const handleFormChange = (name: string, value: any) => {
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingItem
        ? `/api/admin/picket-types/${editingItem.id}`
        : '/api/admin/picket-types';
      const method = editingItem ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formValues),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(editingItem ? 'Номенклатура успешно обновлена' : 'Номенклатура успешно создана');
        setIsModalOpen(false);
        fetchPickets();
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

  const calculatedPurchasePricePerUnit = formValues.width && formValues.length && formValues.purchasePricePerMeter
    ? calculatePricePerUnit(formValues.width, formValues.length, formValues.purchasePricePerMeter)
    : null;

  const calculatedRetailPricePerUnit = formValues.width && formValues.length && formValues.retailPricePerMeter
    ? calculatePricePerUnit(formValues.width, formValues.length, formValues.retailPricePerMeter)
    : null;

  const marginInfo = formValues.width && formValues.length && formValues.retailPricePerMeter
    ? calculatePicketMargin(
        formValues.retailPricePerMeter,
        formValues.purchasePricePerMeter,
        formValues.width,
        formValues.length
      )
    : null;

  const columns = [
    { key: 'name', label: 'Название' },
    { 
      key: 'metalThickness', 
      label: 'Толщина (мм)', 
      render: (item: PicketType) => formatDimension(item.metalThickness)
    },
    { 
      key: 'width', 
      label: 'Ширина (мм)', 
      render: (item: PicketType) => formatDimension(item.width)
    },
    { 
      key: 'length', 
      label: 'Длина (мм)', 
      render: (item: PicketType) => formatDimension(item.length)
    },
    { key: 'picketProfile', label: 'Тип профиля', render: (item: PicketType) => item.picketProfile?.name || '-' },
    { key: 'picketCoatingType', label: 'Покрытие', render: (item: PicketType) => item.picketCoatingType?.name || '-' },
    { key: 'color', label: 'Цвет', render: (item: PicketType) => item.color || '-' },
    {
      key: 'retailPricePerUnit',
      label: 'Розница за ед. (₽)',
      render: (item: PicketType) => {
        const price = item.retailPricePerUnit ?? calculatePricePerUnit(item.width, item.length, item.retailPricePerMeter);
        return price !== null ? formatPrice(price) : '-';
      }
    },
    {
      key: 'validUntil',
      label: 'Срок действия',
      render: (item: PicketType) => {
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
    ...(isAdmin ? [{
      key: 'purchasePricePerUnit' as const,
      label: 'Закупка за ед. (₽)',
      render: (item: PicketType) => {
        const price = item.purchasePricePerUnit ?? calculatePricePerUnit(item.width, item.length, item.purchasePricePerMeter);
        if (price === null) {
          return <span className="text-gray-400">Не указана</span>;
        }
        const marginInfo = calculatePicketMargin(
          item.retailPricePerMeter,
          item.purchasePricePerMeter,
          item.width,
          item.length
        );
        const marginEmoji = getMarginEmoji(marginInfo?.marginPerUnitPercent ?? null);
        return (
          <span title={`Цена закупки: ${price} ₽\nМаржа: ${marginInfo?.marginPerUnitPercent?.toFixed(1)}%`}>
            {formatPrice(price)} {marginEmoji}
          </span>
        );
      }
    }] : []),
    { 
      key: 'priority', 
      label: 'Приоритет',
      render: (item: PicketType) => (
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
        title="Евроштакетник"
        columns={columns}
        data={pickets}
        total={total}
        page={page}
        pageSize={pageSize}
        searchPlaceholder="Поиск по названию, цвету, покрытию..."
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
        title={editingItem ? 'Редактировать номенклатуру' : 'Создать номенклатуру'}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto">
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

          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Характеристики</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Толщина металла (мм) *</label>
                <input
                  type="number"
                  value={formValues.metalThickness || ''}
                  onChange={(e) => handleFormChange('metalThickness', parseFloat(e.target.value))}
                  className="w-full border rounded px-3 py-2"
                  min={0.3}
                  max={1.5}
                  step={0.05}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Ширина (мм) *</label>
                <input
                  type="number"
                  value={formValues.width || ''}
                  onChange={(e) => handleFormChange('width', parseInt(e.target.value))}
                  className="w-full border rounded px-3 py-2"
                  min={50}
                  max={200}
                  step={1}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Длина (мм) *</label>
                <input
                  type="number"
                  value={formValues.length || ''}
                  onChange={(e) => handleFormChange('length', parseInt(e.target.value))}
                  className="w-full border rounded px-3 py-2"
                  min={500}
                  max={3000}
                  step={1}
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Тип профиля *</label>
              <select
                value={formValues.profileTypeId || ''}
                onChange={(e) => handleFormChange('profileTypeId', e.target.value)}
                className="w-full border rounded px-3 py-2"
                required
              >
                <option value="">Выберите тип профиля</option>
                {profileTypes.map((pt) => (
                  <option key={pt.id} value={pt.id}>{pt.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Покрытие *</label>
              <select
                value={formValues.coatingId || ''}
                onChange={(e) => handleFormChange('coatingId', e.target.value)}
                className="w-full border rounded px-3 py-2"
                required
              >
                <option value="">Выберите покрытие</option>
                {coatings.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Цвет</label>
              <input
                type="text"
                value={formValues.color || ''}
                onChange={(e) => handleFormChange('color', e.target.value)}
                className="w-full border rounded px-3 py-2"
                placeholder="Например: RAL 8017"
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Цены</h4>
            
            {isAdmin && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Цена за м.п. закупка (₽)</label>
                <input
                  type="number"
                  value={formValues.purchasePricePerMeter ?? ''}
                  onChange={(e) => handleFormChange('purchasePricePerMeter', e.target.value ? parseFloat(e.target.value) : null)}
                  className="w-full border rounded px-3 py-2"
                  min={0}
                  step={0.01}
                />
                <div className="text-sm text-gray-500 mt-1">
                  ↳ Цена закупки за ед.: {calculatedPurchasePricePerUnit !== null ? `${formatPrice(calculatedPurchasePricePerUnit)} ₽` : 'Не указана'}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">Розничная стоимость за м.п. (₽) *</label>
              <input
                type="number"
                value={formValues.retailPricePerMeter || ''}
                onChange={(e) => handleFormChange('retailPricePerMeter', parseFloat(e.target.value))}
                className="w-full border rounded px-3 py-2"
                min={0}
                step={0.01}
                required
              />
              <div className="text-sm text-gray-500 mt-1">
                ↳ Розничная стоимость за ед.: {calculatedRetailPricePerUnit !== null ? `${formatPrice(calculatedRetailPricePerUnit)} ₽` : '-'}
              </div>
            </div>

            {isAdmin && marginInfo && marginInfo.marginPerMeterPercent !== null && (
              <div className="mt-4 p-4 bg-gray-50 rounded border">
                <h5 className="font-medium mb-2">Расчет маржи</h5>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600">За метр погонный:</span>
                    <div className="ml-4">
                      Маржа: {marginInfo.marginPerMeterPercent.toFixed(1)}% {getMarginEmoji(marginInfo.marginPerMeterPercent)}
                      <span className="ml-2 text-gray-500">
                        ({marginInfo.marginPerMeterAbsolute?.toFixed(2)} ₽/м.п.)
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">За единицу (шт):</span>
                    <div className="ml-4">
                      Маржа: {marginInfo.marginPerUnitPercent?.toFixed(1)}% {getMarginEmoji(marginInfo.marginPerUnitPercent)}
                      <span className="ml-2 text-gray-500">
                        ({marginInfo.marginPerUnitAbsolute?.toFixed(2)} ₽/шт)
                      </span>
                    </div>
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
                  onChange={(e) => handleFormChange('validFrom', e.target.value ? new Date(e.target.value) : null)}
                  className="w-full border rounded px-3 py-2"
                />
                <p className="text-xs text-gray-500 mt-1">Пусто = с момента добавления</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Срок действия</label>
                <input
                  type="date"
                  value={formValues.validUntil ? new Date(formValues.validUntil).toISOString().split('T')[0] : ''}
                  onChange={(e) => handleFormChange('validUntil', e.target.value ? new Date(e.target.value) : null)}
                  className="w-full border rounded px-3 py-2"
                />
                <p className="text-xs text-gray-500 mt-1">Пусто = бессрочно</p>
              </div>
            </div>
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
              referenceType="PICKET"
              referenceId={editingItem.id}
            />
          )}

          {isAdmin && editingItem && (
            <RelatedWorks
              fenceType="PICKET"
            />
          )}

          {isAdmin && editingItem && (
            <RelatedWorksByReference
              referenceType="PICKET"
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
