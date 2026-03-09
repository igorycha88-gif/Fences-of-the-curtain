'use client';

import { useState, useEffect } from 'react';
import { DataTable } from '@/components/admin/References/DataTable';
import { ReferenceForm } from '@/components/admin/References/ReferenceForm';
import { Modal } from '@/components/ui/modal';
import { PurchasePriceSection } from '@/components/admin/References/PurchasePriceSection';
import { AvailableLengthsSection } from '@/components/admin/References/AvailableLengthsSection';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';

interface PostType {
  id: string;
  name: string;
  description: string | null;
  sectionWidth: number;
  sectionHeight: number;
  wallThickness: number;
  pricePerMeter: number;
  availableLengths: Array<{
    length: number;
    pricePerMeter: number;
  }> | null;
  purchasePrices: Array<{
    length: number;
    purchasePrice: number | null;
  }> | null;
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

export default function PostsPage() {
  const [posts, setPosts] = useState<PostType[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<PostType | null>(null);
  const [formValues, setFormValues] = useState<Partial<PostType>>({});
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

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
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
  }, [page, search]);

  const handleAdd = () => {
    setEditingPost(null);
    setFormValues({
      name: '',
      description: '',
      sectionWidth: 60,
      sectionHeight: 60,
      wallThickness: 2.5,
      pricePerMeter: 300,
      active: true,
      sortOrder: 0,
      availableLengths: [],
      purchasePrices: [],
    });
    setIsModalOpen(true);
  };

  const handleEdit = (post: PostType) => {
    setEditingPost(post);
    setFormValues({
      name: post.name,
      description: post.description || '',
      sectionWidth: post.sectionWidth,
      sectionHeight: post.sectionHeight,
      wallThickness: post.wallThickness,
      pricePerMeter: post.pricePerMeter,
      active: post.active,
      sortOrder: post.sortOrder,
      availableLengths: post.availableLengths || [],
      purchasePrices: post.purchasePrices || [],
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

  const handleFormChange = (name: string, value: any) => {
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvailableLengthsChange = (availableLengths: any[]) => {
    setFormValues((prev) => ({ ...prev, availableLengths }));
  };

  const handlePurchasePricesChange = (purchasePrices: Array<{ length: number; purchasePrice: number | null }>) => {
    setFormValues((prev) => ({ ...prev, purchasePrices }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('[POSTS PAGE] Form submitted');
    console.log('[POSTS PAGE] Form values:', JSON.stringify(formValues, null, 2));
    console.log('[POSTS PAGE] Editing post:', editingPost ? editingPost.id : 'new');

    try {
      const url = editingPost
        ? `/api/admin/post-types/${editingPost.id}`
        : '/api/admin/post-types';
      const method = editingPost ? 'PUT' : 'POST';
      
      console.log('[POSTS PAGE] Sending request:', method, url);

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formValues),
      });
      
      console.log('[POSTS PAGE] Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('[POSTS PAGE] Success response:', data);
        toast.success(editingPost ? 'Столб успешно обновлен' : 'Столб успешно создан');
        setIsModalOpen(false);
        fetchPosts();
      } else {
        const data = await response.json();
        console.error('[POSTS PAGE] Error response:', data);
        
        // Handle validation errors
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
      console.error('[POSTS PAGE] Exception:', error);
      toast.error('Ошибка сохранения');
    }
  };

  const columns = [
    { key: 'name', label: 'Название' },
    { key: 'description', label: 'Описание' },
    {
      key: 'sectionWidth',
      label: 'Ширина сечения (мм)',
      render: (post: PostType) => post.sectionWidth.toFixed(0),
    },
    {
      key: 'sectionHeight',
      label: 'Высота сечения (мм)',
      render: (post: PostType) => post.sectionHeight.toFixed(0),
    },
    {
      key: 'wallThickness',
      label: 'Толщина стенки (мм)',
      render: (post: PostType) => post.wallThickness.toFixed(1),
    },
    {
      key: 'pricePerMeter',
      label: 'Цена за м.п. (руб)',
      render: (post: PostType) => post.pricePerMeter.toFixed(2),
    },
    { key: 'sortOrder', label: 'Порядок' },
    { key: 'active', label: 'Активен' },
  ];

  const formFields = [
    { name: 'name', label: 'Название', type: 'text' as const, required: true },
    { name: 'description', label: 'Описание', type: 'textarea' as const },
    {
      name: 'sectionWidth',
      label: 'Ширина сечения (мм)',
      type: 'number' as const,
      required: true,
      min: 40,
      max: 120,
      step: 1,
    },
    {
      name: 'sectionHeight',
      label: 'Высота сечения (мм)',
      type: 'number' as const,
      required: true,
      min: 40,
      max: 120,
      step: 1,
    },
    {
      name: 'wallThickness',
      label: 'Толщина стенки (мм)',
      type: 'number' as const,
      required: true,
      min: 1.5,
      max: 5.0,
      step: 0.1,
    },
    {
      name: 'pricePerMeter',
      label: 'Базовая цена за метр погонный (руб)',
      type: 'number' as const,
      required: true,
      min: 0,
      step: 0.01,
    },
    { name: 'sortOrder', label: 'Порядок сортировки', type: 'number' as const },
    { name: 'active', label: 'Активен', type: 'checkbox' as const },
  ];

  const isAdmin = currentUser?.role === 'ADMIN';

  return (
    <div className="container mx-auto py-8">
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
        onClose={() => setIsModalOpen(false)}
        title={editingPost ? 'Редактировать столб' : 'Создать столб'}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <ReferenceForm
            fields={formFields}
            values={formValues}
            onChange={handleFormChange}
            onSubmit={handleFormSubmit}
            onCancel={() => setIsModalOpen(false)}
            submitLabel={editingPost ? 'Обновить' : 'Создать'}
            renderForm={false}
            showButtons={false}
          />

          <div className="mt-6">
            <AvailableLengthsSection
              type="posts"
              availableLengths={formValues.availableLengths || []}
              basePrice={formValues.pricePerMeter || 0}
              onChange={handleAvailableLengthsChange}
            />
          </div>

          {isAdmin && (
            <div className="mt-6">
              <PurchasePriceSection
                availableLengths={formValues.availableLengths || []}
                purchasePrices={formValues.purchasePrices || []}
                basePrice={formValues.pricePerMeter || 0}
                onChange={handlePurchasePricesChange}
              />
            </div>
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
      </Modal>
    </div>
  );
}
