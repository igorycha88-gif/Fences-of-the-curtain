'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';

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
      console.log('[ADMIN LOGIN] Attempting to sign in with email:', email);

      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      console.log('[ADMIN LOGIN] Sign in result:', result);

      if (result?.error) {
        console.error('[ADMIN LOGIN] Sign in error:', result.error);
        setError('Неверный email или пароль');
        setLoading(false);
        return;
      }

      console.log('[ADMIN LOGIN] Sign in successful, waiting for session...');

      await new Promise(resolve => setTimeout(resolve, 500));

      const sessionCheckResponse = await fetch('/api/auth/me');
      console.log('[ADMIN LOGIN] Session check response status:', sessionCheckResponse.status);

      if (sessionCheckResponse.ok) {
        console.log('[ADMIN LOGIN] Session confirmed, redirecting to dashboard');
        window.location.href = '/admin/dashboard';
      } else {
        console.error('[ADMIN LOGIN] Session not available after sign in');
        setError('Ошибка авторизации. Попробуйте снова.');
        setLoading(false);
      }
    } catch (error) {
      console.error('[ADMIN LOGIN] Unexpected error:', error);
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