'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface CookieConsentSettingsProps {
  initialAnalytics: boolean;
  onSave: (analytics: boolean) => void;
  onAcceptAll: () => void;
  onClose: () => void;
}

export default function CookieConsentSettings({
  initialAnalytics,
  onSave,
  onAcceptAll,
  onClose,
}: CookieConsentSettingsProps) {
  const [analytics, setAnalytics] = useState(initialAnalytics);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg animate-fade-in rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Настройка файлов cookie
          </h3>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div className="flex items-start gap-3 rounded-md bg-gray-50 p-3">
            <div className="mt-0.5">
              <div className="flex h-5 w-9 items-center rounded-full bg-blue-600 p-0.5">
                <div className="h-4 w-4 translate-x-4 rounded-full bg-white shadow-sm transition-transform" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Необходимые</p>
              <p className="mt-0.5 text-xs text-gray-500">
                Необходимы для работы сайта. Не могут быть отключены.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-md p-3">
            <button
              type="button"
              role="switch"
              aria-checked={analytics}
              onClick={() => setAnalytics(!analytics)}
              className={`mt-0.5 flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors ${
                analytics ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <div
                className={`h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                  analytics ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
            <div>
              <p className="text-sm font-medium text-gray-900">
                Аналитические
              </p>
              <p className="mt-0.5 text-xs text-gray-500">
                Помогают понять, как посетители взаимодействуют с сайтом
                (Яндекс.Метрика).
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t px-6 py-4 sm:flex-row sm:justify-end">
          <button
            onClick={() => onSave(analytics)}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Сохранить выбранные
          </button>
          <button
            onClick={onAcceptAll}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            Принять все
          </button>
        </div>
      </div>
    </div>
  );
}
