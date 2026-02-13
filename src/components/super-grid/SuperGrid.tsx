/**
 * @fileoverview Componente principal SuperGrid.
 * Grid enterprise-level 100% ShadCN + TanStack Table (headless, MIT).
 *
 * Features:
 * - Paginação server-side com TanStack Query
 * - Multi-sort, global filter, query builder visual
 * - Agrupamento (client-side) com agregações
 * - Edição inline/modal com react-hook-form + Zod
 * - Exportação Excel/CSV
 * - Seleção em lote com ações bulk
 * - Visibilidade de colunas, redimensionamento, densidade
 * - Virtualização (TanStack Virtual)
 * - RBAC por config declarativa
 * - Row actions customizáveis
 */
'use client';

import { useMemo, useCallback } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getGroupedRowModel,
  getExpandedRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type Row,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  Pencil,
  Trash2,
  ChevronRight,
  ChevronDown as ChevronDownIcon,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

// SuperGrid internals
import { SuperGridQueryProvider } from './SuperGridQueryProvider';
import { mergeWithDefaults } from './SuperGrid.config';
import { useGridState } from './hooks/useGridState';
import { useGridData } from './hooks/useGridData';
import { useGridExport } from './hooks/useGridExport';
import { useGridMutations } from './hooks/useGridMutations';
import { useGridPermissions } from './hooks/useGridPermissions';
import {
  formatCellValue,
  getNestedValue,
  getAlignClass,
  getDensityClasses,
  buildPrismaIncludes,
  getSearchableColumns,
} from './utils/columnHelpers';

// Feature components
import { GridToolbar } from './features/GridToolbar';
import { GridPagination } from './features/GridPagination';
import { EditModal } from './features/EditModal';
import { BulkActionsBar } from './features/BulkActionsBar';
import { AggregateFooter } from './features/AggregateFooter';

import type { SuperGridConfig, GridColumn } from './SuperGrid.types';

// ==========================================
// PROPS
// ==========================================

interface SuperGridProps<TEntity = Record<string, unknown>> {
  config: SuperGridConfig<TEntity>;
}

// ==========================================
// INNER GRID (wrapped by QueryProvider)
// ==========================================

