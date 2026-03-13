'use client';

import { useState, useEffect } from 'react';
import { DataTable } from '@/components/admin/References/DataTable';
import { Modal } from '@/components/ui/modal';
import { SimplifiedPurchasePriceInput } from '@/components/admin/References/SimplifiedPurchasePriceInput';
import { calculateMargin, getMarginEmoji } from '@/lib/utils/marginCalculator';
import { formatDimension, formatPrice, formatSection } from '@/lib/utils/formatters';
import { POSTS_COLUMN_TOOLTIPS, LAGS_COLUMN_TOOLTIPS } from '@/lib/constants/columnTooltips';
import { ColumnHeaderWithTooltip } from '@/components/admin/References/ColumnHeaderWithTooltip';
import { PriorityColumn } from '@/components/admin/References/shared';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { RelatedMountingHardware } from '@/components/admin/References/RelatedMountingHardware';

interface PostType {
  id: string;
  name: string;
  description: string | null;
  sectionWidth: number;
  sectionHeight: number;
  wallThickness: number;
  pricePerMeter: number;
  length: number;
  retailPricePerUnit: number;
  purchasePricePerUnit: number | null;
  image: string | null;
  active: boolean;
  validFrom: string | null;
  expirationDate: string | null;
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

interface DuplicateWarning {
  type: string;
  message: string;
  duplicates: Array<{
    id: string;
    name: string;
    retailPricePerUnit: number;
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

export default function PostsPage() {
  const [posts, setPosts] = useState<PostType[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [validityFilter, setValidityFilter] = useState<'all' | 'active' | 'expired' | 'expiring_soon'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<PostType | null>(null);
  const [formValues, setFormValues] = useState<Partial<PostType> & { confirmDuplicate?: boolean; updateExistingExpiration?: string }>({});
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

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        validityFilter,
        ...(search && { search }),
      });

      const response = await fetch(`/api/admin/post-types?${params}`);
      const data = await response.json();

      if (response.ok) {
        setPosts(data.posts);
        setTotal(data.total);
      } else {
        console.error('Error fetching post types:', data.error);
      }
    } catch (error) {
      console.error('Error fetching post types:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [page, search, validityFilter]);

  const handleAdd = () => {
    setEditingPost(null);
    setDuplicateWarning(null);
    setFormValues({
      name: '',
      description: '',
      sectionWidth: 60,
      sectionHeight: 60,
      wallThickness: 2.5,
      pricePerMeter: 300,
      length: 2.5,
      retailPricePerUnit: 750,
      purchasePricePerUnit: null,
      active: true,
      validFrom: null,
      expirationDate: null,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (post: PostType) => {
    setEditingPost(post);
    setDuplicateWarning(null);
    setFormValues({
      name: post.name,
      description: post.description || '',
      sectionWidth: post.sectionWidth,
      sectionHeight: post.sectionHeight,
      wallThickness: post.wallThickness,
      pricePerMeter: post.pricePerMeter,
      length: post.length,
      retailPricePerUnit: post.retailPricePerUnit,
      purchasePricePerUnit: post.purchasePricePerUnit,
      active: post.active,
      validFrom: post.validFrom,
      expirationDate: post.expirationDate,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (post: PostType) => {
    if (!confirm(`Удалить столб "${post.name}"?`)) return;

    try {
      const response = await fetch(`/api/admin/post-types/${post.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Столб успешно удален');
        fetchPosts();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Ошибка удаления');
      }
    } catch (error) {
      console.error('Error deleting post type:', error);
      toast.error('Ошибка удаления');
    }
  };

  const handleToggleActive = async (post: PostType) => {
    try {
      const response = await fetch(`/api/admin/post-types/${post.id}`, {
        method: 'PATCH',
      });

      if (response.ok) {
        toast.success('Статус изменен');
        fetchPosts();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Ошибка изменения статуса');
      }
    } catch (error) {
      console.error('Error toggling post type:', error);
      toast.error('Ошибка изменения статуса');
    }
  };

  const handlePriorityChange = async (id: string, newPriority: number) => {
    const response = await fetch('/api/admin/post-types/reorder', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, newPriority }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Ошибка изменения приоритета');
    }

    fetchPosts();
  };

  const handleFormChange = (name: string, value: any) => {
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handlePurchasePriceChange = (value: number | null) => {
    setFormValues((prev) => ({ ...prev, purchasePrice: value }));
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
      const url = editingPost
        ? `/api/admin/post-types/${editingPost.id}`
        : '/api/admin/post-types';
      const method = editingPost ? 'PUT' : 'POST';

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
        toast.success(editingPost ? 'Столб успешно обновлен' : 'Столб успешно создан');
        setIsModalOpen(false);
        fetchPosts();
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
      label: <ColumnHeaderWithTooltip title="Сечение (мм)" tooltip={POSTS_COLUMN_TOOLTIPS.sectionWidth} />,
      render: (post: PostType) => (
        <span>{formatSection(post.sectionWidth, post.sectionHeight)} мм</span>
      ),
    },
    {
      key: 'wallThickness',
      label: <ColumnHeaderWithTooltip title="Толщина металла (мм)" tooltip={POSTS_COLUMN_TOOLTIPS.wallThickness} />,
      render: (post: PostType) => formatDimension(post.wallThickness),
    },
    {
      key: 'length',
      label: <ColumnHeaderWithTooltip title="Высота (мм)" tooltip={LAGS_COLUMN_TOOLTIPS.length} />,
      render: (post: PostType) => Math.round(post.length * 1000),
    },
    {
      key: 'retailPricePerUnit',
      label: <ColumnHeaderWithTooltip title="Розничная стоимость за ед. (₽)" tooltip={POSTS_COLUMN_TOOLTIPS.retailPricePerUnit} />,
      render: (post: PostType) => formatPrice(post.retailPricePerUnit),
    },
    {
      key: 'validFrom',
      label: 'Дата начала',
      render: (post: PostType) => (
        <span className={post.validFrom ? '' : 'text-gray-400'}>
          {formatValidFrom(post.validFrom)}
        </span>
      ),
    },
    {
      key: 'expirationDate',
      label: 'Срок действия',
      render: (post: PostType) => {
        const isExpired = post.expirationDate && new Date(post.expirationDate) < new Date();
        const isExpiringSoon = post.expirationDate && !isExpired &&
          new Date(post.expirationDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        return (
          <span className={
            isExpired ? 'text-red-500' :
            isExpiringSoon ? 'text-yellow-600' :
            !post.expirationDate ? 'text-gray-400' : ''
          }>
            {formatDate(post.expirationDate)}
          </span>
        );
      },
    },
    ...(isAdmin ? [{
      key: 'purchasePricePerUnit',
      label: <ColumnHeaderWithTooltip title="Цена закупки за ед. (₽)" tooltip="Цена закупки за столб" />,
      render: (post: PostType) => {
        const margin = calculateMargin(post.retailPricePerUnit, post.purchasePricePerUnit);
        const marginEmoji = getMarginEmoji(margin?.marginPercent ?? null);
        const priceText = post.purchasePricePerUnit 
          ? `${formatPrice(post.purchasePricePerUnit)} ${marginEmoji}`
          : `Не указана ${marginEmoji}`;
        return (
          <span 
            className="cursor-help"
            title={margin 
              ? `Маржа: ${margin.marginPercent.toFixed(1)}% (${margin.marginAbsolute.toFixed(2)} ₽)`
              : 'Цена закупки не указана'
            }
          >
            {priceText}
          </span>
        );
      },
    }] : []),
    { 
      key: 'priority', 
      label: 'Приоритет',
      render: (post: PostType) => (
        <PriorityColumn
          value={post.priority}
          totalItems={total}
          onChange={async (newPriority) => {
            await handlePriorityChange(post.id, newPriority);
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
        title="Столбы"
        columns={columns}
        data={posts}
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
        title={editingPost ? 'Редактировать столб' : 'Создать столб'}
      >
        {duplicateWarning ? (
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
              <h3 className="font-semibold text-yellow-800 mb-2">Столб с такими параметрами уже существует</h3>
              {duplicateWarning.duplicates.map((dup) => (
                <div key={dup.id} className="bg-white p-3 rounded mb-2 text-sm">
                  <div className="font-medium">{dup.name || 'Без названия'}</div>
                  <div>Цена: {dup.retailPricePerUnit} ₽</div>
                  <div>Период: {formatValidFrom(dup.validFrom)} - {formatDate(dup.expirationDate)}</div>
                  <div>Статус: {dup.active ? 'Активен' : 'Неактивен'}</div>
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
                  value={formValues.sectionWidth || ''}
                  onChange={(e) => handleFormChange('sectionWidth', parseFloat(e.target.value))}
                  className="w-full border rounded px-3 py-2"
                  min={40}
                  max={120}
                  step={1}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Высота сечения (мм) *</label>
                <input
                  type="number"
                  value={formValues.sectionHeight || ''}
                  onChange={(e) => handleFormChange('sectionHeight', parseFloat(e.target.value))}
                  className="w-full border rounded px-3 py-2"
                  min={40}
                  max={120}
                  step={1}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Толщина стенки (мм) *</label>
                <input
                  type="number"
                  value={formValues.wallThickness || ''}
                  onChange={(e) => handleFormChange('wallThickness', parseFloat(e.target.value))}
                  className="w-full border rounded px-3 py-2"
                  min={1.5}
                  max={5.0}
                  step={0.1}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Высота (мм) *</label>
                <input
                  type="number"
                  value={formValues.length ? Math.round(formValues.length * 1000) : ''}
                  onChange={(e) => handleFormChange('length', parseFloat(e.target.value) / 1000)}
                  className="w-full border rounded px-3 py-2"
                  min={1500}
                  max={6000}
                  step={100}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Розничная стоимость за ед. (₽) *</label>
              <input
                type="number"
                value={formValues.retailPricePerUnit || ''}
                onChange={(e) => handleFormChange('retailPricePerUnit', parseFloat(e.target.value))}
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
                  purchasePrice={formValues.purchasePricePerUnit ?? null}
                  retailPrice={formValues.retailPricePerUnit || 0}
                  onChange={handlePurchasePriceChange}
                />
              </div>
            )}

            {isAdmin && editingPost && (
              <RelatedMountingHardware
                referenceType="POST"
                referenceId={editingPost.id}
              />
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Отмена
              </Button>
              <Button type="submit">
                {editingPost ? 'Обновить' : 'Создать'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
