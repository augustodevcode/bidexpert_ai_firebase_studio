'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export default function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <ol className={cn("flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground", className)}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const content = item.href && !isLast ? (
          <Link
            href={item.href}
            className="hover:text-foreground text-muted-foreground transition-colors font-medium whitespace-nowrap"
          >
            {item.label}
          </Link>
        ) : (
          <span
            className={cn(
              "font-semibold text-foreground whitespace-nowrap",
              isLast ? "" : "text-muted-foreground"
            )}
            aria-current={isLast ? "page" : undefined}
          >
            {item.label}
          </span>
        );

        return (
          <li key={index} className="flex items-center whitespace-nowrap">
            {content}
            {!isLast && (
              <ChevronRight className="h-3.5 w-3.5 mx-1 text-muted-foreground/60" aria-hidden="true" />
            )}
          </li>
        );
      })}
    </ol>
  );
}
