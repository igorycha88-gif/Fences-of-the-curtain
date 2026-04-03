'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import toast from 'react-hot-toast';

interface NotificationRecipient {
  id: string;
  email: string;
  name: string | null;
  active: boolean;
  createdAt: string;
}

export default function NotificationRecipientsPage() {
  const [recipients, setRecipients] = useState<NotificationRecipient[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecipient, setEditingRecipient] = useState<NotificationRecipient | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [formValues, setFormValues] = useState({ email: '', name: '', active: true });

  const pageSize = 20;

  useEffect(() => {
    fetchRecipients();
  }, [page]);

  const fetchRecipients = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/admin/notification-recipients?page=${page}&pageSize=${pageSize}`,
        { credentials: 'include' }
      );
      const data = await response.json();

      if (response.ok) {
        setRecipients(data.recipients);
        setTotal(data.total);
      } else {
        toast.error(data.error || 'Ошибка загрузки');
      }
    } catch (error) {
      console.error('Error fetching recipients:', error);
      toast.error('Ошибка загрузки');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingRecipient(null);
    setFormValues({ email: '', name: '', active: true });
    setIsModalOpen(true);
  };

  const handleEdit = (recipient: NotificationRecipient) => {
    setEditingRecipient(recipient);
    setFormValues({
      email: recipient.email,
      name: recipient.name || '',
      active: recipient.active,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (recipient: NotificationRecipient) => {
    if (!confirm(`Удалить получателя ${recipient.email}?`)) return;

    try {
      const response = await fetch(`/api/admin/notification-recipients/${recipient.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        toast.success('Получатель удален');
        fetchRecipients();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Ошибка удаления');
      }
    } catch (error) {
      console.error('Error deleting recipient:', error);
      toast.error('Ошибка удаления');
    }
  };

  const handleToggleActive = async (recipient: NotificationRecipient) => {
    try {
      const response = await fetch(`/api/admin/notification-recipients/${recipient.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !recipient.active }),
        credentials: 'include',
      });

      if (response.ok) {
        toast.success(recipient.active ? 'Получатель деактивирован' : 'Получатель активирован');
        fetchRecipients();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Ошибка');
      }
    } catch (error) {
      console.error('Error toggling recipient:', error);
      toast.error('Ошибка');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formValues.email) {
      toast.error('Email обязателен');
      return;
    }

    try {
      const url = editingRecipient
        ? `/api/admin/notification-recipients`
        : '/api/admin/notification-recipients';

      const method = editingRecipient ? 'PUT' : 'POST';
      const body = editingRecipient
        ? { id: editingRecipient.id, ...formValues }
        : formValues;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(editingRecipient ? 'Получатель обновлен' : 'Получатель добавлен');
        setIsModalOpen(false);
        fetchRecipients();
      } else {
        if (Array.isArray(data.error)) {
          const errorMessages = data.error
            .map((err: { path?: string[]; message: string }) => {
              const field = err.path?.join('.') || 'field';
              return `${field}: ${err.message}`;
            })
            .join(', ');
          toast.error(`Ошибка валидации: ${errorMessages}`);
        } else {
          toast.error(data.message || data.error || 'Ошибка сохранения');
        }
      }
    } catch (error) {
      console.error('Error saving recipient:', error);
      toast.error('Ошибка сохранения');
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Получатели уведомлений</h1>
        <Button onClick={handleAdd}>
          Добавить
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Имя</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Статус</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  Загрузка...
                </td>
              </tr>
            ) : recipients.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  Нет получателей. Добавьте первого.
                </td>
              </tr>
            ) : (
              recipients.map((recipient) => (
                <tr key={recipient.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm">{recipient.email}</td>
                  <td className="px-6 py-4 text-sm">{recipient.name || '—'}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        recipient.active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {recipient.active ? 'Активен' : 'Неактивен'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(recipient)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Изменить
                      </button>
                      <button
                        onClick={() => handleToggleActive(recipient)}
                        className="text-yellow-600 hover:text-yellow-800 text-sm"
                      >
                        {recipient.active ? 'Деактивировать' : 'Активировать'}
                      </button>
                      <button
                        onClick={() => handleDelete(recipient)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Удалить
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 px-6 py-4 border-t">
            <Button
              variant="secondary"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Назад
            </Button>
            <span className="px-4 py-2 text-sm text-gray-600">
              Страница {page} из {totalPages}
            </span>
            <Button
              variant="secondary"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Вперед
            </Button>
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRecipient ? 'Редактировать получателя' : 'Добавить получателя'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email *</label>
            <input
              type="email"
              value={formValues.email}
              onChange={(e) => setFormValues((prev) => ({ ...prev, email: e.target.value }))}
              className="w-full border rounded px-3 py-2"
              placeholder="admin@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Имя</label>
            <input
              type="text"
              value={formValues.name}
              onChange={(e) => setFormValues((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full border rounded px-3 py-2"
              placeholder="Администратор"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="active"
              checked={formValues.active}
              onChange={(e) => setFormValues((prev) => ({ ...prev, active: e.target.checked }))}
              className="rounded"
            />
            <label htmlFor="active" className="text-sm">Активен</label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Отмена
            </Button>
            <Button type="submit">
              {editingRecipient ? 'Сохранить' : 'Добавить'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
