/**
 * @fileoverview Skeleton de loading do DataTable Plus.
 * Exibe linhas animadas enquanto os dados carregam.
 */
import { Skeleton } from '@/components/ui/skeleton';

interface DataTableSkeletonProps {
  columnCount?: number;
  rowCount?: number;
}

export function DataTableSkeleton({
  columnCount = 5,
  rowCount = 10,
}: DataTableSkeletonProps) {
  return (
    <div className="space-y-4" data-ai-id="data-table-skeleton">
      {/* Toolbar skeleton */}
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-9 w-64" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
      {/* Table skeleton */}
      <div className="rounded-md border">
        <div className="border-b">
          <div className="flex gap-4 p-3">
            {Array.from({ length: columnCount }).map((_, i) => (
              <Skeleton key={`h-${i}`} className="h-4 flex-1" />
            ))}
          </div>
        </div>
        {Array.from({ length: rowCount }).map((_, i) => (
          <div key={`r-${i}`} className="flex gap-4 p-3 border-b last:border-0">
            {Array.from({ length: columnCount }).map((_, j) => (
              <Skeleton
                key={`c-${i}-${j}`}
                className="h-4 flex-1"
                style={{ opacity: 1 - i * 0.08 }}
              />
            ))}
          </div>
        ))}
      </div>
      {/* Pagination skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <div className="flex gap-1">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>
    </div>
  );
}
