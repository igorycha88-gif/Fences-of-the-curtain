import '@testing-library/jest-dom';
import { describe, it, expect, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';

jest.mock('next/link', () => ({
  __esModule: true,
  default: function MockLink({ children, href, ...props }: any) {
    return <a href={href} {...props}>{children}</a>;
  },
}));

jest.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND');
  },
}));

jest.mock('@/components/layout/Header', () => ({
  __esModule: true,
  default: function MockHeader() {
    return <div data-testid="mock-header" />;
  },
}));

jest.mock('@/components/layout/Footer', () => ({
  __esModule: true,
  default: function MockFooter() {
    return <div data-testid="mock-footer" />;
  },
}));

const findFirst = jest.fn();
const findMany = jest.fn().mockResolvedValue([]);

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  prisma: {
    blogPost: {
      findFirst: (...args: unknown[]) => findFirst(...args),
      findMany: (...args: unknown[]) => findMany(...args),
    },
  },
}));

import BlogPostPage from '@/app/(public)/blog/[slug]/page';

function makePost(createdAt: Date, updatedAt: Date) {
  return {
    id: 'test-post',
    title: 'Тестовая статья о заборах',
    slug: 'test-post',
    excerpt: 'Описание тестовой статьи',
    content: JSON.stringify([{ type: 'paragraph', text: 'Текст статьи' }]),
    coverImage: null,
    createdAt,
    updatedAt,
    published: true,
  };
}

function makeProps(slug = 'test-post') {
  return { params: Promise.resolve({ slug }) };
}

describe('blog/[slug]: AEO freshness — видимая дата «Обновлено»', () => {
  it('показывает «Обновлено», если updatedAt позже createdAt более чем на сутки', async () => {
    findFirst.mockResolvedValueOnce(
      makePost(new Date('2026-06-01'), new Date('2026-10-20'))
    );

    render(await BlogPostPage(makeProps()));

    expect(screen.getByText(/Обновлено:/i)).toBeInTheDocument();
    const time = screen.getByText(/Обновлено:/i).closest('time');
    expect(time).toHaveAttribute('dateTime', new Date('2026-10-20').toISOString());
  });

  it('не показывает «Обновлено», если статья не редактировалась', async () => {
    findFirst.mockResolvedValueOnce(
      makePost(new Date('2026-10-20'), new Date('2026-10-20'))
    );

    render(await BlogPostPage(makeProps()));

    expect(screen.queryByText(/Обновлено:/i)).not.toBeInTheDocument();
  });
});
