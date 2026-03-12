'use client';

import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { LogOut } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    console.log('[ADMIN LAYOUT] Session status:', status);
    
    if (status === 'unauthenticated') {
      console.log('[ADMIN LAYOUT] User not authenticated, redirecting to login');
      router.push('/login');
    }
  }, [status, router]);

  const handleLogout = async () => {
    console.log('[ADMIN LAYOUT] Logging out...');
    await signOut({ redirect: false });
    router.push('/');
    router.refresh();
  };

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(path + '/');
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
              <a 
                href="/admin/dashboard" 
                className={`block px-6 py-3 rounded-lg transition-colors ${
                  isActive('/admin/dashboard')
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Дашборд
              </a>
            </li>
            <li>
              <a 
                href="/admin/orders" 
                className={`block px-6 py-3 rounded-lg transition-colors ${
                  isActive('/admin/orders')
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Заявки
              </a>
            </li>
            <li>
              <a 
                href="/admin/users" 
                className={`block px-6 py-3 rounded-lg transition-colors ${
                  isActive('/admin/users')
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Пользователи
              </a>
            </li>
            <li className="pt-4 border-t mt-4">
              <div className="px-6 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Справочники
              </div>
            </li>
            <li>
              <a 
                href="/admin/references/fence-types" 
                className={`block px-6 py-3 rounded-lg transition-colors ${
                  isActive('/admin/references/fence-types')
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Типы заборов
              </a>
            </li>
            <li>
              <a 
                href="/admin/references/lags" 
                className={`block px-6 py-3 rounded-lg transition-colors ${
                  isActive('/admin/references/lags')
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Лаги
              </a>
            </li>
            <li>
              <a 
                href="/admin/references/posts" 
                className={`block px-6 py-3 rounded-lg transition-colors ${
                  isActive('/admin/references/posts')
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Столбы
              </a>
            </li>
            <li>
              <a 
                href="/admin/references/profnastil" 
                className={`block px-6 py-3 rounded-lg transition-colors ${
                  isActive('/admin/references/profnastil')
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Профнастил
              </a>
            </li>
            <li>
              <a 
                href="/admin/references/picket" 
                className={`block px-6 py-3 rounded-lg transition-colors ${
                  isActive('/admin/references/picket')
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Евроштакетник
              </a>
            </li>
            <li>
              <a 
                href="/admin/references/gates" 
                className={`block px-6 py-3 rounded-lg transition-colors ${
                  isActive('/admin/references/gates')
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Ворота
              </a>
            </li>
            <li>
              <a 
                href="/admin/references/wickets" 
                className={`block px-6 py-3 rounded-lg transition-colors ${
                  isActive('/admin/references/wickets')
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Калитки
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
              title="Выйти"
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors min-h-[44px] min-w-[44px]"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline">Выйти</span>
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
