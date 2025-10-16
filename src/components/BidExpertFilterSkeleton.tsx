// src/components/BidExpertFilterSkeleton.tsx
'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { Filter } from 'lucide-react';

export default function BidExpertFilterSkeleton() {
  return (
    <aside className="w-full md:w-72 lg:w-80 space-y-6 p-1">
      <div className="animate-pulse">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold flex items-center">
            <Filter className="mr-2 h-5 w-5 text-primary" /> Filtros
          </h2>
          <Skeleton className="h-8 w-20" />
        </div>
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-2 border-b pb-4">
              <Skeleton className="h-6 w-3/4" />
              <div className="space-y-1.5 pt-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          ))}
        </div>
       <Skeleton className="h-10 w-full mt-6" />
      </div>
    </aside>
  );
}
