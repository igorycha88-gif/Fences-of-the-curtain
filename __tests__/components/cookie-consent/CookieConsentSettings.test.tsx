import '@testing-library/jest-dom';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }: any) {
    return <a href={href} {...props}>{children}</a>;
  };
});

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), refresh: jest.fn() }),
  usePathname: () => '/',
}));

jest.mock('next/image', () => {
  return function MockImage(props: any) {
    return <img {...props} />;
  };
});

import CookieConsentSettings from '@/components/cookie-consent/CookieConsentSettings';

describe('CookieConsentSettings', () => {
  const onSave = jest.fn();
  const onAcceptAll = jest.fn();
  const onClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders title and cookie categories', () => {
    render(
      <CookieConsentSettings
        initialAnalytics={false}
        onSave={onSave}
        onAcceptAll={onAcceptAll}
        onClose={onClose}
      />
    );

    expect(screen.getByText('Настройка файлов cookie')).toBeInTheDocument();
    expect(screen.getByText('Необходимые')).toBeInTheDocument();
    expect(screen.getByText('Аналитические')).toBeInTheDocument();
  });

  it('calls onClose when close button clicked', async () => {
    render(
      <CookieConsentSettings
        initialAnalytics={false}
        onSave={onSave}
        onAcceptAll={onAcceptAll}
        onClose={onClose}
      />
    );

    const closeBtn = screen.getByRole('button', { name: '' });
    await userEvent.click(closeBtn);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onSave with analytics state when "Сохранить выбранные" clicked', async () => {
    render(
      <CookieConsentSettings
        initialAnalytics={false}
        onSave={onSave}
        onAcceptAll={onAcceptAll}
        onClose={onClose}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: /Сохранить выбранные/i }));

    expect(onSave).toHaveBeenCalledWith(false);
  });

  it('calls onSave with true after toggling analytics on', async () => {
    render(
      <CookieConsentSettings
        initialAnalytics={false}
        onSave={onSave}
        onAcceptAll={onAcceptAll}
        onClose={onClose}
      />
    );

    const toggle = screen.getByRole('switch');
    await userEvent.click(toggle);
    await userEvent.click(screen.getByRole('button', { name: /Сохранить выбранные/i }));

    expect(onSave).toHaveBeenCalledWith(true);
  });

  it('calls onAcceptAll when "Принять все" clicked', async () => {
    render(
      <CookieConsentSettings
        initialAnalytics={false}
        onSave={onSave}
        onAcceptAll={onAcceptAll}
        onClose={onClose}
      />
    );

    const buttons = screen.getAllByRole('button', { name: 'Принять все' });
    await userEvent.click(buttons[0]);

    expect(onAcceptAll).toHaveBeenCalledTimes(1);
  });

  it('reflects initialAnalytics state on the switch', () => {
    render(
      <CookieConsentSettings
        initialAnalytics={true}
        onSave={onSave}
        onAcceptAll={onAcceptAll}
        onClose={onClose}
      />
    );

    const toggle = screen.getByRole('switch');
    expect(toggle).toHaveAttribute('aria-checked', 'true');
  });
});
