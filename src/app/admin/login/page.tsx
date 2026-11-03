'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import logger from '@/lib/logger';

async function getBlockedMessage(email: string): Promise<string | null> {
  try {
    const res = await fetch(`/api/auth/login-status?email=${encodeURIComponent(email)}`);
    if (!res.ok) {
      return null;
    }
    const status = await res.json();
    if (status?.blocked && status.resetAt) {
      const minutes = Math.max(
        1,
        Math.ceil((new Date(status.resetAt).getTime() - Date.now()) / 60000)
      );
      return `Слишком много попыток входа. Попробуйте через ${minutes} мин.`;
    }
  } catch (error) {
    logger.error('[ADMIN LOGIN] Failed to check login status', {
      module: 'admin/login',
      operation: 'getBlockedMessage',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
  return null;
}

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      logger.info('[ADMIN LOGIN] Attempting to sign in', { module: 'admin/login' });

      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        logger.warn('[ADMIN LOGIN] Sign in error', {
          module: 'admin/login',
          error: result.error,
        });
        const blockedMessage = await getBlockedMessage(email);
        setError(blockedMessage ?? 'Неверный email или пароль');
        setLoading(false);
        return;
      }

      logger.info('[ADMIN LOGIN] Sign in successful, waiting for session...', {
        module: 'admin/login',
      });

      await new Promise(resolve => setTimeout(resolve, 500));

      const sessionCheckResponse = await fetch('/api/auth/me');
      logger.info('[ADMIN LOGIN] Session check response status', {
        module: 'admin/login',
        status: sessionCheckResponse.status,
      });

      if (sessionCheckResponse.ok) {
        logger.info('[ADMIN LOGIN] Session confirmed, redirecting to dashboard', {
          module: 'admin/login',
        });
        window.location.href = '/admin/dashboard';
      } else {
        logger.error('[ADMIN LOGIN] Session not available after sign in', {
          module: 'admin/login',
          status: sessionCheckResponse.status,
        });
        setError('Ошибка авторизации. Попробуйте снова.');
        setLoading(false);
      }
    } catch (error) {
      logger.error('[ADMIN LOGIN] Unexpected error', {
        module: 'admin/login',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      setError('Ошибка входа');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md border">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Админ-панель</h1>
          <p className="text-gray-600">Войдите для управления</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="admin@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Пароль
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="•••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>
      </div>
    </div>
  );
}