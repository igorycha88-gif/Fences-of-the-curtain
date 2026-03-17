'use client';

import { Phone, Mail, MessageSquare } from 'lucide-react';

interface ClientInfoProps {
  clientName: string;
  phone: string;
  email: string | null;
  message: string | null;
}

export function ClientInfo({ clientName, phone, email, message }: ClientInfoProps) {
  return (
    <div className="bg-white rounded-xl shadow-md border p-6">
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        <span className="text-xl">📋</span>
        Данные клиента
      </h2>
      <div className="space-y-4">
        <div>
          <label className="text-sm text-gray-500 block mb-1">ФИО</label>
          <p className="font-medium text-gray-900">{clientName}</p>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm text-gray-500 block mb-1">Телефон</label>
            <a
              href={`tel:${phone.replace(/\D/g, '')}`}
              className="font-medium text-primary hover:underline flex items-center gap-2"
            >
              <Phone className="w-4 h-4" />
              {phone}
            </a>
          </div>
          <a
            href={`tel:${phone.replace(/\D/g, '')}`}
            className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors"
          >
            Позвонить
          </a>
        </div>

        {email && (
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm text-gray-500 block mb-1">Email</label>
              <a
                href={`mailto:${email}`}
                className="font-medium text-primary hover:underline flex items-center gap-2"
              >
                <Mail className="w-4 h-4" />
                {email}
              </a>
            </div>
            <a
              href={`mailto:${email}`}
              className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors"
            >
              Написать
            </a>
          </div>
        )}

        {message && (
          <div className="pt-4 border-t">
            <label className="text-sm text-gray-500 block mb-1 flex items-center gap-1">
              <MessageSquare className="w-4 h-4" />
              Комментарий
            </label>
            <p className="text-gray-700 bg-gray-50 rounded-lg p-3">{message}</p>
          </div>
        )}
      </div>
    </div>
  );
}
