import '@testing-library/jest-dom';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { render, screen, act, waitFor } from '@testing-library/react';
import React from 'react';
import ContactInfoProvider, { useContactInfo } from '@/components/providers/ContactInfoProvider';
import type { ContactInfoResponse } from '@/services/contact/contactInfoService';

jest.mock('@/services/contact/contactInfoService', () => ({
  __esModule: true,
}));

function ContactConsumer() {
  const { address, phone, email, workHours } = useContactInfo();
  return (
    <div>
      <span data-testid="address">{address || 'Данные не указаны'}</span>
      <span data-testid="phone">{phone}</span>
      <span data-testid="email">{email}</span>
      <span data-testid="monFri">{workHours.monFri}</span>
    </div>
  );
}

const INITIAL_DATA: ContactInfoResponse = {
  address: 'г. Москва, ул. Строителей, д. 5',
  phone: '+74993901595',
  email: 'zabori-naves@yandex.ru',
  workHours: { monFri: 'Пн–Пт: 9:00–20:00', sat: 'Сб: 10:00–18:00', sun: 'Вс: выходной' },
  hasData: true,
};

describe('ContactInfoProvider (ЧТЗ: Контакты SSR)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  it('с initialData данные доступны в первом рендере без fetch-ответа', () => {
    (global.fetch as jest.Mock).mockReturnValue(new Promise(() => {}));

    render(
      <ContactInfoProvider initialData={INITIAL_DATA}>
        <ContactConsumer />
      </ContactInfoProvider>
    );

    expect(screen.getByTestId('address')).toHaveTextContent('г. Москва, ул. Строителей, д. 5');
    expect(screen.getByTestId('phone')).toHaveTextContent('+74993901595');
    expect(screen.getByTestId('email')).toHaveTextContent('zabori-naves@yandex.ru');
    expect(screen.getByTestId('monFri')).toHaveTextContent('Пн–Пт: 9:00–20:00');
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('без initialData — дефолтный телефон и пустые поля (обратная совместимость)', () => {
    (global.fetch as jest.Mock).mockReturnValue(new Promise(() => {}));

    render(
      <ContactInfoProvider>
        <ContactConsumer />
      </ContactInfoProvider>
    );

    expect(screen.getByTestId('phone')).toHaveTextContent('+74993901595');
    expect(screen.getByTestId('address')).toHaveTextContent('Данные не указаны');
    expect(screen.getByTestId('email')).toHaveTextContent('');
  });

  it('клиентский fetch обновляет данные после правки в админке (hasData=true)', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      json: async () => ({
        ...INITIAL_DATA,
        address: 'г. Одинцово, ул. Новая, д. 10',
      }),
    });

    render(
      <ContactInfoProvider initialData={INITIAL_DATA}>
        <ContactConsumer />
      </ContactInfoProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('address')).toHaveTextContent('г. Одинцово, ул. Новая, д. 10');
    });
    expect(screen.getByTestId('phone')).toHaveTextContent('+74993901595');
  });

  it('ошибка fetch не затирает initialData', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('network down'));

    render(
      <ContactInfoProvider initialData={INITIAL_DATA}>
        <ContactConsumer />
      </ContactInfoProvider>
    );

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(screen.getByTestId('address')).toHaveTextContent('г. Москва, ул. Строителей, д. 5');
    expect(screen.getByTestId('email')).toHaveTextContent('zabori-naves@yandex.ru');
  });
});
