'use client';

import { useState, useEffect } from 'react';
import { DataTable } from '@/components/admin/References/DataTable';
import { ReferenceForm } from '@/components/admin/References/ReferenceForm';
import { Modal } from '@/components/ui/modal';

interface PostType {
  id: string;
  name: string;
  description: string | null;
  sectionWidth: number;
  sectionHeight: number;
  wallThickness: number;
  pricePerMeter: number;
  priceWithConcrete: number | null;
  availableLengths: Array<{
    length: number;
    pricePerMeter: number;
    priceWithConcrete: number | null;
  }> | null;
  image: string | null;
  active: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
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

  const pageSize = 20;

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
      pricePerMeter: 0,
      priceWithConcrete: null,
      active: true,
      sortOrder: 0,
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
      priceWithConcrete: post.priceWithConcrete,
      active: post.active,
      sortOrder: post.sortOrder,
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
        fetchPosts();
      } else {
        const data = await response.json();
        alert(data.error || 'Ошибка удаления');
      }
    } catch (error) {
      console.error('Error deleting post type:', error);
      alert('Ошибка удаления');
    }
  };

  const handleToggleActive = async (post: PostType) => {
    try {
      const response = await fetch(`/api/admin/post-types/${post.id}`, {
        method: 'PATCH',
      });

      if (response.ok) {
        fetchPosts();
      } else {
        const data = await response.json();
        alert(data.error || 'Ошибка изменения статуса');
      }
    } catch (error) {
      console.error('Error toggling post type:', error);
      alert('Ошибка изменения статуса');
    }
  };

  const handleFormChange = (name: string, value: any) => {
    setFormValues((prev) => ({ ...prev, [name]: value }));
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

      if (response.ok) {
        setIsModalOpen(false);
        fetchPosts();
      } else {
        const data = await response.json();
        alert(data.error || 'Ошибка сохранения');
      }
    } catch (error) {
      console.error('Error saving post type:', error);
      alert('Ошибка сохранения');
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
    {
      key: 'priceWithConcrete',
      label: 'Цена с бетонированием (руб/шт)',
      render: (post: PostType) =>
        post.priceWithConcrete ? post.priceWithConcrete.toFixed(2) : '-',
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
    {
      name: 'priceWithConcrete',
      label: 'Цена с бетонированием (руб/шт)',
      type: 'number' as const,
      min: 0,
      step: 0.01,
    },
    { name: 'sortOrder', label: 'Порядок сортировки', type: 'number' as const },
    { name: 'active', label: 'Активен', type: 'checkbox' as const },
  ];

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
        <ReferenceForm
          fields={formFields}
          values={formValues}
          onChange={handleFormChange}
          onSubmit={handleFormSubmit}
          onCancel={() => setIsModalOpen(false)}
          submitLabel={editingPost ? 'Обновить' : 'Создать'}
        />
      </Modal>
    </div>
  );
}
