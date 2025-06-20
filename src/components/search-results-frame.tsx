
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { LayoutGrid, List, Loader2, AlertCircle } from 'lucide-react';
import type { PlatformSettings } from '@/types';

interface SearchResultsFrameProps<TItem> {
  items: TItem[]; 
  totalItemsCount: number; 
  renderGridItem: (item: TItem, index: number) => React.ReactNode;
  renderListItem: (item: TItem, index: number) => React.ReactNode;
  sortOptions: { value: string; label: string }[];
  initialSortBy?: string;
  onSortChange: (sortBy: string) => void;
  platformSettings: PlatformSettings;
  isLoading?: boolean;
  emptyStateMessage?: string;
  searchTypeLabel: string; 

  // Pagination specific props
  currentPage?: number;
  visibleItemCount?: number;
  onPageChange?: (page: number) => void; 
  onLoadMore?: () => void; 
}

export default function SearchResultsFrame<TItem>({
  items,
  totalItemsCount,
  renderGridItem,
  renderListItem,
  sortOptions,
  initialSortBy = 'relevance',
  onSortChange,
  platformSettings,
  isLoading = false,
  emptyStateMessage = "Nenhum item encontrado com os filtros aplicados.",
  searchTypeLabel,
  currentPage,
  visibleItemCount,
  onPageChange,
  onLoadMore,
}: SearchResultsFrameProps<TItem>) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentSortBy, setCurrentSortBy] = useState(initialSortBy);

  useEffect(() => {
    setCurrentSortBy(initialSortBy);
  }, [initialSortBy]);

  const handleSortChangeInternal = (value: string) => {
    setCurrentSortBy(value);
    onSortChange(value);
  };

  const {
    searchPaginationType = 'loadMore',
    searchItemsPerPage = 12,
    // searchLoadMoreCount is implicitly handled by `visibleItemCount` and `onLoadMore`
  } = platformSettings;

  const totalPages = searchPaginationType === 'numberedPages' && searchItemsPerPage > 0
    ? Math.ceil(totalItemsCount / searchItemsPerPage)
    : 1; 

  return (
    <div className="space-y-6">
      {/* Header: Count, Sort, View Mode */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-card border rounded-lg shadow-sm">
        <p className="text-sm text-muted-foreground">
          Mostrando {items.length} de {totalItemsCount} {searchTypeLabel}
        </p>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Select value={currentSortBy} onValueChange={handleSortChangeInternal}>
            <SelectTrigger className="w-full sm:w-[180px] h-9 text-xs">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground hidden sm:inline">Ver:</span>
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode('grid')}
              aria-label="Visualização em Grade"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode('list')}
              aria-label="Visualização em Lista"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : items.length > 0 ? (
        <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4' : 'grid-cols-1'}`}>
          {items.map((item, index) => (
            viewMode === 'grid' ? renderGridItem(item, index) : renderListItem(item, index)
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
            <h2 className="text-xl font-semibold mb-2">Nenhum Resultado</h2>
            <p className="text-muted-foreground">{emptyStateMessage}</p>
          </CardContent>
        </Card>
      )}

      {/* Pagination Controls */}
      {!isLoading && totalItemsCount > 0 && items.length < totalItemsCount && (
        <div className="mt-8 flex justify-center items-center gap-2">
          {searchPaginationType === 'loadMore' && onLoadMore && visibleItemCount !== undefined && visibleItemCount < totalItemsCount && (
            <Button variant="outline" onClick={onLoadMore}>
              Carregar Mais ({totalItemsCount - visibleItemCount} restantes)
            </Button>
          )}
          {searchPaginationType === 'numberedPages' && onPageChange && currentPage !== undefined && totalPages > 1 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              {/* Basic page numbers - could be enhanced with ellipsis */}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(pageNumber => totalPages <= 5 || Math.abs(pageNumber - currentPage) < 2 || pageNumber === 1 || pageNumber === totalPages) 
                .map((pageNumber, index, arr) => (
                  <React.Fragment key={pageNumber}>
                    {index > 0 && arr[index-1] + 1 !== pageNumber && <span className="px-1">...</span>}
                    <Button
                      variant={currentPage === pageNumber ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => onPageChange(pageNumber)}
                    >
                      {pageNumber}
                    </Button>
                  </React.Fragment>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Próxima
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
