import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  const allItems = [{ label: 'Главная', href: '/' }, ...items];

  return (
    <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6" aria-label="Навигация">
      <ol className="flex items-center gap-2">
        {allItems.map((item, index) => (
          <li key={index} className="flex items-center gap-2">
            {index === 0 ? (
              <Link href={item.href || '/'} className="hover:text-foreground transition-colors">
                <Home className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <ChevronRight className="w-4 h-4 flex-shrink-0" />
                {item.href ? (
                  <Link href={item.href} className="hover:text-foreground transition-colors">
                    {item.label}
                  </Link>
                ) : (
                  <span className="text-foreground font-medium">{item.label}</span>
                )}
              </>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
