'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    console.log('[ADMIN LAYOUT] Session status:', status);
    
    if (status === 'unauthenticated') {
      console.log('[ADMIN LAYOUT] User not authenticated, redirecting to login');
      router.push('/login');
    }
  }, [status, router]);

  const handleLogout = async () => {
    console.log('[ADMIN LAYOUT] Logging out...');
    await signOut({ callbackUrl: '/' });
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500">Загрузка...</div>
      </div>
    );
  }

  if (status === 'unauthenticated' || !session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            style: {
              background: '#22c55e',
            },
          },
          error: {
            style: {
              background: '#ef4444',
            },
          },
        }}
      />
      <aside className="fixed left-0 top-0 h-full w-64 bg-white shadow-lg border-r">
        <div className="p-6">
          <h1 className="text-xl font-bold text-gray-900">Админ-панель</h1>
        </div>
        <nav className="mt-6">
          <ul className="space-y-2">
            <li>
              <a href="/admin/dashboard" className="block px-6 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                Дашборд
              </a>
            </li>
            <li>
              <a href="/admin/materials" className="block px-6 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                Материалы
              </a>
            </li>
            <li>
              <a href="/admin/orders" className="block px-6 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                Заявки
              </a>
            </li>
            <li>
              <a href="/admin/users" className="block px-6 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                Пользователи
              </a>
            </li>
            <li className="pt-4 border-t mt-4">
              <div className="px-6 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Справочники
              </div>
            </li>
            <li>
              <a href="/admin/references/fence-types" className="block px-6 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                Типы заборов
              </a>
            </li>
            <li>
              <a href="/admin/references/heights" className="block px-6 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                Высоты материалов
              </a>
            </li>
            <li>
              <a href="/admin/references/coatings" className="block px-6 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                Типы покрытия
              </a>
            </li>
            <li>
              <a href="/admin/references/lags" className="block px-6 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                Лаги
              </a>
            </li>
            <li>
              <a href="/admin/references/posts" className="block px-6 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                Столбы
              </a>
            </li>
          </ul>
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
                {session.user?.name?.[0] || 'A'}
              </div>
              <div>
                <p className="font-medium text-gray-900">{session.user?.name}</p>
                <p className="text-sm text-gray-500">{session.user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              Выйти
            </button>
          </div>
        </div>
      </aside>
      <main className="ml-64 p-8">
        {children}
      </main>
    </div>
  );
}
