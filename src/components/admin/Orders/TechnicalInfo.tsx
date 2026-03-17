'use client';

import { useState } from 'react';
import { Info, Monitor, Globe, Fingerprint, ChevronDown, ChevronUp } from 'lucide-react';

interface TechnicalInfoProps {
  estimateId: string;
  userId: string | null;
  user: {
    id: string;
    name: string;
    role: string;
  } | null;
  sessionId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
}

function parseUserAgent(userAgent: string | null): string {
  if (!userAgent) return 'Неизвестно';

  if (userAgent.includes('Chrome') && userAgent.includes('Edg')) {
    const match = userAgent.match(/Edg\/(\d+)/);
    return `Edge ${match?.[1] || ''}`;
  }
  if (userAgent.includes('Chrome')) {
    const match = userAgent.match(/Chrome\/(\d+)/);
    return `Chrome ${match?.[1] || ''}`;
  }
  if (userAgent.includes('Firefox')) {
    const match = userAgent.match(/Firefox\/(\d+)/);
    return `Firefox ${match?.[1] || ''}`;
  }
  if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    const match = userAgent.match(/Version\/(\d+)/);
    return `Safari ${match?.[1] || ''}`;
  }
  if (userAgent.includes('Opera') || userAgent.includes('OPR')) {
    const match = userAgent.match(/(?:Opera|OPR)\/(\d+)/);
    return `Opera ${match?.[1] || ''}`;
  }

  return userAgent.substring(0, 50) + (userAgent.length > 50 ? '...' : '');
}

function getOS(userAgent: string | null): string {
  if (!userAgent) return '';

  if (userAgent.includes('Windows NT 10')) return 'Windows 10';
  if (userAgent.includes('Windows NT 11')) return 'Windows 11';
  if (userAgent.includes('Windows')) return 'Windows';
  if (userAgent.includes('Mac OS X')) {
    const match = userAgent.match(/Mac OS X (\d+[._]\d+)/);
    return `macOS ${match?.[1]?.replace('_', '.') || ''}`;
  }
  if (userAgent.includes('Linux')) return 'Linux';
  if (userAgent.includes('Android')) {
    const match = userAgent.match(/Android (\d+)/);
    return `Android ${match?.[1] || ''}`;
  }
  if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
    const match = userAgent.match(/OS (\d+)/);
    return `iOS ${match?.[1] || ''}`;
  }

  return '';
}

export function TechnicalInfo({
  estimateId,
  userId,
  user,
  sessionId,
  ipAddress,
  userAgent,
}: TechnicalInfoProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const browser = parseUserAgent(userAgent);
  const os = getOS(userAgent);
  const fullDeviceInfo = os ? `${browser} / ${os}` : browser;

  return (
    <div className="bg-white rounded-xl shadow-md border overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <h2 className="text-lg font-bold flex items-center gap-2">
          <span className="text-xl">ℹ️</span>
          Техническая информация
          <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
            только ADMIN
          </span>
        </h2>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {isExpanded && (
        <div className="px-6 pb-6 space-y-4 border-t">
          <div className="flex items-start gap-3 pt-4">
            <Info className="w-4 h-4 text-gray-400 mt-0.5" />
            <div className="flex-1">
              <label className="text-sm text-gray-500 block">ID расчета</label>
              <p className="font-mono text-sm text-gray-900">{estimateId}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Fingerprint className="w-4 h-4 text-gray-400 mt-0.5" />
            <div className="flex-1">
              <label className="text-sm text-gray-500 block">Создатель расчета</label>
              {user ? (
                <p className="font-medium text-gray-900">
                  {user.name} ({user.role === 'ADMIN' ? 'Администратор' : 'Менеджер'})
                </p>
              ) : (
                <p className="text-gray-600">Клиент (через калькулятор)</p>
              )}
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Globe className="w-4 h-4 text-gray-400 mt-0.5" />
            <div className="flex-1">
              <label className="text-sm text-gray-500 block">IP адрес</label>
              <p className="font-mono text-sm text-gray-900">{ipAddress || 'Неизвестно'}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Monitor className="w-4 h-4 text-gray-400 mt-0.5" />
            <div className="flex-1">
              <label className="text-sm text-gray-500 block">User Agent</label>
              <p className="text-sm text-gray-900">{fullDeviceInfo || 'Неизвестно'}</p>
            </div>
          </div>

          {sessionId && (
            <div className="flex items-start gap-3">
              <Fingerprint className="w-4 h-4 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <label className="text-sm text-gray-500 block">Session ID</label>
                <p className="font-mono text-xs text-gray-600">
                  {sessionId.length > 20 ? `${sessionId.substring(0, 20)}...` : sessionId}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
