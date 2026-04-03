'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Eye, EyeOff, Search, Filter, GripVertical } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { getThumbnailUrl } from '@/lib/utils/imageUrl';

interface PortfolioItem {
  id: string;
  title: string;
  category: string;
  type?: string;
  description?: string;
  images: string[];
  active: boolean;
  sortOrder: number;
  createdAt: string;
}

interface SortableRowProps {
  item: PortfolioItem;
  onEdit: (id: string) => void;
  onDelete: (item: PortfolioItem) => void;
  onToggleActive: (id: string) => void;
  isSelected: boolean;
  onSelect: (id: string, selected: boolean) => void;
}

function SortableRow({ item, onEdit, onDelete, onToggleActive, isSelected, onSelect }: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const thumbnailUrl = getThumbnailUrl((item.images as string[])[0]);
  const [imgError, setImgError] = useState(false);

  return (
    <tr ref={setNodeRef} style={style} className={isDragging ? 'bg-gray-50' : ''}>
      <td className="px-4 py-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelect(item.id, e.target.checked)}
          className="w-4 h-4 rounded border-gray-300"
        />
      </td>
      <td className="px-4 py-3">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
          <GripVertical className="w-5 h-5 text-gray-400" />
        </div>
      </td>
      <td className="px-4 py-3">
        {thumbnailUrl && !imgError ? (
          <img 
            src={thumbnailUrl} 
            alt={item.title}
            className="w-16 h-12 object-cover rounded"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-16 h-12 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-400">
            Нет
          </div>
        )}
      </td>
      <td className="px-4 py-3 font-medium text-gray-900">{item.title}</td>
      <td className="px-4 py-3">
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          item.category === 'fence' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
        }`}>
          {item.category === 'fence' ? 'Заборы' : 'Навесы'}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          item.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {item.active ? 'Активен' : 'Неактивен'}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggleActive(item.id)}
            className="p-1 hover:bg-gray-100 rounded"
            title={item.active ? 'Деактивировать' : 'Активировать'}
          >
            {item.active ? (
              <EyeOff className="w-4 h-4 text-gray-500" />
            ) : (
              <Eye className="w-4 h-4 text-gray-500" />
            )}
          </button>
          <button
            onClick={() => onEdit(item.id)}
            className="p-1 hover:bg-gray-100 rounded"
            title="Редактировать"
          >
            <Pencil className="w-4 h-4 text-gray-500" />
          </button>
          <button
            onClick={() => onDelete(item)}
            className="p-1 hover:bg-red-50 rounded"
            title="Удалить"
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function PortfolioListPage() {
  const router = useRouter();
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; item?: PortfolioItem; ids?: string[] }>({ open: false });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('pageSize', String(pageSize));
      if (search) params.set('search', search);
      if (categoryFilter) params.set('category', categoryFilter);
      if (activeFilter) params.set('active', activeFilter);

      const res = await fetch(`/api/admin/portfolio?${params}`, { credentials: 'include' });
      const data = await res.json();
      
      if (res.ok) {
        setItems(data.items);
        setTotal(data.total);
      }
    } catch (error) {
      console.error('Error fetching portfolio:', error);
      toast.error('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, categoryFilter, activeFilter]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);

      const newItems = arrayMove(items, oldIndex, newIndex);
      setItems(newItems);

      try {
        await fetch('/api/admin/portfolio/reorder', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: newItems.map((item, index) => ({
              id: item.id,
              sortOrder: index,
            })),
          }),
          credentials: 'include',
        });
      } catch (error) {
        console.error('Error reordering:', error);
        toast.error('Ошибка изменения порядка');
        fetchItems();
      }
    }
  };

  const handleEdit = (id: string) => {
    router.push(`/admin/portfolio/${id}`);
  };

  const handleDelete = (item: PortfolioItem) => {
    setDeleteModal({ open: true, item });
  };

  const handleBulkDelete = () => {
    setDeleteModal({ open: true, ids: Array.from(selectedIds) });
  };

  const confirmDelete = async () => {
    try {
      if (deleteModal.ids) {
        const res = await fetch('/api/admin/portfolio/bulk/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: deleteModal.ids }),
          credentials: 'include',
        });
        const data = await res.json();
        if (res.ok) {
          toast.success(data.message);
          setSelectedIds(new Set());
        } else {
          toast.error(data.error);
        }
      } else if (deleteModal.item) {
        const res = await fetch(`/api/admin/portfolio/${deleteModal.item.id}`, {
          method: 'DELETE',
          credentials: 'include',
        });
        const data = await res.json();
        if (res.ok) {
          toast.success('Элемент удалён');
        } else {
          toast.error(data.error);
        }
      }
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error('Ошибка удаления');
    } finally {
      setDeleteModal({ open: false });
      fetchItems();
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/portfolio/${id}`, { method: 'PATCH', credentials: 'include' });
      if (res.ok) {
        toast.success('Статус изменён');
        fetchItems();
      } else {
        const data = await res.json();
        toast.error(data.error);
      }
    } catch (error) {
      console.error('Error toggling active:', error);
      toast.error('Ошибка изменения статуса');
    }
  };

  const handleBulkActivate = async (active: boolean) => {
    try {
      const endpoint = active ? 'activate' : 'deactivate';
      const res = await fetch(`/api/admin/portfolio/bulk/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        setSelectedIds(new Set());
        fetchItems();
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      console.error('Error bulk operation:', error);
      toast.error('Ошибка операции');
    }
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedIds(new Set(items.map(i => i.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectItem = (id: string, selected: boolean) => {
    const newSet = new Set(selectedIds);
    if (selected) {
      newSet.add(id);
    } else {
      newSet.delete(id);
    }
    setSelectedIds(newSet);
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 md:mb-6 gap-3">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Портфолио</h1>
        <button
          onClick={() => router.push('/admin/portfolio/new')}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 min-h-[44px] text-sm"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">Добавить работу</span>
          <span className="sm:hidden">Добавить</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow mb-4 md:mb-6">
        <div className="p-3 md:p-4 border-b flex flex-col md:flex-row gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Поиск по названию..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm min-h-[44px]"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm min-h-[44px]"
            >
              <option value="">Все категории</option>
              <option value="fence">Заборы</option>
              <option value="canopy">Навесы</option>
            </select>
            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
              className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm min-h-[44px]"
            >
              <option value="">Все статусы</option>
              <option value="true">Активные</option>
              <option value="false">Неактивные</option>
            </select>
          </div>
        </div>

        {selectedIds.size > 0 && (
          <div className="p-3 md:p-4 bg-blue-50 border-b flex flex-wrap items-center gap-2 md:gap-4">
            <span className="text-sm text-blue-700">
              Выбрано: {selectedIds.size}
            </span>
            <button
              onClick={() => handleBulkActivate(true)}
              className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 min-h-[44px]"
            >
              Активировать
            </button>
            <button
              onClick={() => handleBulkActivate(false)}
              className="px-3 py-1.5 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 min-h-[44px]"
            >
              Деактивировать
            </button>
            <button
              onClick={handleBulkDelete}
              className="px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700 min-h-[44px]"
            >
              Удалить
            </button>
          </div>
        )}

        {loading ? (
          <div className="p-8 text-center text-gray-500">Загрузка...</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Нет элементов портфолио</div>
        ) : (
          <>
            <div className="hidden md:block">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={items.length > 0 && selectedIds.size === items.length}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="w-4 h-4 rounded border-gray-300"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-12"></th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Фото</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Название</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Категория</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Статус</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Действия</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <SortableContext items={items} strategy={verticalListSortingStrategy}>
                      {items.map((item) => (
                        <SortableRow
                          key={item.id}
                          item={item}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                          onToggleActive={handleToggleActive}
                          isSelected={selectedIds.has(item.id)}
                          onSelect={handleSelectItem}
                        />
                      ))}
                    </SortableContext>
                  </tbody>
                </table>
              </DndContext>
            </div>

            <div className="md:hidden space-y-3 p-3">
              {items.map((item) => {
                const thumbUrl = getThumbnailUrl((item.images as string[])[0]);
                return (
                  <div key={item.id} className="bg-gray-50 rounded-lg p-3 border">
                    <div className="flex items-start gap-3">
                      {thumbUrl ? (
                        <img
                          src={thumbUrl}
                          alt={item.title}
                          className="w-20 h-16 object-cover rounded flex-shrink-0"
                        />
                      ) : (
                        <div className="w-20 h-16 bg-gray-200 rounded flex-shrink-0 flex items-center justify-center text-xs text-gray-400">
                          Нет
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">{item.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            item.category === 'fence' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {item.category === 'fence' ? 'Заборы' : 'Навесы'}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            item.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {item.active ? 'Активен' : 'Неактивен'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t flex gap-2">
                      <button
                        onClick={() => handleToggleActive(item.id)}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-2 text-sm border rounded-lg hover:bg-gray-100 min-h-[44px]"
                      >
                        {item.active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        {item.active ? 'Скрыть' : 'Показать'}
                      </button>
                      <button
                        onClick={() => handleEdit(item.id)}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-2 text-sm border rounded-lg hover:bg-gray-100 min-h-[44px]"
                      >
                        <Pencil className="w-4 h-4" />
                        Изменить
                      </button>
                      <button
                        onClick={() => handleDelete(item)}
                        className="flex items-center justify-center px-3 py-2 text-sm border rounded-lg text-red-600 hover:bg-red-50 min-h-[44px]"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {totalPages > 1 && (
          <div className="p-4 border-t flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Показано {((page - 1) * pageSize) + 1}-{Math.min(page * pageSize, total)} из {total}
            </span>
            <div className="flex gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-3 py-1 rounded ${
                    p === page ? 'bg-primary text-white' : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {deleteModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Подтверждение удаления</h3>
            <p className="text-gray-600 mb-6">
              {deleteModal.item
                ? `Вы уверены, что хотите удалить "${deleteModal.item.title}"? Это действие нельзя отменить.`
                : `Вы уверены, что хотите удалить ${deleteModal.ids?.length} элементов? Это действие нельзя отменить.`
              }
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteModal({ open: false })}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
              >
                Отмена
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
