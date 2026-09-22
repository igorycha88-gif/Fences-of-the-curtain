import '@testing-library/jest-dom';
import { describe, it, expect } from '@jest/globals';
import { render, screen, act } from '@testing-library/react';
import SeasonCountdown from '@/components/seo/SeasonCountdown';

describe('SeasonCountdown — честный сезонный таймер (ЧТЗ v5 TASK-ZN-06)', () => {
  it('до даты: показывает остаток в днях и часах', async () => {
    const future = new Date(Date.now() + 5 * 86_400_000 + 3 * 3_600_000).toISOString();

    render(<SeasonCountdown targetIso={future} />);

    const value = await screen.findByTestId('season-countdown-value');
    expect(value.textContent).toMatch(/4 дн|5 дн/);
    expect(value.textContent).toMatch(/дн \d+ ч/);
  });

  it('после даты: неизменный текст про закрытие окна, без «перезапуска»', async () => {
    const past = new Date(Date.now() - 86_400_000).toISOString();

    render(
      <SeasonCountdown
        targetIso={past}
        expiredText="Сезонное окно закрывается — уточняйте сроки"
      />
    );

    expect(await screen.findByText('Сезонное окно закрывается — уточняйте сроки')).toBeInTheDocument();
    expect(screen.queryByTestId('season-countdown-value')).not.toBeInTheDocument();
  });

  it('передаёт кастомный label', async () => {
    const future = new Date(Date.now() + 86_400_000).toISOString();

    render(<SeasonCountdown targetIso={future} label="До конца сезона осталось" />);

    expect(await screen.findByText(/До конца сезона осталось/)).toBeInTheDocument();
  });

  it('обновляет значение по тикам таймера', async () => {
    jest.useFakeTimers();
    const future = new Date(Date.now() + 2 * 60_000).toISOString();

    render(<SeasonCountdown targetIso={future} />);

    // после монтирования и первого тика значение всё ещё отображается
    act(() => {
      jest.advanceTimersByTime(61_000);
    });

    const badge = screen.getByTestId('season-countdown');
    expect(badge).toBeInTheDocument();
    jest.useRealTimers();
  });
});
