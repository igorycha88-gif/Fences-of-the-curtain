import '@testing-library/jest-dom';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LeadForm, { LeadFormPlotOption } from '@/components/seo/LeadForm';

const plotOptions: LeadFormPlotOption[] = [
  { value: '6', label: '6 соток (≈100 м)', perimeterM: 100 },
  { value: '10', label: '10 соток (≈130 м)', perimeterM: 130 },
  { value: '25', label: '25 соток (≈200 м)', perimeterM: 200 },
];

function renderForm(props = {}) {
  return render(
    <LeadForm source="skolko-pogonnyh-metrov-v-sotkah" plotOptions={plotOptions} {...props} />
  );
}

async function fillValid(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Ваше имя'), 'Иван');
  // 11 цифр с ведущей 7 — маска приводит к +7 (999) 123-45-67
  await user.type(screen.getByLabelText('Телефон'), '79991234567');
}

describe('LeadForm — форма «Точный расчёт с выездом» (ЧТЗ v5 TASK-ZN-01L)', () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it('рендерит поля: имя, телефон, выбор размера участка', () => {
    renderForm();

    expect(screen.getByTestId('lead-form')).toBeInTheDocument();
    expect(screen.getByLabelText('Ваше имя')).toBeInTheDocument();
    expect(screen.getByLabelText('Телефон')).toBeInTheDocument();
    expect(screen.getByLabelText('Размер участка')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Получить точную смету/i })).toBeInTheDocument();
  });

  it('валидация: пустая форма показывает 2 ошибки и НЕ отправляет запрос', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole('button', { name: /Получить точную смету/i }));

    expect(screen.getByText('Имя должно содержать минимум 2 символа')).toBeInTheDocument();
    expect(screen.getByText('Введите телефон в формате +7 (XXX) XXX-XX-XX')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('валидация: короткое имя и битый телефон', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText('Ваше имя'), 'И');
    await user.type(screen.getByLabelText('Телефон'), '123');
    await user.click(screen.getByRole('button', { name: /Получить точную смету/i }));

    expect(screen.getByText('Имя должно содержать минимум 2 символа')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('маска телефона приводит ввод к формату +7 (XXX) XXX-XX-XX', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText('Телефон'), '79991234567');

    expect(screen.getByLabelText('Телефон')).toHaveValue('+7 (999) 123-45-67');
  });

  it('happy path: отправляет индивидуальную заявку с периметром выбранного участка', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'order-1', isIndividualRequest: true }),
    });
    renderForm();

    await fillValid(user);
    await user.selectOptions(screen.getByLabelText('Размер участка'), '25 соток (≈200 м)');
    await user.click(screen.getByRole('button', { name: /Получить точную смету/i }));

    await waitFor(() =>
      expect(screen.getByTestId('lead-form-success')).toBeInTheDocument()
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/orders');
    expect(options.method).toBe('POST');

    const body = JSON.parse(options.body);
    expect(body.clientName).toBe('Иван');
    expect(body.phone).toBe('+7 (999) 123-45-67');
    expect(body.isIndividualRequest).toBe(true);
    expect(body.fenceParameters.length).toBe(200);
    expect(body.fenceParameters.plotLabel).toBe('25 соток (≈200 м)');
    expect(body.message).toContain('skolko-pogonnyh-metrov-v-sotkah');
  });

  it('happy path: по умолчанию отправляется первый вариант участка', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'order-2' }),
    });
    renderForm();

    await fillValid(user);
    await user.click(screen.getByRole('button', { name: /Получить точную смету/i }));

    await waitFor(() =>
      expect(screen.getByTestId('lead-form-success')).toBeInTheDocument()
    );

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.fenceParameters.length).toBe(100);
  });

  it('error case: сервер вернул 400 — показываем сообщение и остаёмся в форме', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'VALIDATION_ERROR', message: 'Проверьте введённые данные' }),
    });
    renderForm();

    await fillValid(user);
    await user.click(screen.getByRole('button', { name: /Получить точную смету/i }));

    await waitFor(() =>
      expect(screen.getByText('Проверьте введённые данные')).toBeInTheDocument()
    );
    expect(screen.getByTestId('lead-form')).toBeInTheDocument();
  });

  it('error case: rate limit — понятное сообщение', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'RATE_LIMIT_EXCEEDED' }),
    });
    renderForm();

    await fillValid(user);
    await user.click(screen.getByRole('button', { name: /Получить точную смету/i }));

    await waitFor(() =>
      expect(screen.getByText('Слишком много запросов. Попробуйте позже.')).toBeInTheDocument()
    );
  });

  it('error case: сеть упала — сообщение об ошибке отправки', async () => {
    const user = userEvent.setup();
    fetchMock.mockRejectedValue(new Error('network down'));
    renderForm();

    await fillValid(user);
    await user.click(screen.getByRole('button', { name: /Получить точную смету/i }));

    await waitFor(() =>
      expect(screen.getByText('Ошибка отправки заявки. Попробуйте позже.')).toBeInTheDocument()
    );
  });
});
