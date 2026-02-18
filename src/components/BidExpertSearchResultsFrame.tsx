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
    <div className="wrapper-pagination-controls" data-ai-id="pagination-controls">
      <div className="wrapper-pagination-buttons">
        <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} data-ai-id="pagination-btn-prev">
          <ChevronLeft className="icon-pagination" /> Anterior
        </Button>
        <div className="wrapper-page-numbers" data-ai-id="pagination-page-numbers">
          {pageNumbers.map((page, index) =>
            page === -1
              ? <span key={`ellipsis-${index}`} className="text-pagination-ellipsis">...</span>
              : <Button key={page} variant={currentPage === page ? 'default' : 'outline'} size="icon" className="btn-pagination-page" onClick={() => onPageChange(page)} data-ai-id={`pagination-page-${page}`}>{page}</Button>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} data-ai-id="pagination-btn-next">
          Próxima <ChevronRight className="icon-pagination" />
        </Button>
      </div>
      <div className="wrapper-pagination-info">
        <p className="text-pagination-info">Página {currentPage} de {totalPages}</p>
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
    <div className="wrapper-search-results-frame" data-ai-id="bid-expert-search-results-frame">
      <Card className="card-search-results-toolbar" data-ai-id="search-results-toolbar">
        <div className="wrapper-toolbar-content">
          <p className="text-results-count" data-ai-id="search-results-count">
            {isLoading ? `Buscando ${searchTypeLabel}...` : `${finalTotalItemsCount} ${searchTypeLabel} encontrado(s)`}
          </p>
          <div className="wrapper-toolbar-controls" data-ai-id="search-results-controls">
            <Select value={currentSortBy} onValueChange={handleSortChangeInternal}>
              <SelectTrigger className="select-search-sort" data-ai-id="search-sort-select">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent className="select-content-search-sort">
                {sortOptions.map(option => (
                  <SelectItem key={option.value} value={option.value} className="item-search-sort">{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="wrapper-view-mode-buttons" data-ai-id="search-view-mode-buttons">
              {renderGridItem && <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" className="btn-view-mode" onClick={() => setViewMode('grid')} aria-label="Visualização em Grade" data-ai-id="btn-view-grid"><LayoutGrid className="icon-view-mode" /></Button>}
              {renderListItem && <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="icon" className="btn-view-mode" onClick={() => setViewMode('list')} aria-label="Visualização em Lista" data-ai-id="btn-view-list"><List className="icon-view-mode" /></Button>}
              {dataTableColumns && <Button variant={viewMode === 'table' ? 'secondary' : 'ghost'} size="icon" className="btn-view-mode" onClick={() => setViewMode('table')} aria-label="Visualização em Tabela" data-ai-id="btn-view-table"><TableIcon className="icon-view-mode" /></Button>}
            </div>
          </div>
        </div>
      </Card>

      {isLoading ? (
        <div className="wrapper-results-loading" data-ai-id="search-results-loading">
          <Loader2 className="icon-results-loading" />
        </div>
      ) : (items.length > 0 || (viewMode === 'table' && dataTableColumns)) ? ( // A tabela deve sempre ser renderizada para que seus próprios estados internos funcionem
        <>
          {viewMode === 'grid' && renderGridItem && <div className="grid-lots-grid-mode" data-ai-id="search-results-grid">{paginatedItems.map((item, index) => <div key={item.id}>{renderGridItem(item, index)}</div>)}</div>}
          {viewMode === 'list' && renderListItem && <div className="list-search-results-items" data-ai-id="search-results-list">{paginatedItems.map((item, index) => <div key={item.id}>{renderListItem(item, index)}</div>)}</div>}
          {dataTableColumns && (
            <div className="wrapper-data-table-results" data-ai-id="search-results-table">
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
        <Card className="card-no-results" data-ai-id="search-results-empty">
          <CardContent className="content-no-results">
            <AlertCircle className="icon-no-results" />
            <h2 className="header-no-results">Nenhum Resultado</h2>
            <p className="text-no-results-desc">{emptyStateMessage}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
