import '@testing-library/jest-dom';
import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';

import Layout, { metadata } from '@/app/(public)/zabory-navesy/layout';

describe('zabory-navesy layout', () => {
  it('has a default export React component rendering children (regression BUG-006)', () => {
    expect(typeof Layout).toBe('function');
    render(
      <Layout>
        <div data-testid="child-content">Города</div>
      </Layout>
    );
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });

  it('exposes index page metadata with canonical path', () => {
    expect(String(metadata.title)).toContain('Подмосковье');
    expect(metadata.alternates?.canonical).toBe('https://zabor-i-naves.ru/zabory-navesy');
  });
});
