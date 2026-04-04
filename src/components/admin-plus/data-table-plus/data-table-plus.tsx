/**
 * @fileoverview Componente DataTable Plus genérico baseado em TanStack Table v8.
 * Suporta paginação server-side, seleção de linhas, ordenação, filtros
 * facetados, bulk actions e column visibility.
 */
'use client';

import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
  type Table as TanStackTable,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { PaginatedResponse, BulkAction, FacetedFilterConfig } from '@/lib/admin-plus/types';
import { DataTableToolbar } from './data-table-toolbar';
import { DataTablePagination } from './data-table-pagination';
import { DataTableEmptyState } from './data-table-empty-state';
import { DataTableSkeleton } from './data-table-skeleton';
import { useDataTableState } from '@/hooks/use-data-table-state';
import { useServerPagination } from '@/hooks/use-server-pagination';

export interface DataTablePlusProps<TData> {
  /** TanStack column definitions. */
  columns: ColumnDef<TData, unknown>[];
  /** Server response with data + pagination meta. */
  data: PaginatedResponse<TData> | TData[] | null;
  /** Whether data is being loaded. */
  isLoading?: boolean;
  /** Searchable placeholder label. */
  searchPlaceholder?: string;
  /** Faceted filter configurations. */
  facetedFilters?: FacetedFilterConfig[];
  /** Bulk actions when rows are selected. */
  bulkActions?: BulkAction<TData>[];
  /** Extra toolbar content (e.g., export button). */
  toolbarExtra?: React.ReactNode;
  /** Callback when user double-clicks a row (navigate to edit). */
  onRowDoubleClick?: (row: TData) => void;

  /* ── Legacy / backward-compat props (old page pattern) ── */
  pageCount?: number;
  totalRecords?: number;
  total?: number;
  page?: number;
  pageSize?: number;
  pagination?: unknown;
  onPaginationChange?: unknown;
  onPageChange?: ((page: number) => void) | unknown;
  onPageSizeChange?: ((size: number) => void) | unknown;
  sorting?: unknown;
  onSortingChange?: unknown;
  onSortChange?: unknown;
  search?: string;
  searchQuery?: string;
  searchValue?: string;
  onSearchChange?: unknown;
  pageSizeOptions?: unknown[];
  pageIndex?: number;
  rowActions?: unknown;
  getRowId?: ((row: TData) => string) | unknown;
  totalPages?: number;

  /** data-ai-id for root container. */
  'data-ai-id'?: string;
}

export function DataTablePlus<TData>({
  columns,
  data,
  isLoading = false,
  searchPlaceholder = 'Buscar...',
  facetedFilters,
  bulkActions,
  toolbarExtra,
  onRowDoubleClick,
  'data-ai-id': dataAiId,
}: DataTablePlusProps<TData>) {
  const normalizedData = Array.isArray(data)
    ? {
        data,
        total: data.length,
        page: 1,
        pageSize: data.length || 1,
        totalPages: data.length > 0 ? 1 : 0,
      }
    : data;

  const {
    rowSelection,
    setRowSelection,
    columnVisibility,
    setColumnVisibility,
    sorting,
    setSorting,
    columnFilters,
    setColumnFilters,
    selectedCount,
    resetState,
  } = useDataTableState();

  const { params, setPage, setPageSize, setSort, setSearch } = useServerPagination();

  const table = useReactTable({
    data: normalizedData?.data ?? [],
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    manualPagination: true,
    manualSorting: true,
    pageCount: normalizedData?.totalPages ?? -1,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: (updater) => {
      const next = typeof updater === 'function' ? updater(sorting) : updater;
      setSorting(next);
      if (next.length > 0) {
        setSort({ field: next[0].id, direction: next[0].desc ? 'desc' : 'asc' });
      } else {
        setSort(null);
      }
    },
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isLoading) {
    return <DataTableSkeleton columnCount={columns.length} />;
  }

  return (
    <div className="space-y-4" data-ai-id={dataAiId ?? 'data-table-plus'}>
      <DataTableToolbar
        table={table}
        search={params.search ?? ''}
        onSearchChange={setSearch}
        searchPlaceholder={searchPlaceholder}
        facetedFilters={facetedFilters}
        bulkActions={bulkActions}
        selectedCount={selectedCount}
        onResetFilters={resetState}
        extra={toolbarExtra}
      />

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} style={{ width: header.getSize() }}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() ? 'selected' : undefined}
                  className={cn(onRowDoubleClick && 'cursor-pointer')}
                  onDoubleClick={() => onRowDoubleClick?.(row.original)}
                  data-ai-id={`table-row-${row.id}`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32">
                  <DataTableEmptyState />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {normalizedData && normalizedData.totalPages > 0 && (
        <DataTablePagination
          page={normalizedData.page}
          pageSize={normalizedData.pageSize}
          totalItems={normalizedData.total}
          totalPages={normalizedData.totalPages}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          selectedCount={selectedCount}
        />
      )}
    </div>
  );
}

export default DataTablePlus;
