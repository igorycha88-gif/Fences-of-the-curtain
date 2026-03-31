'use client';

import { useState, useEffect } from 'react';
import { isApiError } from '@/lib/utils/apiResponse';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    role: '',
    active: '',
    search: '',
  });

  useEffect(() => {
    fetchUsers();
  }, [filters]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.role) params.append('role', filters.role);
      if (filters.active) params.append('active', filters.active);
      if (filters.search) params.append('search', filters.search);

      const res = await fetch(`/api/admin/users?${params.toString()}`, { credentials: 'include' });
      const data = await res.json();

      if (isApiError(data)) {
        console.error('[Users] API Error:', data.error);
        setUsers([]);
        return;
      }

      setUsers(Array.isArray(data.users) ? data.users : []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (userId: string, currentActive: boolean) => {
    try {
      await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !currentActive }),
        credentials: 'include',
      });
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Удалить пользователя?')) return;

    try {
      await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const getRoleBadge = (role: string) => {
    const roleMap: Record<string, { color: string; label: string }> = {
      ADMIN: { color: 'bg-purple-100 text-purple-800', label: 'Админ' },
      MANAGER: { color: 'bg-blue-100 text-blue-800', label: 'Менеджер' },
      CONTENT_MANAGER: { color: 'bg-green-100 text-green-800', label: 'Контент-менеджер' },
    };

    const { color, label } = roleMap[role] || { color: 'bg-gray-100', label: role };
    return <span className={`px-2 py-1 rounded text-sm ${color}`}>{label}</span>;
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Пользователи</h1>

      <div className="bg-white rounded-xl shadow-md border">
        <div className="p-6 space-y-4 border-b">
          <div className="flex gap-4 flex-wrap">
            <input
              type="text"
              placeholder="Поиск по email или имени..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              onKeyPress={(e) => e.key === 'Enter' && fetchUsers()}
              className="flex-1 min-w-[200px] px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />

            <select
              value={filters.role}
              onChange={(e) => setFilters({ ...filters, role: e.target.value })}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Все роли</option>
              <option value="ADMIN">Админ</option>
              <option value="MANAGER">Менеджер</option>
              <option value="CONTENT_MANAGER">Контент-менеджер</option>
            </select>

            <select
              value={filters.active}
              onChange={(e) => setFilters({ ...filters, active: e.target.value })}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Все статусы</option>
              <option value="true">Активные</option>
              <option value="false">Неактивные</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-500">Загрузка...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Email</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Имя</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Роль</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Телефон</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Активен</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Дата регистрации</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Действия</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">{user.email}</td>
                    <td className="py-3 px-4">{user.name || '-'}</td>
                    <td className="py-3 px-4">{getRoleBadge(user.role)}</td>
                    <td className="py-3 px-4">{user.phone || '-'}</td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleToggleActive(user.id, user.active)}
                        className={`px-2 py-1 rounded text-sm ${
                          user.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {user.active ? 'Да' : 'Нет'}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {new Date(user.createdAt).toLocaleDateString('ru-RU')}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Удалить
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
