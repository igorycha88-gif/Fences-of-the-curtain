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

jest.mock('next/script', () => {
  return function MockScript(props: any) {
    if (props.dangerouslySetInnerHTML) {
      return <script dangerouslySetInnerHTML={props.dangerouslySetInnerHTML} />;
    }
    return <script src={props.src} async />;
  };
});

jest.mock('@/components/seo/GoogleAnalytics', () => {
  return function MockGA({ gaId }: any) {
    return <div data-testid="google-analytics" data-ga-id={gaId} />;
  };
});

import CookieConsentProvider from '@/components/cookie-consent/CookieConsentProvider';

describe('CookieConsentProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('renders children', () => {
    render(
      <CookieConsentProvider>
        <div data-testid="child">Hello</div>
      </CookieConsentProvider>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('shows banner when no consent stored', () => {
    render(
      <CookieConsentProvider>
        <div>Content</div>
      </CookieConsentProvider>
    );

    expect(screen.getByRole('button', { name: 'Принять все' })).toBeInTheDocument();
  });

  it('hides banner after accepting all cookies', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) }) as any;

    render(
      <CookieConsentProvider>
        <div>Content</div>
      </CookieConsentProvider>
    );

    expect(screen.getByRole('button', { name: 'Принять все' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Принять все' }));

    expect(screen.queryByRole('button', { name: 'Принять все' })).not.toBeInTheDocument();
  });

  it('opens settings when "Настроить" clicked', async () => {
    render(
      <CookieConsentProvider>
        <div>Content</div>
      </CookieConsentProvider>
    );

    await userEvent.click(screen.getByRole('button', { name: 'Настроить' }));

    expect(screen.getByText('Настройка файлов cookie')).toBeInTheDocument();
  });
});
