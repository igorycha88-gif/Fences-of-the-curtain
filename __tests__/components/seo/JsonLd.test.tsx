import '@testing-library/jest-dom';
import { describe, it, expect } from '@jest/globals';
import { render } from '@testing-library/react';
import JsonLd from '@/components/seo/JsonLd';

jest.mock('next/script', () => {
  return function MockScript({ id, type, dangerouslySetInnerHTML }: any) {
    return (
      <script
        id={id}
        type={type}
        dangerouslySetInnerHTML={dangerouslySetInnerHTML}
      />
    );
  };
});

describe('JsonLd', () => {
  it('renders a script tag with type application/ld+json', () => {
    const data = { '@type': 'Organization', name: 'Test' };
    const { container } = render(<JsonLd data={data} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).toBeInTheDocument();
  });

  it('serializes data as JSON in the script tag', () => {
    const data = { '@type': 'Organization', name: 'Test', url: 'https://example.com' };
    const { container } = render(<JsonLd data={data} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(JSON.parse(script!.textContent!)).toEqual(data);
  });

  it('renders with correct id', () => {
    const { container } = render(<JsonLd data={{ name: 'Test' }} />);
    const script = container.querySelector('script#json-ld');
    expect(script).toBeInTheDocument();
  });

  it('handles nested objects correctly', () => {
    const data = {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Moscow',
      },
    };
    const { container } = render(<JsonLd data={data} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    const parsed = JSON.parse(script!.textContent!);
    expect(parsed.address.addressLocality).toBe('Moscow');
  });
});
