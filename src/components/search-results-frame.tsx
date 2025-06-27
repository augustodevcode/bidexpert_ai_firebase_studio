
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { LayoutGrid, List, Loader2, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import type { PlatformSettings } from '@/types';
import { cn } from '@/lib/utils';

interface SearchResultsFrameProps<TItem> {
  items: TItem[]; 
  totalItemsCount: number; 
  renderGridItem: (item: TItem, index: number) => React.ReactNode;
  renderListItem: (item: TItem, index: number) => React.ReactNode;
  sortOptions: { value: string; label: string }[];
  initialSortBy?: string;
  onSortChange: (sortBy: string) => void;
  platformSettings: PlatformSettings | null; // Allow null during initial load
  isLoading?: boolean;
  emptyStateMessage?: string;
  searchTypeLabel: string; 

  // New Pagination Props
  currentPage: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void; 
  onItemsPerPageChange: (size: number) => void;
}

const PaginationControls = <TItem,>({
    currentPage,
    totalItemsCount,
    itemsPerPage,
    onPageChange,
    onItemsPerPageChange,
}: Pick<SearchResultsFrameProps<TItem>, 'currentPage' | 'totalItemsCount' | 'itemsPerPage' | 'onPageChange' | 'onItemsPerPageChange'>) => {

    const totalPages = Math.ceil(totalItemsCount / itemsPerPage);
    if (totalPages <= 1) return null;

    const pageNumbers = [];
    const maxPagesToShow = 5; // e.g., 1 ... 4 5 6 ... 10

    if (totalPages <= maxPagesToShow + 2) {
        for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
    } else {
        pageNumbers.push(1);
        if (currentPage > 3) pageNumbers.push(-1); // Ellipsis

        let startPage = Math.max(2, currentPage - 1);
        let endPage = Math.min(totalPages - 1, currentPage + 1);

        if (currentPage <= 3) {
           startPage = 2;
           endPage = 4;
        }

        if (currentPage >= totalPages - 2) {
            startPage = totalPages - 3;
            endPage = totalPages - 1;
        }

        for (let i = startPage; i <= endPage; i++) pageNumbers.push(i);

        if (currentPage < totalPages - 2) pageNumbers.push(-1); // Ellipsis
        pageNumbers.push(totalPages);
    }


    return (
        <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
                <span>Itens por página:</span>
                 <Select
                    value={String(itemsPerPage)}
                    onValueChange={(value) => onItemsPerPageChange(Number(value))}
                >
                    <SelectTrigger className="w-20 h-8 text-xs">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {[12, 24, 48, 96].map(size => (
                            <SelectItem key={size} value={String(size)}>{size}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
             <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                >
                    <ChevronLeft className="h-4 w-4" /> Anterior
                </Button>
                <div className="flex items-center gap-1">
                    {pageNumbers.map((page, index) => 
                        page === -1 
                        ? <span key={`ellipsis-${index}`} className="px-1">...</span> 
                        : <Button key={page} variant={currentPage === page ? 'default' : 'outline'} size="icon" className="h-8 w-8 text-xs" onClick={() => onPageChange(page)}>{page}</Button>
                    )}
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                >
                    Próxima <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
            <div className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages}
            </div>
        </div>
    );
};


export default function SearchResultsFrame<TItem extends { id: string | number }>({
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
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
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

  return (
    <div className="space-y-6">
      {/* Header: Count, Sort, View Mode */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-card border rounded-lg shadow-sm">
        <p className="text-sm text-muted-foreground">
          {totalItemsCount} {searchTypeLabel} encontrado(s)
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
        <div className={cn("grid gap-6", viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4' : 'grid-cols-1')}>
          {items.map((item, index) => (
            <React.Fragment key={item.id || index}>
              {viewMode === 'grid' ? renderGridItem(item, index) : renderListItem(item, index)}
            </React.Fragment>
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
      {!isLoading && totalItemsCount > 0 && (
         <PaginationControls
          currentPage={currentPage}
          totalItemsCount={totalItemsCount}
          itemsPerPage={itemsPerPage}
          onPageChange={onPageChange}
          onItemsPerPageChange={onItemsPerPageChange}
        />
      )}
    </div>
  );
}
