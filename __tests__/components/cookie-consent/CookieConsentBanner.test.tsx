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

import CookieConsentBanner from '@/components/cookie-consent/CookieConsentBanner';

describe('CookieConsentBanner', () => {
  const onAccept = jest.fn();
  const onSettings = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders cookie consent text and buttons', () => {
    render(<CookieConsentBanner onAccept={onAccept} onSettings={onSettings} />);

    expect(screen.getByText(/Мы используем файлы cookie/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Настроить' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Принять все' })).toBeInTheDocument();
  });

  it('renders privacy policy link', () => {
    render(<CookieConsentBanner onAccept={onAccept} onSettings={onSettings} />);

    const link = screen.getByText('Политике конфиденциальности');
    expect(link).toBeInTheDocument();
    expect(link.closest('a')).toHaveAttribute('href', '/privacy-policy');
  });

  it('calls onAccept when "Принять все" clicked', async () => {
    render(<CookieConsentBanner onAccept={onAccept} onSettings={onSettings} />);

    await userEvent.click(screen.getByRole('button', { name: 'Принять все' }));

    expect(onAccept).toHaveBeenCalledTimes(1);
    expect(onSettings).not.toHaveBeenCalled();
  });

  it('calls onSettings when "Настроить" clicked', async () => {
    render(<CookieConsentBanner onAccept={onAccept} onSettings={onSettings} />);

    await userEvent.click(screen.getByRole('button', { name: 'Настроить' }));

    expect(onSettings).toHaveBeenCalledTimes(1);
    expect(onAccept).not.toHaveBeenCalled();
  });
});
