/**
 * @fileoverview Paginador do SuperGrid.
 * Controles de navegação de página com select de pageSize.
 */
'use client';

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { PaginationState } from '@tanstack/react-table';

interface GridPaginationProps {
  pagination: PaginationState;
  onPaginationChange: (pagination: PaginationState) => void;
  pageCount: number;
  totalCount: number;
  pageSizeOptions: number[];
}

export function GridPagination({
  pagination,
  onPaginationChange,
  pageCount,
  totalCount,
  pageSizeOptions,
}: GridPaginationProps) {
  const { pageIndex, pageSize } = pagination;
  const canGoPrevious = pageIndex > 0;
  const canGoNext = pageIndex < pageCount - 1;

  const startRow = pageIndex * pageSize + 1;
  const endRow = Math.min((pageIndex + 1) * pageSize, totalCount);

  return (
    <div
      className="flex items-center justify-between border-t px-4 py-3"
      data-ai-id="supergrid-pagination"
    >
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>
          {totalCount > 0
            ? `${startRow}-${endRow} de ${totalCount.toLocaleString('pt-BR')}`
            : 'Nenhum registro'}
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* Page size selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Por página:</span>
          <Select
            value={String(pageSize)}
            onValueChange={(val) =>
              onPaginationChange({ pageIndex: 0, pageSize: Number(val) })
            }
          >
            <SelectTrigger
              className="h-8 w-[70px]"
              data-ai-id="supergrid-page-size-select"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map(size => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Page info */}
        <span className="text-sm text-muted-foreground">
          Página {pageCount > 0 ? pageIndex + 1 : 0} de {pageCount}
        </span>

        {/* Navigation buttons */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => onPaginationChange({ ...pagination, pageIndex: 0 })}
            disabled={!canGoPrevious}
            data-ai-id="supergrid-first-page-btn"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() =>
              onPaginationChange({ ...pagination, pageIndex: pageIndex - 1 })
            }
            disabled={!canGoPrevious}
            data-ai-id="supergrid-prev-page-btn"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() =>
              onPaginationChange({ ...pagination, pageIndex: pageIndex + 1 })
            }
            disabled={!canGoNext}
            data-ai-id="supergrid-next-page-btn"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() =>
              onPaginationChange({ ...pagination, pageIndex: pageCount - 1 })
            }
            disabled={!canGoNext}
            data-ai-id="supergrid-last-page-btn"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
