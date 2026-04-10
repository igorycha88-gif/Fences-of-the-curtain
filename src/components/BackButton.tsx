'use client';

import { useRouter } from 'next/navigation';
import { ButtonHTMLAttributes, ReactNode } from 'react';

interface BackButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

export default function BackButton({ children, className, ...props }: BackButtonProps) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className={className}
      {...props}
    >
      {children}
    </button>
  );
}
