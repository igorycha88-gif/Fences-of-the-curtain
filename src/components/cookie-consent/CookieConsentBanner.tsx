'use client';

import Link from 'next/link';

interface CookieConsentBannerProps {
  onAccept: () => void;
  onSettings: () => void;
}

export default function CookieConsentBanner({
  onAccept,
  onSettings,
}: CookieConsentBannerProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 animate-slide-up border-t border-gray-200 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
      <div className="container mx-auto max-w-5xl px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-gray-700">
            <p>
              Мы используем файлы cookie для улучшения работы сайта и аналитики.
              Подробнее в{' '}
              <Link
                href="/privacy-policy"
                className="text-blue-600 underline hover:text-blue-800"
                target="_blank"
              >
                Политике конфиденциальности
              </Link>
              .
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
            <button
              onClick={onSettings}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Настроить
            </button>
            <button
              onClick={onAccept}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              Принять все
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
