/**
 * @fileoverview Toolbar do DataTable Plus — busca com debounce, filtros facetados,
 * bulk actions dropdown e toggle de colunas visíveis.
 */
'use client';

import { useEffect, useState, useRef, type ChangeEvent } from 'react';
import type { Table } from '@tanstack/react-table';
import { Search, X, SlidersHorizontal, Columns3 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SEARCH_DEBOUNCE_MS } from '@/lib/admin-plus/constants';
import type { BulkAction, FacetedFilterConfig } from '@/lib/admin-plus/types';

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  facetedFilters?: FacetedFilterConfig[];
  bulkActions?: BulkAction<TData>[];
  selectedCount: number;
  onResetFilters: () => void;
  extra?: React.ReactNode;
}

export function DataTableToolbar<TData>({
  table,
  search,
  onSearchChange,
  searchPlaceholder = 'Buscar...',
  facetedFilters,
  bulkActions,
  selectedCount,
  onResetFilters,
  extra,
}: DataTableToolbarProps<TData>) {
  const [localSearch, setLocalSearch] = useState(search);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync external search into local
  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onSearchChange(val), SEARCH_DEBOUNCE_MS);
  };

  const clearSearch = () => {
    setLocalSearch('');
    onSearchChange('');
  };

  const isFiltered =
    search.length > 0 || table.getState().columnFilters.length > 0;

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between" data-ai-id="data-table-toolbar">
      <div className="flex flex-1 items-center gap-2">
        {/* Search */}
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <Input
            placeholder={searchPlaceholder}
            value={localSearch}
            onChange={handleSearchChange}
            className="pl-9 pr-8 h-9"
            data-ai-id="data-table-search"
          />
          {localSearch && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1 h-7 w-7"
              onClick={clearSearch}
              data-ai-id="data-table-search-clear"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="sr-only">Limpar busca</span>
            </Button>
          )}
        </div>

        {/* Faceted filter indicators */}
        {facetedFilters && facetedFilters.length > 0 && (
          <Button variant="outline" size="sm" className="h-9" data-ai-id="data-table-filters-trigger">
            <SlidersHorizontal className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
            Filtros
            {table.getState().columnFilters.length > 0 && (
              <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                {table.getState().columnFilters.length}
              </Badge>
            )}
          </Button>
        )}

        {isFiltered && (
          <Button variant="ghost" size="sm" className="h-9" onClick={onResetFilters} data-ai-id="data-table-reset">
            <X className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
            Limpar
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Bulk actions */}
        {selectedCount > 0 && bulkActions && bulkActions.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="sm" className="h-9" data-ai-id="data-table-bulk-actions">
                {selectedCount} selecionado{selectedCount > 1 ? 's' : ''}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Ações em lote</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {bulkActions.map((action) => (
                <DropdownMenuCheckboxItem
                  key={action.label}
                  onClick={() => {
                    const selected = table
                      .getFilteredSelectedRowModel()
                      .rows.map((r) => r.original);
                    action.onExecute(selected);
                  }}
                >
                  {action.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {extra}

        {/* Column visibility */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9" data-ai-id="data-table-columns-toggle">
              <Columns3 className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
              Colunas
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuLabel>Visibilidade</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {table
              .getAllColumns()
              .filter((col) => col.getCanHide())
              .map((col) => (
                <DropdownMenuCheckboxItem
                  key={col.id}
                  checked={col.getIsVisible()}
                  onCheckedChange={(v) => col.toggleVisibility(!!v)}
                >
                  {typeof col.columnDef.header === 'string'
                    ? col.columnDef.header
                    : col.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