function SuperGridInner<TEntity extends Record<string, unknown>>({
  config: userConfig,
}: SuperGridProps<TEntity>) {
  const config = useMemo(
    () => mergeWithDefaults(userConfig),
    [userConfig]
  );

  // --- State ---
  const state = useGridState(config);
  const permissions = useGridPermissions(config);

  // --- Data ---
  const {
    data,
    totalCount,
    pageCount,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useGridData({
    config,
    pagination: state.pagination,
    sorting: state.sorting,
    globalFilter: state.globalFilter,
    queryBuilderState: state.queryBuilderState,
    grouping: state.grouping,
  });

  // --- Export ---
  const { exportData, isExporting } = useGridExport({
    config: {
      entity: config.entity,
      columns: config.columns as GridColumn[],
      export: config.features.export,
    },
    currentParams: {
      sorting: state.sorting,
      filters: state.queryBuilderState,
      globalFilter: state.globalFilter,
      searchableColumns: getSearchableColumns(config.columns as GridColumn[]),
      includes: buildPrismaIncludes(config.columns as GridColumn[]),
    },
  });

  // --- Mutations ---
  const { saveMutation, deleteMutation, isSaving, isDeleting } = useGridMutations({
    gridId: config.id,
    entity: config.entity,
    onError: config.callbacks?.onError,
    onSaveSuccess: () => {
      state.setEditingRow(null);
      state.setIsAddingNew(false);
    },
    onDeleteSuccess: () => {
      state.setRowSelection({});
    },
  });

  // --- Virtualizer ref ---
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // ==========================================
  // BUILD TANSTACK COLUMNS
  // ==========================================

  const columns = useMemo<ColumnDef<TEntity>[]>(() => {
    const cols: ColumnDef<TEntity>[] = [];

    // Selection checkbox column
    if (config.features.selection.enabled && config.features.selection.mode !== 'none') {
      cols.push({
        id: '_selection',
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && 'indeterminate')
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Selecionar todos"
            data-ai-id="supergrid-select-all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Selecionar linha"
            data-ai-id={`supergrid-select-row-${row.index}`}
          />
        ),
        enableSorting: false,
        enableHiding: false,
        size: 40,
      });
    }

    // Data columns
    (config.columns as GridColumn<TEntity>[]).forEach((colConfig) => {
      cols.push({
        id: colConfig.id,
        accessorFn: (row: TEntity) => getNestedValue(row as Record<string, unknown>, colConfig.accessorKey),
        header: ({ column }) => {
          if (!colConfig.sortable) {
            return <span>{colConfig.header}</span>;
          }
          const sorted = column.getIsSorted();
          return (
            <Button
              variant="ghost"
              size="sm"
              className="-ml-3 h-8"
              onClick={() => column.toggleSorting(undefined, config.features.sorting.multiSort)}
              data-ai-id={`supergrid-sort-${colConfig.id}`}
            >
              {colConfig.header}
              {sorted === 'asc' ? (
                <ArrowUp className="ml-1 h-3 w-3" />
              ) : sorted === 'desc' ? (
                <ArrowDown className="ml-1 h-3 w-3" />
              ) : (
                <ArrowUpDown className="ml-1 h-3 w-3 opacity-30" />
              )}
            </Button>
          );
        },
        cell: ({ row, getValue }) => {
          const value = getValue();

          // Custom cell renderer
          if (colConfig.Cell) {
            const CellComponent = colConfig.Cell;
            return <CellComponent row={row.original} value={value} />;
          }

          // Select with color badges
          if (colConfig.type === 'select' && colConfig.selectOptions) {
            const opt = colConfig.selectOptions.find(o => o.value === String(value));
            if (opt) {
              return (
                <Badge
                  variant="outline"
                  className="font-normal"
                  style={opt.color ? { borderColor: opt.color, color: opt.color } : undefined}
                >
                  {opt.label}
                </Badge>
              );
            }
          }

          // Boolean checkbox display
          if (colConfig.type === 'boolean') {
            return (
              <Checkbox checked={!!value} disabled className="pointer-events-none" />
            );
          }

          // Default formatted text
          return (
            <span className={getAlignClass(colConfig as GridColumn)}>
              {formatCellValue(value, colConfig as GridColumn)}
            </span>
          );
        },
        enableGrouping: colConfig.groupable !== false,
        enableSorting: colConfig.sortable !== false,
        enableHiding: true,
        size: colConfig.width,
        minSize: colConfig.minWidth || 60,
        maxSize: colConfig.maxWidth || 600,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        aggregationFn: (colConfig.aggregationFn || undefined) as any,
      });
    });

    // Row actions column
    if (config.features.rowActions?.length || (config.features.editing.enabled && (permissions.canEdit || permissions.canDelete))) {
      cols.push({
        id: '_actions',
        header: () => null,
        cell: ({ row }) => (
          <RowActionsCell
            row={row}
            config={config}
            permissions={permissions}
            onEdit={(r) => state.setEditingRow(r as TEntity)}
            onDelete={(id) => deleteMutation.mutate([id])}
          />
        ),
        enableSorting: false,
        enableHiding: false,
        size: 50,
      });
    }

    return cols;
  }, [config, permissions, deleteMutation, state]);

  // ==========================================
  // TANSTACK TABLE INSTANCE
  // ==========================================

  const table = useReactTable({
    data: data as TEntity[],
    columns,
    pageCount,
    state: {
      pagination: state.pagination,
      sorting: state.sorting,
      columnFilters: state.columnFilters,
      columnVisibility: state.columnVisibility,
      rowSelection: state.rowSelection,
      grouping: state.grouping,
    },
    onPaginationChange: state.setPagination,
    onSortingChange: state.setSorting,
    onColumnFiltersChange: state.setColumnFilters,
    onColumnVisibilityChange: state.setColumnVisibility,
    onRowSelectionChange: state.setRowSelection,
    onGroupingChange: (updater) => {
      const newGrouping = typeof updater === 'function' ? updater(state.grouping) : updater;
      state.setGrouping(newGrouping);
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getGroupedRowModel: config.features.grouping.enabled ? getGroupedRowModel() : undefined,
    getExpandedRowModel: config.features.grouping.enabled ? getExpandedRowModel() : undefined,
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    enableMultiSort: config.features.sorting.multiSort,
    enableColumnResizing: config.behavior.resizableColumns,
    columnResizeMode: 'onChange',
    getRowId: (row) => String((row as Record<string, unknown>).id ?? Math.random()),
  });

  // ==========================================
  // VIRTUALIZER
  // ==========================================

  const { rows } = table.getRowModel();
  const rowVirtualizer = config.behavior.virtualizeRows
    ? useVirtualizer({
        count: rows.length,
        getScrollElement: () => tableContainerRef.current,
        estimateSize: () =>
          state.density === 'compact' ? 32 : state.density === 'comfortable' ? 52 : 40,
        overscan: 10,
      })
    : null;

  const virtualRows = rowVirtualizer?.getVirtualItems();
  const totalVirtualSize = rowVirtualizer?.getTotalSize();

  // ==========================================
  // HANDLERS
  // ==========================================

  const handleAddNew = useCallback(() => {
    state.setIsAddingNew(true);
    state.setEditingRow(null);
  }, [state]);

  const handleSave = useCallback(
    (rowData: Record<string, unknown>, id?: string) => {
      saveMutation.mutate({ data: rowData, id });
    },
    [saveMutation]
  );

  const handleBulkDelete = useCallback(() => {
    const selectedIds = Object.keys(state.rowSelection);
    if (selectedIds.length > 0) {
      deleteMutation.mutate(selectedIds);
    }
  }, [state.rowSelection, deleteMutation]);

  const selectedKeys = Object.keys(state.rowSelection);
  const hasSelection = config.features.selection.enabled && config.features.selection.mode !== 'none';

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div
      className="flex flex-col gap-4"
      data-ai-id="supergrid-container"
    >
      {/* Toolbar */}
      <GridToolbar
        config={config as SuperGridConfig}
        globalFilter={state.globalFilter}
        onGlobalFilterChange={state.setGlobalFilter}
        isQueryBuilderOpen={state.isQueryBuilderOpen}
        onQueryBuilderOpenChange={state.setIsQueryBuilderOpen}
        queryBuilderState={state.queryBuilderState}
        onQueryBuilderChange={state.setQueryBuilderState}
        columnVisibility={state.columnVisibility}
        onColumnVisibilityChange={state.setColumnVisibility}
        density={state.density}
        onDensityChange={state.setDensity}
        grouping={state.grouping}
        onGroupingChange={state.setGrouping}
        onExport={exportData}
        isExporting={isExporting}
        onAddNew={handleAddNew}
        onRefresh={refetch}
        totalCount={totalCount}
        isFetching={isFetching}
        canCreate={permissions.canCreate}
        canExport={permissions.canExport}
      />

      {/* Table */}
      <div
        ref={tableContainerRef}
        className={`rounded-md border overflow-auto ${
          config.behavior.stickyHeader ? 'max-h-[calc(100vh-320px)]' : ''
        }`}
        data-ai-id="supergrid-table-container"
      >
        <Table>
          <TableHeader className={config.behavior.stickyHeader ? 'sticky top-0 z-10 bg-background' : ''}>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    colSpan={header.colSpan}
                    className={getDensityClasses(state.density)}
                    style={{
                      width: header.getSize(),
                      position: 'relative',
                    }}
                    data-ai-id={`supergrid-header-${header.id}`}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}

                    {/* Column resizer */}
                    {config.behavior.resizableColumns && header.column.getCanResize() && (
                      <div
                        onMouseDown={header.getResizeHandler()}
                        onTouchStart={header.getResizeHandler()}
                        className="absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none hover:bg-primary/50"
                        style={{
                          transform: header.column.getIsResizing()
                            ? `translateX(${table.getState().columnSizingInfo.deltaOffset ?? 0}px)`
                            : '',
                        }}
                      />
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {isLoading ? (
              // Loading skeletons
              Array.from({ length: state.pagination.pageSize > 10 ? 10 : state.pagination.pageSize }).map(
                (_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    {table.getVisibleFlatColumns().map((col) => (
                      <TableCell
                        key={col.id}
                        className={getDensityClasses(state.density)}
                      >
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                )
              )
            ) : isError ? (
              <TableRow>
                <TableCell
                  colSpan={table.getVisibleFlatColumns().length}
                  className="text-center py-8"
                >
                  <p className="text-destructive font-medium">Erro ao carregar dados</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {error?.message || 'Tente novamente'}
                  </p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
                    Tentar novamente
                  </Button>
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={table.getVisibleFlatColumns().length}
                  className="text-center py-12"
                  data-ai-id="supergrid-empty-state"
                >
                  <p className="text-muted-foreground">Nenhum registro encontrado</p>
                </TableCell>
              </TableRow>
            ) : config.behavior.virtualizeRows && virtualRows ? (
              // Virtualized rows
              <>
                {virtualRows.length > 0 && (
                  <TableRow style={{ height: `${virtualRows[0].start}px` }}>
                    <TableCell colSpan={table.getVisibleFlatColumns().length} className="p-0" />
                  </TableRow>
                )}
                {virtualRows.map((virtualRow: { index: number; start: number; size: number }) => {
                  const row = rows[virtualRow.index];
                  return (
                    <DataRow
                      key={row.id}
                      row={row}
                      density={state.density}
                      onRowClick={config.callbacks?.onRowClick}
                    />
                  );
                })}
                {virtualRows.length > 0 && (
                  <TableRow
                    style={{
                      height: `${(totalVirtualSize ?? 0) - (virtualRows[virtualRows.length - 1]?.end ?? 0)}px`,
                    }}
                  >
                    <TableCell colSpan={table.getVisibleFlatColumns().length} className="p-0" />
                  </TableRow>
                )}
              </>
            ) : (
              // Normal rows
              rows.map((row) => (
                <DataRow
                  key={row.id}
                  row={row}
                  density={state.density}
                  onRowClick={config.callbacks?.onRowClick}
                />
              ))
            )}
          </TableBody>

          {/* Aggregate footer */}
          {config.features.grouping.showAggregates && (
            <AggregateFooter
              table={table as unknown as import('@tanstack/react-table').Table<Record<string, unknown>>}
              columns={config.columns as GridColumn[]}
              density={state.density}
              hasSelection={hasSelection}
            />
          )}
        </Table>
      </div>

      {/* Pagination */}
      {config.features.pagination.enabled && (
        <GridPagination
          pagination={state.pagination}
          onPaginationChange={state.setPagination}
          pageCount={pageCount}
          totalCount={totalCount}
          pageSizeOptions={config.features.pagination.pageSizeOptions}
        />
      )}

      {/* Edit Modal */}
      {config.features.editing.enabled && (
        <EditModal
          open={state.editingRow !== null || state.isAddingNew}
          onOpenChange={(open) => {
            if (!open) {
              state.setEditingRow(null);
              state.setIsAddingNew(false);
            }
          }}
          columns={config.columns as GridColumn[]}
          row={state.editingRow as Record<string, unknown> | null}
          isNew={state.isAddingNew}
          onSave={handleSave}
          isSaving={isSaving}
          title={
            state.isAddingNew
              ? `Novo ${config.title || config.entity}`
              : `Editar ${config.title || config.entity}`
          }
          validationSchema={config.features.editing.validationSchema}
        />
      )}

      {/* Bulk actions */}
      {config.features.editing.allowBulkDelete && permissions.canDelete && (
        <BulkActionsBar
          selectedCount={selectedKeys.length}
          onDelete={handleBulkDelete}
          onClearSelection={() => state.setRowSelection({})}
          isDeleting={isDeleting}
          canDelete={permissions.canDelete}
          confirmDelete={config.features.editing.confirmDelete}
        />
      )}
    </div>
  );
}

// ==========================================
// DATA ROW COMPONENT
// ==========================================

interface DataRowProps<TEntity> {
  row: Row<TEntity>;
  density: 'compact' | 'normal' | 'comfortable';
  onRowClick?: (row: TEntity) => void;
}

function DataRow<TEntity>({ row, density, onRowClick }: DataRowProps<TEntity>) {
  // Grouped row header
  if (row.getIsGrouped()) {
    return (
      <TableRow className="bg-muted/30 font-medium">
        <TableCell
          colSpan={row.getVisibleCells().length}
          className={getDensityClasses(density)}
        >
          <button
            onClick={row.getToggleExpandedHandler()}
            className="flex items-center gap-2"
          >
            {row.getIsExpanded() ? (
              <ChevronDownIcon className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            <span>{String(row.groupingValue)}</span>
            <Badge variant="secondary" className="ml-1 text-xs">
              {row.subRows.length}
            </Badge>
          </button>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <TableRow
      data-state={row.getIsSelected() ? 'selected' : undefined}
      className={onRowClick ? 'cursor-pointer' : ''}
      onClick={() => onRowClick?.(row.original)}
      data-ai-id={`supergrid-row-${row.index}`}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell
          key={cell.id}
          className={getDensityClasses(density)}
          style={{ width: cell.column.getSize() }}
        >
          {cell.getIsGrouped() ? null : cell.getIsAggregated() ? (
            flexRender(cell.column.columnDef.aggregatedCell ?? cell.column.columnDef.cell, cell.getContext())
          ) : cell.getIsPlaceholder() ? null : (
            flexRender(cell.column.columnDef.cell, cell.getContext())
          )}
        </TableCell>
      ))}
    </TableRow>
  );
}

// ==========================================
// ROW ACTIONS CELL
// ==========================================

interface RowActionsCellProps<TEntity> {
  row: Row<TEntity>;
  config: SuperGridConfig<TEntity>;
  permissions: { canEdit: boolean; canDelete: boolean };
  onEdit: (row: TEntity) => void;
  onDelete: (id: string) => void;
}

function RowActionsCell<TEntity>({
  row,
  config,
  permissions,
  onEdit,
  onDelete,
}: RowActionsCellProps<TEntity>) {
  const rowData = row.original;
  const rowId = String((rowData as Record<string, unknown>).id ?? '');

  const customActions = (config.features.rowActions || []).filter(
    (action) => !action.visible || action.visible(rowData)
  );

  const hasEditAction = config.features.editing.enabled && permissions.canEdit;
  const hasDeleteAction =
    config.features.editing.enabled &&
    config.features.editing.allowDelete &&
    permissions.canDelete;

  if (!hasEditAction && !hasDeleteAction && customActions.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          data-ai-id={`supergrid-row-actions-${row.index}`}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" data-ai-id="supergrid-row-actions-menu">
        {hasEditAction && (
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onEdit(rowData);
            }}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </DropdownMenuItem>
        )}

        {customActions.map((action) => (
          <DropdownMenuItem
            key={action.id}
            onClick={(e) => {
              e.stopPropagation();
              action.onClick(rowData);
            }}
          >
            {action.label}
          </DropdownMenuItem>
        ))}

        {hasDeleteAction && (
          <>
            {(hasEditAction || customActions.length > 0) && <DropdownMenuSeparator />}
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(rowId);
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ==========================================
// PUBLIC COMPONENT (with QueryProvider wrapper)
// ==========================================

export function SuperGrid<TEntity extends Record<string, unknown>>(
  props: SuperGridProps<TEntity>
) {
  return (
    <SuperGridQueryProvider>
      <SuperGridInner {...props} />
    </SuperGridQueryProvider>
  );
}

export default SuperGrid;
