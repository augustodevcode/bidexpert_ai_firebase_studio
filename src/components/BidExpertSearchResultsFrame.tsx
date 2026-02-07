// src/components/BidExpertSearchResultsFrame.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { LayoutGrid, List, Loader2, AlertCircle, ChevronLeft, ChevronRight, Table as TableIcon } from 'lucide-react';
import type { PlatformSettings } from '@/types';
import { cn } from '@/lib/utils';
import { DataTableToolbar } from './ui/data-table-toolbar'; // Importando a nova toolbar
import { DataTable } from './ui/data-table';
import type { BulkAction } from './ui/data-table-toolbar';
import type { ColumnDef } from '@tanstack/react-table';

interface PaginationControlsProps {
  currentPage: number;
  totalItemsCount: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  totalItemsCount,
  itemsPerPage,
  onPageChange,
}) => {

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
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <p>Página {currentPage} de {totalPages}</p>
      </div>
    </div>
  );
};


interface BidExpertSearchResultsFrameProps<TItem> {
  items: TItem[];
  totalItemsCount?: number;
  renderGridItem?: (item: TItem, index: number) => React.ReactNode;
  renderListItem?: (item: TItem, index: number) => React.ReactNode;
  dataTableColumns?: ColumnDef<TItem, any>[];
  sortOptions: { value: string; label: string }[];
  initialSortBy?: string;
  onSortChange: (sortBy: string) => void;
  platformSettings: PlatformSettings;
  isLoading?: boolean;
  emptyStateMessage?: string;
  searchTypeLabel: string;
  searchColumnId?: string;
  searchPlaceholder?: string;
  searchTerm?: string;
  onSearchTermChange?: (term: string) => void;
  facetedFilterColumns?: {
    id: string;
    title: string;
    options: {
      label: string;
      value: string;
      icon?: React.ComponentType<{ className?: string }>;
    }[];
  }[];

  currentPage?: number;
  onPageChange?: (page: number) => void;
  itemsPerPage?: number;
  onItemsPerPageChange?: (size: number) => void;
  onDeleteSelected?: (selectedItems: TItem[]) => Promise<void>;
  dataTestId?: string;
  bulkActions?: BulkAction<TItem>[];
}

export default function BidExpertSearchResultsFrame<TItem extends { id: string }>({
  items,
  totalItemsCount,
  renderGridItem,
  renderListItem,
  dataTableColumns,
  sortOptions,
  initialSortBy = 'relevance',
  onSortChange,
  platformSettings,
  isLoading = false,
  emptyStateMessage = "Nenhum item encontrado com os filtros aplicados.",
  searchTypeLabel,
  searchColumnId,
  searchPlaceholder,
  searchTerm,
  onSearchTermChange,
  facetedFilterColumns,
  currentPage: controlledCurrentPage,
  onPageChange: onControlledPageChange,
  itemsPerPage: controlledItemsPerPage,
  onItemsPerPageChange,
  onDeleteSelected,
  dataTestId,
  bulkActions,
}: BidExpertSearchResultsFrameProps<TItem>) {
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'table'>('table');
  const [currentSortBy, setCurrentSortBy] = useState(initialSortBy);
  const [internalCurrentPage, setInternalCurrentPage] = useState(1);
  const itemsPerPage = controlledItemsPerPage || platformSettings?.searchItemsPerPage || 12;

  const isPaginated = controlledCurrentPage !== undefined && onControlledPageChange !== undefined;
  const currentPage = isPaginated ? controlledCurrentPage : internalCurrentPage;
  const onPageChange = isPaginated ? onControlledPageChange : setInternalCurrentPage;

  useEffect(() => {
    // Se a view de tabela for a única opção, defina-a como padrão
    if (dataTableColumns) {
      setViewMode('table');
    } else if (renderGridItem) {
      setViewMode('grid');
    } else if (renderListItem) {
      setViewMode('list');
    }
  }, [dataTableColumns, renderGridItem, renderListItem]);

  const handleSortChangeInternal = (value: string) => {
    setCurrentSortBy(value);
    onSortChange(value);
    onPageChange(1);
  };

  const handlePageChangeInternal = (page: number) => {
    onPageChange(page);
    window.scrollTo(0, 0);
  };

  const paginatedItems = useMemo(() => {
    if (isPaginated) return items;
    const startIndex = (currentPage - 1) * itemsPerPage;
    return items.slice(startIndex, startIndex + itemsPerPage);
  }, [items, currentPage, itemsPerPage, isPaginated]);

  const finalTotalItemsCount = totalItemsCount ?? items.length;

  return (
    <div className="space-y-6" data-ai-id="bid-expert-search-results-frame">
      <Card className="p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground w-full sm:w-auto text-center sm:text-left">
            {isLoading ? `Buscando ${searchTypeLabel}...` : `${finalTotalItemsCount} ${searchTypeLabel} encontrado(s)`}
          </p>
          <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap justify-center">
            <Select value={currentSortBy} onValueChange={handleSortChangeInternal}>
              <SelectTrigger className="w-full sm:w-[180px] h-9 text-xs">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-1">
              {renderGridItem && <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => setViewMode('grid')} aria-label="Visualização em Grade"><LayoutGrid className="h-4 w-4" /></Button>}
              {renderListItem && <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => setViewMode('list')} aria-label="Visualização em Lista"><List className="h-4 w-4" /></Button>}
              {dataTableColumns && <Button variant={viewMode === 'table' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => setViewMode('table')} aria-label="Visualização em Tabela"><TableIcon className="h-4 w-4" /></Button>}
            </div>
          </div>
        </div>
      </Card>

      {isLoading ? (
        <div className="flex justify-center items-center py-12"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>
      ) : (items.length > 0 || (viewMode === 'table' && dataTableColumns)) ? ( // A tabela deve sempre ser renderizada para que seus próprios estados internos funcionem
        <>
          {viewMode === 'grid' && renderGridItem && <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" data-ai-id="search-results-grid">{paginatedItems.map((item, index) => <div key={item.id}>{renderGridItem(item, index)}</div>)}</div>}
          {viewMode === 'list' && renderListItem && <div className="space-y-4">{paginatedItems.map((item, index) => <div key={item.id}>{renderListItem(item, index)}</div>)}</div>}
          {dataTableColumns && (
            <div className="block">
              <DataTable
                columns={dataTableColumns}
                data={items} // A tabela gerencia sua própria paginação
                isLoading={isLoading}
                searchColumnId={searchColumnId}
                searchPlaceholder={searchPlaceholder}
                facetedFilterColumns={facetedFilterColumns}
                onDeleteSelected={onDeleteSelected}
                bulkActions={bulkActions}
                dataTestId={dataTestId}
              />
            </div>
          )}
          {viewMode !== 'table' && (
            <PaginationControls
              currentPage={currentPage}
              totalItemsCount={finalTotalItemsCount}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChangeInternal}
            />
          )}
        </>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
            <h2 className="text-xl font-semibold mb-2">Nenhum Resultado</h2>
            <p className="text-muted-foreground">{emptyStateMessage}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
