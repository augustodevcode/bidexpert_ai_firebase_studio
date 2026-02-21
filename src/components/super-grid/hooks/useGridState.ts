/**
 * @fileoverview Hook de estado do SuperGrid.
 * Centraliza todo o estado do grid: paginação, ordenação, filtros,
 * agrupamento, seleção, visibilidade, densidade, query builder e edição.
 */
'use client';

import { useState } from 'react';
import type {
  PaginationState,
  SortingState,
  ColumnFiltersState,
  RowSelectionState,
  VisibilityState,
} from '@tanstack/react-table';
import type { SuperGridConfig, GridDensity } from '../SuperGrid.types';

export function useGridState<TEntity>(config: SuperGridConfig<TEntity>) {
  // Paginação
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: config.features.pagination.pageSize,
  });

  // Ordenação
  const [sorting, setSorting] = useState<SortingState>([]);

  // Filtros
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  // Agrupamento
  const [grouping, setGrouping] = useState<string[]>(
    config.features.grouping.defaultGroupedColumns || []
  );

  // Seleção
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  // Visibilidade de colunas (inicializar com colunas ocultas)
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => {
    const visibility: VisibilityState = {};
    config.columns.forEach(col => {
      if (col.visible === false) {
        visibility[col.id] = false;
      }
    });
    return visibility;
  });

  // Densidade
  const [density, setDensity] = useState<GridDensity>('normal');

  // Query Builder
  const [isQueryBuilderOpen, setIsQueryBuilderOpen] = useState(false);
  const [queryBuilderState, setQueryBuilderState] = useState<Record<string, unknown>>({
    combinator: 'and',
    rules: [],
  });

  // Edição de linha (modal / inline row)
  const [editingRow, setEditingRow] = useState<TEntity | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Edição de célula (inline cell mode)
  const [editingCellId, setEditingCellId] = useState<{ rowId: string; columnId: string } | null>(null);
  const [editingCellValue, setEditingCellValue] = useState<unknown>(undefined);

  // Coluna com hover destacado
  const [hoveredColumnId, setHoveredColumnId] = useState<string | null>(null);

  // Reset de paginação quando filtros mudam
  const handleGlobalFilterChange = (value: string) => {
    setGlobalFilter(value);
    setPagination(prev => ({ ...prev, pageIndex: 0 }));
  };

  const handleQueryBuilderChange = (query: Record<string, unknown>) => {
    setQueryBuilderState(query);
    setPagination(prev => ({ ...prev, pageIndex: 0 }));
  };

  function startCellEdit(rowId: string, columnId: string, value: unknown) {
    setEditingCellId({ rowId, columnId });
    setEditingCellValue(value);
  }

  function cancelCellEdit() {
    setEditingCellId(null);
    setEditingCellValue(undefined);
  }

  return {
    pagination,
    setPagination,
    sorting,
    setSorting,
    globalFilter,
    setGlobalFilter: handleGlobalFilterChange,
    columnFilters,
    setColumnFilters,
    grouping,
    setGrouping,
    rowSelection,
    setRowSelection,
    columnVisibility,
    setColumnVisibility,
    density,
    setDensity,
    isQueryBuilderOpen,
    setIsQueryBuilderOpen,
    queryBuilderState,
    setQueryBuilderState: handleQueryBuilderChange,
    editingRow,
    setEditingRow,
    isAddingNew,
    setIsAddingNew,
    editingCellId,
    editingCellValue,
    startCellEdit,
    cancelCellEdit,
    hoveredColumnId,
    setHoveredColumnId,
  };
}
