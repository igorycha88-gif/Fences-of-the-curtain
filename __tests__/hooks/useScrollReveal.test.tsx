import '@testing-library/jest-dom';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { render, screen, act } from '@testing-library/react';
import React from 'react';

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

import { useScrollReveal, AnimatedSection, StaggerContainer } from '@/hooks/useScrollReveal';

describe('useScrollReveal', () => {
  let observerCallback: IntersectionObserverCallback;
  let observerMock: {
    observe: jest.Mock;
    unobserve: jest.Mock;
    disconnect: jest.Mock;
  };

  beforeEach(() => {
    observerMock = {
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    };

    (global as any).IntersectionObserver = jest.fn((cb: IntersectionObserverCallback) => {
      observerCallback = cb;
      return observerMock;
    }) as any;
  });

  it('creates IntersectionObserver and observes element', () => {
    function TestComponent() {
      const [ref, isVisible] = useScrollReveal();
      return (
        <div ref={ref as React.RefObject<HTMLDivElement>} data-testid="target">
          {isVisible ? 'visible' : 'hidden'}
        </div>
      );
    }

    render(<TestComponent />);

    expect(global.IntersectionObserver).toHaveBeenCalled();
    expect(observerMock.observe).toHaveBeenCalled();
    expect(screen.getByTestId('target')).toHaveTextContent('hidden');
  });

  it('sets isVisible=true when element intersects', () => {
    function TestComponent() {
      const [ref, isVisible] = useScrollReveal();
      return (
        <div ref={ref as React.RefObject<HTMLDivElement>} data-testid="target">
          {isVisible ? 'visible' : 'hidden'}
        </div>
      );
    }

    render(<TestComponent />);

    const mockEntry = { isIntersecting: true } as IntersectionObserverEntry;
    act(() => {
      observerCallback([mockEntry], {} as IntersectionObserver);
    });

    expect(screen.getByTestId('target')).toHaveTextContent('visible');
  });

  it('does not set isVisible=false when triggerOnce=true', () => {
    function TestComponent() {
      const [ref, isVisible] = useScrollReveal({ triggerOnce: true });
      return (
        <div ref={ref as React.RefObject<HTMLDivElement>} data-testid="target">
          {isVisible ? 'visible' : 'hidden'}
        </div>
      );
    }

    render(<TestComponent />);

    const mockEntryIn = { isIntersecting: true } as IntersectionObserverEntry;
    act(() => {
      observerCallback([mockEntryIn], {} as IntersectionObserver);
    });
    expect(screen.getByTestId('target')).toHaveTextContent('visible');

    const mockEntryOut = { isIntersecting: false } as IntersectionObserverEntry;
    act(() => {
      observerCallback([mockEntryOut], {} as IntersectionObserver);
    });
    expect(screen.getByTestId('target')).toHaveTextContent('visible');
  });

  it('toggles isVisible when triggerOnce=false', () => {
    function TestComponent() {
      const [ref, isVisible] = useScrollReveal({ triggerOnce: false });
      return (
        <div ref={ref as React.RefObject<HTMLDivElement>} data-testid="target">
          {isVisible ? 'visible' : 'hidden'}
        </div>
      );
    }

    render(<TestComponent />);

    act(() => {
      observerCallback([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
    });
    expect(screen.getByTestId('target')).toHaveTextContent('visible');

    act(() => {
      observerCallback([{ isIntersecting: false } as IntersectionObserverEntry], {} as IntersectionObserver);
    });
    expect(screen.getByTestId('target')).toHaveTextContent('hidden');
  });

  it('disconnects observer on unmount', () => {
    function TestComponent() {
      const [ref, isVisible] = useScrollReveal();
      return <div ref={ref as React.RefObject<HTMLDivElement>}>{isVisible ? 'visible' : 'hidden'}</div>;
    }

    const { unmount } = render(<TestComponent />);
    unmount();
    expect(observerMock.disconnect).toHaveBeenCalled();
  });

  it('passes threshold and rootMargin to IntersectionObserver', () => {
    function TestComponent() {
      const [ref] = useScrollReveal({ threshold: 0.5, rootMargin: '10px' });
      return <div ref={ref as React.RefObject<HTMLDivElement>}>test</div>;
    }

    render(<TestComponent />);

    expect((global as any).IntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function),
      { threshold: 0.5, rootMargin: '10px' }
    );
  });
});

describe('AnimatedSection', () => {
  beforeEach(() => {
    (global as any).IntersectionObserver = jest.fn(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    }));
  });

  it('renders children', () => {
    render(<AnimatedSection>Test content</AnimatedSection>);
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('starts with opacity-0 class', () => {
    render(<AnimatedSection>Test</AnimatedSection>);
    const wrapper = screen.getByText('Test').closest('div')!;
    expect(wrapper.className).toContain('opacity-0');
  });

  it('applies custom className', () => {
    render(<AnimatedSection className="my-custom-class">Test</AnimatedSection>);
    const wrapper = screen.getByText('Test').closest('div')!;
    expect(wrapper.className).toContain('my-custom-class');
  });
});

describe('StaggerContainer', () => {
  beforeEach(() => {
    (global as any).IntersectionObserver = jest.fn(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    }));
  });

  it('renders children', () => {
    render(
      <StaggerContainer>
        <div>Child 1</div>
        <div>Child 2</div>
      </StaggerContainer>
    );

    expect(screen.getByText('Child 1')).toBeInTheDocument();
    expect(screen.getByText('Child 2')).toBeInTheDocument();
  });

  it('children start with opacity-0 class when not visible', () => {
    render(
      <StaggerContainer>
        <span>Child 1</span>
      </StaggerContainer>
    );

    const span = screen.getByText('Child 1');
    const wrapper = span.parentElement!;
    expect(wrapper.className).toContain('opacity-0');
  });
});
