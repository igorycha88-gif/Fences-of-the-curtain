import '@testing-library/jest-dom';
import { describe, it, expect, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mockPhoneClick = jest.fn();
const mockTrackEvent = jest.fn();
let mockContactInfo = { phone: '+74993901595', email: 'test@test.ru' };

jest.mock('next/link', () => {
  return function MockLink({ children, href, onClick, ...props }: any) {
    return <a href={href} onClick={onClick} {...props}>{children}</a>;
  };
});

jest.mock('lucide-react', () => ({
  Phone: () => <span data-testid="phone-icon">Phone</span>,
}));

jest.mock('@/lib/seo/metrika', () => ({
  metrikaEvents: { phoneClick: () => mockPhoneClick() },
}));

jest.mock('@/lib/analytics', () => ({
  trackEvent: () => mockTrackEvent(),
}));

jest.mock('@/types/analytics', () => ({
  EVENT_NAMES: { PHONE_CLICK: 'phone_click' },
}));

jest.mock('@/components/providers/ContactInfoProvider', () => ({
  useContactInfo: () => mockContactInfo,
}));

import ContactPhoneBadge from '@/components/layout/ContactPhoneBadge';

describe('ContactPhoneBadge', () => {
  beforeEach(() => {
    mockContactInfo = { phone: '+74993901595', email: 'test@test.ru' };
    mockPhoneClick.mockClear();
    mockTrackEvent.mockClear();
  });

  it('renders phone number', () => {
    render(<ContactPhoneBadge />);
    expect(screen.getByText('+7 (499) 390-15-95')).toBeInTheDocument();
  });

  it('renders phone icon', () => {
    render(<ContactPhoneBadge />);
    expect(screen.getByTestId('phone-icon')).toBeInTheDocument();
  });

  it('renders tel: link with digits only', () => {
    render(<ContactPhoneBadge />);
    const link = screen.getByTitle('Позвонить нам');
    expect(link).toHaveAttribute('href', 'tel:74993901595');
  });

  it('tracks analytics on click', async () => {
    render(<ContactPhoneBadge />);
    await userEvent.click(screen.getByTitle('Позвонить нам'));
    expect(mockPhoneClick).toHaveBeenCalledTimes(1);
    expect(mockTrackEvent).toHaveBeenCalledTimes(1);
  });

  it('returns null when phone is empty', () => {
    mockContactInfo = { phone: '', email: '' };
    const { container } = render(<ContactPhoneBadge />);
    expect(container.innerHTML).toBe('');
  });

  it('applies header variant styles', () => {
    render(<ContactPhoneBadge variant="header" />);
    const link = screen.getByTitle('Позвонить нам');
    expect(link.className).toContain('font-medium');
  });

  it('applies custom className', () => {
    render(<ContactPhoneBadge className="extra-cls" />);
    expect(screen.getByTitle('Позвонить нам').className).toContain('extra-cls');
  });
});
