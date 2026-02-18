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
 * - Congelamento de painéis (freeze panes) com CSS sticky
 * - Destaque de linhas/colunas (highlight, striped, hover)
 * - Edição inline de células (modo cell) como Excel
 * - Internacionalização (i18n) com locale configurável
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
import { PT_BR_LOCALE } from './SuperGrid.i18n';

// Feature components
import { GridToolbar } from './features/GridToolbar';
import { GridPagination } from './features/GridPagination';
import { EditModal } from './features/EditModal';
import { BulkActionsBar } from './features/BulkActionsBar';
import { AggregateFooter } from './features/AggregateFooter';
import { InlineCellEditor } from './features/InlineCellEditor';

import type { SuperGridConfig, GridColumn } from './SuperGrid.types';
import type { GridLocale } from './SuperGrid.i18n';

// ==========================================
// PROPS
// ==========================================

interface SuperGridProps<TEntity = Record<string, unknown>> {
  config: SuperGridConfig<TEntity>;
}

// ==========================================
// FREEZE PANE HELPERS
// ==========================================

/** Calcula offset sticky acumulativo para colunas fixadas */
function computeFreezeOffsets(
  columns: GridColumn[],
  visibleColumns: { id: string; getSize: () => number }[],
  side: 'left' | 'right'
): Map<string, number> {
  const offsets = new Map<string, number>();
  const pinnedCols = columns.filter(c => c.pinned === side);
  if (pinnedCols.length === 0) return offsets;

  if (side === 'left') {
    let accum = 0;
    // Add selection column width if present
    const selCol = visibleColumns.find(c => c.id === '_selection');
    if (selCol) {
      accum = selCol.getSize();
    }
    pinnedCols.forEach(col => {
      offsets.set(col.id, accum);
      const visCol = visibleColumns.find(c => c.id === col.id);
      accum += visCol?.getSize() ?? col.width ?? 150;
    });
  } else {
    // Right side: accumulate from right
    let accum = 0;
    const actionsCol = visibleColumns.find(c => c.id === '_actions');
    if (actionsCol) {
      accum = actionsCol.getSize();
    }
    [...pinnedCols].reverse().forEach(col => {
      offsets.set(col.id, accum);
      const visCol = visibleColumns.find(c => c.id === col.id);
      accum += visCol?.getSize() ?? col.width ?? 150;
    });
  }

  return offsets;
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

  // Locale (default PT-BR)
  const locale: GridLocale = config.locale ?? PT_BR_LOCALE;

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
      state.cancelCellEdit();
    },
    onDeleteSuccess: () => {
      state.setRowSelection({});
    },
  });

  // --- Virtualizer ref ---
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // --- Freeze panes ---
  const freezeEnabled = config.freezePanes?.enabled !== false;
  const showDividerShadow = config.freezePanes?.showDividerShadow !== false;

  // --- Highlight config ---
  const highlightActiveRow = config.highlight?.activeRow ?? false;
  const highlightStriped = config.highlight?.stripedRows ?? false;
  const highlightColumnHover = config.highlight?.columnHover ?? false;
  const highlightRules = config.highlight?.rules ?? [];

  // --- Inline editing mode (cell) ---
  const isInlineMode = config.features.editing.enabled &&
    (config.features.editing.mode === 'cell' || config.features.editing.mode === 'inline');

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
            aria-label={locale.selection.selectAll}
            data-ai-id="supergrid-select-all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label={locale.selection.selectRow}
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
          const rowId = String((row.original as Record<string, unknown>).id ?? row.index);

          // Inline editing active for this cell?
          if (
            isInlineMode &&
            state.editingCellId?.rowId === rowId &&
            state.editingCellId?.columnId === colConfig.id
          ) {
            return (
              <InlineCellEditor
                column={colConfig as GridColumn}
                value={state.editingCellValue}
                rowId={rowId}
                onSave={(newValue) => {
                  const updatedData = {
                    ...(row.original as Record<string, unknown>),
                    [colConfig.accessorKey]: newValue,
                  };
                  saveMutation.mutate({ data: updatedData, id: rowId });
                }}
                onCancel={state.cancelCellEdit}
                onTabNext={() => {
                  // Find next editable column
                  const editableCols = (config.columns as GridColumn<TEntity>[]).filter(
                    c => c.editable === true || (typeof c.editable === 'function' && c.editable(row.original))
                  );
                  const currentIdx = editableCols.findIndex(c => c.id === colConfig.id);
                  if (currentIdx < editableCols.length - 1) {
                    const nextCol = editableCols[currentIdx + 1];
                    const nextValue = getNestedValue(
                      row.original as Record<string, unknown>,
                      nextCol.accessorKey
                    );
                    state.startCellEdit(rowId, nextCol.id, nextValue);
                  }
                }}
                locale={locale}
              />
            );
          }

          // Check if cell is editable (for double-click activation)
          const isCellEditable = isInlineMode && (
            colConfig.editable === true ||
            (typeof colConfig.editable === 'function' && colConfig.editable(row.original))
          );

          const cellContent = (() => {
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
          })();

          // Wrap with double-click handler for inline editing
          if (isCellEditable) {
            return (
              <div
                className="cursor-cell min-h-[20px]"
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  state.startCellEdit(rowId, colConfig.id, value);
                }}
                title={locale.inlineEditing.editCellTooltip}
                data-ai-id={`supergrid-cell-editable-${colConfig.id}-${row.index}`}
              >
                {cellContent}
              </div>
            );
          }

          return cellContent;
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
            onEdit={(r) => {
              if (isInlineMode) {
                // In inline mode, clicking edit opens first editable cell
                const rowId = String((r as Record<string, unknown>).id ?? row.index);
                const firstEditable = (config.columns as GridColumn<TEntity>[]).find(
                  c => c.editable === true || (typeof c.editable === 'function' && c.editable(r))
                );
                if (firstEditable) {
                  const value = getNestedValue(
                    r as Record<string, unknown>,
                    firstEditable.accessorKey
                  );
                  state.startCellEdit(rowId, firstEditable.id, value);
                }
              } else {
                state.setEditingRow(r as TEntity);
              }
            }}
            onDelete={(id) => deleteMutation.mutate([id])}
            locale={locale}
          />
        ),
        enableSorting: false,
        enableHiding: false,
        size: 50,
      });
    }

    return cols;
  }, [config, permissions, deleteMutation, state, locale, isInlineMode, saveMutation]);

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
  // FREEZE PANE OFFSETS (computed from visible columns)
  // ==========================================

  const visibleFlatColumns = table.getVisibleFlatColumns();
  const leftOffsets = useMemo(() => {
    if (!freezeEnabled) return new Map<string, number>();
    return computeFreezeOffsets(
      config.columns as GridColumn[],
      visibleFlatColumns,
      'left'
    );
  }, [config.columns, visibleFlatColumns, freezeEnabled]);

  const rightOffsets = useMemo(() => {
    if (!freezeEnabled) return new Map<string, number>();
    return computeFreezeOffsets(
      config.columns as GridColumn[],
      visibleFlatColumns,
      'right'
    );
  }, [config.columns, visibleFlatColumns, freezeEnabled]);

  /** Returns sticky style for a column if pinned */
  const getFreezeStyle = useCallback((columnId: string): React.CSSProperties => {
    if (!freezeEnabled) return {};
    if (leftOffsets.has(columnId)) {
      return {
        position: 'sticky',
        left: leftOffsets.get(columnId)!,
        zIndex: 20,
        backgroundColor: 'hsl(var(--background))',
      };
    }
    if (rightOffsets.has(columnId)) {
      return {
        position: 'sticky',
        right: rightOffsets.get(columnId)!,
        zIndex: 20,
        backgroundColor: 'hsl(var(--background))',
      };
    }
    return {};
  }, [freezeEnabled, leftOffsets, rightOffsets]);

  /** Check if column is at freeze boundary (for shadow) */
  const isFreezeBoundary = useCallback((columnId: string, side: 'left' | 'right'): boolean => {
    if (!showDividerShadow) return false;
    const pinnedCols = (config.columns as GridColumn[]).filter(c => c.pinned === side);
    if (pinnedCols.length === 0) return false;
    if (side === 'left') {
      return columnId === pinnedCols[pinnedCols.length - 1].id;
    }
    return columnId === pinnedCols[0].id;
  }, [config.columns, showDividerShadow]);

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

  const handleRowClick = useCallback((row: TEntity, rowId: string) => {
    // Set active row for highlighting
    if (highlightActiveRow) {
      state.setActiveRowId(prev => prev === rowId ? null : rowId);
    }
    // Fire custom callback
    config.callbacks?.onRowClick?.(row);
  }, [highlightActiveRow, state, config.callbacks]);

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
        locale={locale}
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
                {headerGroup.headers.map((header) => {
                  const freezeStyle = getFreezeStyle(header.id);
                  const isLeftBound = isFreezeBoundary(header.id, 'left');
                  const isRightBound = isFreezeBoundary(header.id, 'right');
                  const boundaryClass = isLeftBound
                    ? 'shadow-[2px_0_5px_-2px_rgba(0,0,0,0.15)]'
                    : isRightBound
                    ? 'shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.15)]'
                    : '';
                  const isHovered = highlightColumnHover && state.hoveredColumnId === header.id;

                  return (
                    <TableHead
                      key={header.id}
                      colSpan={header.colSpan}
                      className={`${getDensityClasses(state.density)} ${boundaryClass} ${
                        isHovered ? 'bg-primary/5' : ''
                      } transition-colors`}
                      style={{
                        width: header.getSize(),
                        position: freezeStyle.position as 'sticky' | undefined ?? 'relative',
                        left: freezeStyle.left as number | undefined,
                        right: freezeStyle.right as number | undefined,
                        zIndex: freezeStyle.zIndex as number | undefined ?? (config.behavior.stickyHeader ? 10 : undefined),
                        backgroundColor: freezeStyle.backgroundColor ?? undefined,
                      }}
                      onMouseEnter={highlightColumnHover ? () => state.setHoveredColumnId(header.id) : undefined}
                      onMouseLeave={highlightColumnHover ? () => state.setHoveredColumnId(null) : undefined}
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
                  );
                })}
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
                  <p className="text-destructive font-medium">{locale.states.errorTitle}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {error?.message || locale.states.errorRetry}
                  </p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
                    {locale.states.errorRetry}
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
                  <p className="text-muted-foreground">{locale.states.emptyState}</p>
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
                      rowIndex={virtualRow.index}
                      density={state.density}
                      onRowClick={handleRowClick}
                      activeRowId={state.activeRowId}
                      highlightActiveRow={highlightActiveRow}
                      highlightStriped={highlightStriped}
                      highlightColumnHover={highlightColumnHover}
                      hoveredColumnId={state.hoveredColumnId}
                      highlightRules={highlightRules}
                      getFreezeStyle={getFreezeStyle}
                      isFreezeBoundary={isFreezeBoundary}
                      locale={locale}
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
              rows.map((row, idx) => (
                <DataRow
                  key={row.id}
                  row={row}
                  rowIndex={idx}
                  density={state.density}
                  onRowClick={handleRowClick}
                  activeRowId={state.activeRowId}
                  highlightActiveRow={highlightActiveRow}
                  highlightStriped={highlightStriped}
                  highlightColumnHover={highlightColumnHover}
                  hoveredColumnId={state.hoveredColumnId}
                  highlightRules={highlightRules}
                  getFreezeStyle={getFreezeStyle}
                  isFreezeBoundary={isFreezeBoundary}
                  locale={locale}
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
              locale={locale}
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
          locale={locale}
        />
      )}

      {/* Edit Modal (only for modal mode) */}
      {config.features.editing.enabled && config.features.editing.mode === 'modal' && (
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
              ? locale.editing.newTitle(config.title || config.entity)
              : locale.editing.editTitle(config.title || config.entity)
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
          locale={locale}
        />
      )}
    </div>
  );
}

