import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminLoginPage from '@/app/admin/login/page';
import { signIn } from 'next-auth/react';

jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
}));

jest.mock('@/lib/logger', () => {
  const m: any = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
  m.withContext = jest.fn(() => m);
  return { __esModule: true, default: m };
});

import logger from '@/lib/logger';

const loggerMock = logger as any;
const mockSignIn = signIn as jest.Mock;
const mockFetch = jest.fn();

describe('AdminLoginPage — сообщение о блокировке (K-3)', () => {
  beforeAll(() => {
    global.fetch = mockFetch as any;
    jest.useRealTimers();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function fillAndSubmit() {
    render(<AdminLoginPage />);
    fireEvent.change(screen.getByPlaceholderText('admin@example.com'), {
      target: { value: 'admin@fences.ru' },
    });
    fireEvent.change(screen.getByPlaceholderText('•••••••••'), {
      target: { value: 'some-password' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Войти' }));
  }

  it('показывает сообщение о блокировке с оставшимся временем', async () => {
    mockSignIn.mockResolvedValue({ error: 'CredentialsSignin', status: 401, ok: false });
    const resetAt = new Date(Date.now() + 4 * 60000).toISOString();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ blocked: true, resetAt }),
    });

    fillAndSubmit();

    await waitFor(() =>
      expect(screen.getByText(/Слишком много попыток входа/)).toBeInTheDocument()
    );
    expect(screen.getByText(/через 4 мин\./)).toBeInTheDocument();
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/auth/login-status?email=admin%40fences.ru'
    );
  });

  it('показывает «Неверный email или пароль», когда блокировки нет', async () => {
    mockSignIn.mockResolvedValue({ error: 'CredentialsSignin', status: 401, ok: false });
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ blocked: false, resetAt: null }),
    });

    fillAndSubmit();

    await waitFor(() =>
      expect(screen.getByText('Неверный email или пароль')).toBeInTheDocument()
    );
  });

  it('fallback на «Неверный email или пароль» при недоступности login-status (edge)', async () => {
    mockSignIn.mockResolvedValue({ error: 'CredentialsSignin', status: 401, ok: false });
    mockFetch.mockRejectedValue(new Error('network down'));

    fillAndSubmit();

    await waitFor(() =>
      expect(screen.getByText('Неверный email или пароль')).toBeInTheDocument()
    );
    expect(loggerMock.error).toHaveBeenCalledWith(
      '[ADMIN LOGIN] Failed to check login status',
      expect.objectContaining({ error: 'network down' })
    );
  });

  it('успешный вход: сессия подтверждена, редирект на дашборд (регресс K-7)', async () => {
    mockSignIn.mockResolvedValue({ error: null, status: 200, ok: true });
    mockFetch.mockResolvedValue({ ok: true, status: 200 });

    fillAndSubmit();

    // window.location в jsdom unforgeable — редирект assert'им по логу строки,
    // идущей непосредственно перед window.location.href = '/admin/dashboard'
    await waitFor(
      () =>
        expect(loggerMock.info).toHaveBeenCalledWith(
          '[ADMIN LOGIN] Session confirmed, redirecting to dashboard',
          expect.any(Object)
        ),
      { timeout: 3000 }
    );
    expect(mockFetch).toHaveBeenCalledWith('/api/auth/me');
  });
});
