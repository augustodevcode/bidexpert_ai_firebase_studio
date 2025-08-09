// src/components/search-results-frame.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { LayoutGrid, List, Loader2, AlertCircle, ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { PlatformSettings } from '@/types';
import { cn } from '@/lib/utils';
import { DataTableFacetedFilter } from './ui/data-table-faceted-filter'; // Importado
import { useReactTable, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, getFacetedRowModel, getFacetedUniqueValues } from "@tanstack/react-table"; // Importar hooks da table

interface SearchResultsFrameProps<TItem> {
  items: TItem[]; 
  totalItemsCount: number; 
  renderGridItem: (item: TItem, index: number) => React.ReactNode;
  renderListItem: (item: TItem, index: number) => React.ReactNode;
  sortOptions: { value: string; label: string }[];
  initialSortBy?: string;
  onSortChange: (sortBy: string) => void;
  platformSettings: PlatformSettings | null;
  isLoading?: boolean;
  emptyStateMessage?: string;
  searchTypeLabel: string; 
  facetedFilterColumns?: {
    id: string;
    title: string;
    options: {
        label: string;
        value: string;
        icon?: React.ComponentType<{ className?: string }>;
    }[];
  }[];
}

const PaginationControls = <TItem,>({
    currentPage,
    totalItemsCount,
    itemsPerPage,
    onPageChange,
}: Pick<SearchResultsFrameProps<TItem>, 'currentPage' | 'totalItemsCount' | 'itemsPerPage' | 'onPageChange'>) => {

    const totalPages = itemsPerPage > 0 ? Math.ceil(totalItemsCount / itemsPerPage) : 1;
    if (totalPages <= 1) return null;

    const pageNumbers = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow + 2) {
        for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
    } else {
        pageNumbers.push(1);
        if (currentPage > 3) pageNumbers.push(-1); 
        let startPage = Math.max(2, currentPage - 1);
        let endPage = Math.min(totalPages - 1, currentPage + 1);
        if (currentPage <= 3) { startPage = 2; endPage = 4; }
        if (currentPage >= totalPages - 2) { startPage = totalPages - 3; endPage = totalPages - 1; }
        for (let i = startPage; i <= endPage; i++) pageNumbers.push(i);
        if (currentPage < totalPages - 2) pageNumbers.push(-1); 
        pageNumbers.push(totalPages);
    }

    return (
        <div className="mt-6 flex flex-col sm:flex-row justify-center items-center gap-4">
             <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>
                    <ChevronLeft className="h-4 w-4" /> Anterior
                </Button>
                <div className="flex items-center gap-1">
                    {pageNumbers.map((page, index) => 
                        page === -1 
                        ? <span key={`ellipsis-${index}`} className="px-1">...</span> 
                        : <Button key={page} variant={currentPage === page ? 'default' : 'outline'} size="icon" className="h-8 w-8 text-xs" onClick={() => onPageChange(page)}>{page}</Button>
                    )}
                </div>
                <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>
                    Próxima <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
};


export default function SearchResultsFrame<TItem extends { id: string | number }>({
  items,
  renderGridItem,
  renderListItem,
  sortOptions,
  initialSortBy = 'relevance',
  onSortChange,
  platformSettings,
  isLoading = false,
  emptyStateMessage = "Nenhum item encontrado com os filtros aplicados.",
  searchTypeLabel,
  facetedFilterColumns = [],
}: Omit<SearchResultsFrameProps<TItem>, 'totalItemsCount' | 'currentPage' | 'itemsPerPage' | 'onPageChange' | 'onItemsPerPageChange'> & {items: TItem[]}) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentSortBy, setCurrentSortBy] = useState(initialSortBy);
  const [columnFilters, setColumnFilters] = React.useState<any[]>([]);
  
  const table = useReactTable({
    data: items,
    columns: [], // As colunas são para a tabela, aqui só precisamos dos dados para filtrar
    state: {
      columnFilters,
    },
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  const handleSortChangeInternal = (value: string) => {
    setCurrentSortBy(value);
    onSortChange(value);
  };
  
  const filteredItems = table.getRowModel().rows.map(row => row.original);
  
  const isFiltered = table.getState().columnFilters.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-card border rounded-lg shadow-sm">
        <p className="text-sm text-muted-foreground">
          {filteredItems.length} {searchTypeLabel} encontrado(s)
        </p>
        <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap justify-end">
           {facetedFilterColumns.map(col => table.getColumn(col.id) ? (
            <DataTableFacetedFilter
                key={col.id}
                column={table.getColumn(col.id)}
                title={col.title}
                options={col.options}
            />
          ) : null)}
          {isFiltered && (
            <Button variant="ghost" onClick={() => table.resetColumnFilters()} className="h-8 px-2 lg:px-3 text-xs">
                Limpar <X className="ml-1 h-3 w-3" />
            </Button>
          )}
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
            <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => setViewMode('grid')} aria-label="Visualização em Grade">
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => setViewMode('list')} aria-label="Visualização em Lista">
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : filteredItems.length > 0 ? (
        <div className={cn("grid gap-6", viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1')}>
          {filteredItems.map((item, index) => (
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

      {/* Não vamos usar a paginação interna do SearchResultsFrame por enquanto */}
    </div>
  );
}