// ==========================================
// DATA ROW COMPONENT (with highlighting + freeze)
// ==========================================

interface DataRowProps<TEntity> {
  row: Row<TEntity>;
  rowIndex: number;
  density: 'compact' | 'normal' | 'comfortable';
  onRowClick?: (row: TEntity, rowId: string) => void;
  activeRowId: string | null;
  highlightActiveRow: boolean;
  highlightStriped: boolean;
  highlightColumnHover: boolean;
  hoveredColumnId: string | null;
  highlightRules: Array<{ condition: (row: TEntity) => boolean; className: string }>;
  getFreezeStyle: (columnId: string) => React.CSSProperties;
  isFreezeBoundary: (columnId: string, side: 'left' | 'right') => boolean;
  locale: GridLocale;
}

function DataRow<TEntity>({
  row,
  rowIndex,
  density,
  onRowClick,
  activeRowId,
  highlightActiveRow,
  highlightStriped,
  highlightColumnHover,
  hoveredColumnId,
  highlightRules,
  getFreezeStyle,
  isFreezeBoundary,
}: DataRowProps<TEntity>) {
  const rowId = String((row.original as Record<string, unknown>).id ?? row.index);

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

  // Build row classes for highlighting
  const rowClasses: string[] = [];
  if (onRowClick) rowClasses.push('cursor-pointer');

  // Active row highlight
  if (highlightActiveRow && activeRowId === rowId) {
    rowClasses.push('bg-primary/10 ring-1 ring-primary/20');
  }

  // Striped rows
  if (highlightStriped && rowIndex % 2 === 1) {
    rowClasses.push('bg-muted/20');
  }

  // Conditional highlight rules
  for (const rule of highlightRules) {
    try {
      if (rule.condition(row.original)) {
        rowClasses.push(rule.className);
      }
    } catch {
      // Ignore rule evaluation errors
    }
  }

  return (
    <TableRow
      data-state={row.getIsSelected() ? 'selected' : undefined}
      className={`transition-colors ${rowClasses.join(' ')}`}
      onClick={() => onRowClick?.(row.original, rowId)}
      data-ai-id={`supergrid-row-${row.index}`}
    >
      {row.getVisibleCells().map((cell) => {
        const freezeStyle = getFreezeStyle(cell.column.id);
        const isLeftBound = isFreezeBoundary(cell.column.id, 'left');
        const isRightBound = isFreezeBoundary(cell.column.id, 'right');
        const boundaryClass = isLeftBound
          ? 'shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]'
          : isRightBound
          ? 'shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)]'
          : '';
        const isColumnHovered = highlightColumnHover && hoveredColumnId === cell.column.id;

        return (
          <TableCell
            key={cell.id}
            className={`${getDensityClasses(density)} ${boundaryClass} ${
              isColumnHovered ? 'bg-primary/5' : ''
            } transition-colors`}
            style={{
              width: cell.column.getSize(),
              ...freezeStyle,
            }}
          >
            {cell.getIsGrouped() ? null : cell.getIsAggregated() ? (
              flexRender(cell.column.columnDef.aggregatedCell ?? cell.column.columnDef.cell, cell.getContext())
            ) : cell.getIsPlaceholder() ? null : (
              flexRender(cell.column.columnDef.cell, cell.getContext())
            )}
          </TableCell>
        );
      })}
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
  locale: GridLocale;
}

function RowActionsCell<TEntity>({
  row,
  config,
  permissions,
  onEdit,
  onDelete,
  locale,
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
            {locale.editing.editAction}
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
              {locale.editing.deleteAction}
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
