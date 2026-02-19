// src/components/BidExpertFilterSkeleton.tsx
'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { Filter } from 'lucide-react';

export default function BidExpertFilterSkeleton() {
  return (
    <aside className="wrapper-filters-skeleton" data-ai-id="bidexpert-filter-skeleton">
      <div className="animate-pulse">
        <div className="wrapper-filter-header">
          <h2 className="header-filter-title">
            <Filter className="icon-filter-title" /> Filtros
          </h2>
          <Skeleton className="skeleton-filter-reset-btn" />
        </div>
        <div className="wrapper-filter-skeleton-list">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="wrapper-filter-skeleton-item">
              <Skeleton className="skeleton-filter-item-title" />
              <div className="wrapper-filter-skeleton-fields">
                <Skeleton className="skeleton-filter-field-full" />
                <Skeleton className="skeleton-filter-field-partial" />
                <Skeleton className="skeleton-filter-field-full" />
              </div>
            </div>
          ))}
        </div>
       <Skeleton className="skeleton-filter-apply-btn" />
      </div>
    </aside>
  );
}
