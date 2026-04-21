import '@testing-library/jest-dom';
import { describe, it, expect } from '@jest/globals';
import { render } from '@testing-library/react';
import JsonLdScript from '@/components/seo/JsonLdScript';

describe('JsonLdScript', () => {
  it('renders a single script for a single data object', () => {
    const data = { '@type': 'Organization', name: 'Test' };
    const { container } = render(<JsonLdScript data={data} />);
    const scripts = container.querySelectorAll('script[type="application/ld+json"]');
    expect(scripts).toHaveLength(1);
  });

  it('renders multiple scripts for an array of data', () => {
    const data = [
      { '@type': 'Organization', name: 'Test1' },
      { '@type': 'Product', name: 'Test2' },
    ];
    const { container } = render(<JsonLdScript data={data} />);
    const scripts = container.querySelectorAll('script[type="application/ld+json"]');
    expect(scripts).toHaveLength(2);
  });

  it('serializes single object data correctly', () => {
    const data = { '@type': 'FAQPage', name: 'FAQ' };
    const { container } = render(<JsonLdScript data={data} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(JSON.parse(script!.textContent!)).toEqual(data);
  });

  it('serializes array data correctly', () => {
    const data = [
      { '@type': 'Organization', name: 'Org' },
      { '@type': 'Product', name: 'Prod' },
    ];
    const { container } = render(<JsonLdScript data={data} />);
    const scripts = container.querySelectorAll('script[type="application/ld+json"]');
    expect(JSON.parse(scripts[0].textContent!)).toEqual(data[0]);
    expect(JSON.parse(scripts[1].textContent!)).toEqual(data[1]);
  });

  it('handles empty array', () => {
    const { container } = render(<JsonLdScript data={[]} />);
    const scripts = container.querySelectorAll('script[type="application/ld+json"]');
    expect(scripts).toHaveLength(0);
  });
});
