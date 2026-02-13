/**
 * @fileoverview Hook de dados do SuperGrid usando TanStack Query.
 * Gerencia fetching server-side com cache, staleTime, refetch automático,
 * e manutenção de dados anteriores durante carregamento (placeholderData).
 */
'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchGridData } from '@/app/actions/grid-actions';
import type { GridFetchParams, GridFetchResult, SuperGridConfig, GridColumn } from '../SuperGrid.types';
import { buildPrismaIncludes, getSearchableColumns } from '../utils/columnHelpers';
import type { PaginationState, SortingState } from '@tanstack/react-table';

interface UseGridDataParams<TEntity> {
  config: SuperGridConfig<TEntity>;
  pagination: PaginationState;
  sorting: SortingState;
  globalFilter: string;
  queryBuilderState: Record<string, unknown>;
  grouping: string[];
}

export function useGridData<TEntity>({
  config,
  pagination,
  sorting,
  globalFilter,
  queryBuilderState,
  grouping,
}: UseGridDataParams<TEntity>) {
  const includes = buildPrismaIncludes(config.columns as GridColumn[]);
  const searchableColumns = getSearchableColumns(config.columns as GridColumn[]);

  const fetchParams: GridFetchParams = {
    entity: config.entity,
    pagination,
    sorting: sorting.length > 0 ? sorting : undefined,
    filters: queryBuilderState,
    globalFilter: globalFilter || undefined,
    grouping: grouping.length > 0 ? grouping : undefined,
    searchableColumns,
    includes,
    bigIntFields: config.bigIntFields,
  };

  const query = useQuery<GridFetchResult>({
    queryKey: [
      'super-grid',
      config.id,
      pagination.pageIndex,
      pagination.pageSize,
      sorting,
      globalFilter,
      queryBuilderState,
      grouping,
    ],
    queryFn: () => fetchGridData(fetchParams),
    placeholderData: (previousData) => previousData,
    staleTime: config.behavior.autoRefresh || 30_000,
    refetchInterval: config.behavior.autoRefresh || false,
  });

  return {
    data: (query.data?.data ?? []) as TEntity[],
    totalCount: query.data?.totalCount ?? 0,
    pageCount: query.data?.pageCount ?? 0,
    aggregates: query.data?.aggregates,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
