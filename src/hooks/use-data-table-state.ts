/**
 * @fileoverview Hook de estado da DataTable: selection, column visibility,
 * column sizing e filtros facetados. Mantém estado local (React state).
 * Paginação e sort são geridos por useServerPagination (URL-based).
 */
'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  type ColumnFiltersState,
  type VisibilityState,
  type RowSelectionState,
  type SortingState,
} from '@tanstack/react-table';
import type { FilterParam } from '@/lib/admin-plus/types';

interface UseDataTableStateReturn {
  /** TanStack column filters (faceted). */
  columnFilters: ColumnFiltersState;
  setColumnFilters: React.Dispatch<React.SetStateAction<ColumnFiltersState>>;
  /** Row selection map ({ [rowId]: true }). */
  rowSelection: RowSelectionState;
  setRowSelection: React.Dispatch<React.SetStateAction<RowSelectionState>>;
  /** Column visibility overrides. */
  columnVisibility: VisibilityState;
  setColumnVisibility: React.Dispatch<React.SetStateAction<VisibilityState>>;
  /** Local sorting state for TanStack Table (synced outward by the table). */
  sorting: SortingState;
  setSorting: React.Dispatch<React.SetStateAction<SortingState>>;
  /** Convert current columnFilters to FilterParam[] for server queries. */
  toFilterParams: () => FilterParam[];
  /** Number of selected rows. */
  selectedCount: number;
  /** Reset all local table state. */
  resetState: () => void;
}

export function useDataTableState(
  initialVisibility?: VisibilityState,
): UseDataTableStateReturn {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    initialVisibility ?? {},
  );
  const [sorting, setSorting] = useState<SortingState>([]);

  const toFilterParams = useCallback((): FilterParam[] => {
    return columnFilters.map((f) => ({
      field: f.id,
      operator: 'eq' as const,
      value: f.value as string | string[],
    }));
  }, [columnFilters]);

  const selectedCount = useMemo(
    () => Object.values(rowSelection).filter(Boolean).length,
    [rowSelection],
  );

  const resetState = useCallback(() => {
    setColumnFilters([]);
    setRowSelection({});
    setSorting([]);
  }, []);

  return {
    columnFilters,
    setColumnFilters,
    rowSelection,
    setRowSelection,
    columnVisibility,
    setColumnVisibility,
    sorting,
    setSorting,
    toFilterParams,
    selectedCount,
    resetState,
  };
}
