/**
 * @fileoverview Hook de data-fetching reativo para DataTablePlus — Admin Plus.
 * Observa URL params (via useSearchParams) e re-busca dados automaticamente
 * quando page, pageSize, sort ou search mudam.
 *
 * Suporta duas assinaturas:
 *  - fetchFn: server action direta (retorna ActionResult<PaginatedResponse>)
 *  - fetchData: função já desembrulhada (retorna PaginatedResponse diretamente)
 */
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '@/lib/admin-plus/constants';
import type { PaginatedResponse, ActionResult, SortInput } from '@/lib/admin-plus/types';

/* ─── Tipos de input para fetch ─── */
interface FetchParams {
  page: number;
  pageSize: number;
  search?: string;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
}

/* ─── Opções do hook ─── */
interface UseDataTableOptions<T> {
  /** Chave de query (apenas informativa / futura cache key). */
  queryKey?: string;
  /**
   * Server action direta que retorna ActionResult<PaginatedResponse<T>>.
   * O hook faz o unwrap automaticamente.
   */
  fetchFn?: (input: FetchParams) => Promise<ActionResult<PaginatedResponse<T>>>;
  /**
   * Função de fetch já desembrulhada — deve retornar PaginatedResponse diretamente.
   * Se ambas fetchFn e fetchData forem fornecidas, fetchData tem precedência.
   */
  fetchData?: (params: FetchParams) => Promise<PaginatedResponse<T>>;
  /** Sort padrão quando URL não especifica. */
  defaultSort?: SortInput;
  legacyRowIdKey?: keyof T;
}

/* ─── Retorno do hook ─── */
interface UseDataTableReturn<T> {
  /** PaginatedResponse completa (ou null se ainda carregando / erro). */
  data: PaginatedResponse<T> | null;
  /** Indicador de loading. */
  isLoading: boolean;
  /** Força re-fetch mantendo params atuais. */
  refresh: () => void;
  /* Aliases de conveniência (extraídos do PaginatedResponse): */
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  pagination: { pageIndex: number; pageSize: number };
  sorting: { id: string; desc: boolean }[];
  search: string;
  onPaginationChange: () => void;
  onSortingChange: () => void;
  onSearchChange: () => void;
  formOpen: boolean;
  setFormOpen: (open: boolean) => void;
  editingRow: T | null;
  deletingRow: T | null;
  setDeletingRow: (row: T | null) => void;
  handleAdd: () => void;
  handleEdit: (row: T) => void;
  handleDelete: (row: T) => void;
  handleConfirmDelete: () => void;
}

export function useDataTable<T>(options: UseDataTableOptions<T>): UseDataTableReturn<T> {
  const searchParams = useSearchParams();
  const [data, setData] = useState<PaginatedResponse<T> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<T | null>(null);
  const [deletingRow, setDeletingRow] = useState<T | null>(null);
  const abortRef = useRef(0);

  /* Derivar params da URL */
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const rawSize = Number(searchParams.get('pageSize')) || DEFAULT_PAGE_SIZE;
  const pageSize = (PAGE_SIZE_OPTIONS as readonly number[]).includes(rawSize)
    ? rawSize
    : DEFAULT_PAGE_SIZE;
  const search = searchParams.get('q') ?? '';
  /* Normalize defaultSort from any accepted shape */
  const ds = options.defaultSort;
  const normalizedField = ds
    ? ('field' in ds ? ds.field : 'id' in ds ? ds.id : undefined)
    : undefined;
  const normalizedDir: 'asc' | 'desc' = ds
    ? ('direction' in ds
        ? ds.direction
        : 'order' in ds
          ? ds.order
          : 'desc' in ds
            ? (ds.desc ? 'desc' : 'asc')
            : 'asc')
    : 'asc';

  const sortField =
    searchParams.get('sortField') ?? normalizedField ?? undefined;
  const sortDir =
    (searchParams.get('sortDir') as 'asc' | 'desc' | null) ??
    normalizedDir;

  useEffect(() => {
    const id = ++abortRef.current;
    setIsLoading(true);

    const run = async () => {
      try {
        const fetchParams: FetchParams = {
          page,
          pageSize,
          search: search || undefined,
          sortField,
          sortOrder: sortDir,
        };

        let result: PaginatedResponse<T>;

        if (options.fetchData) {
          result = await options.fetchData(fetchParams);
        } else if (options.fetchFn) {
          const res = await options.fetchFn(fetchParams);
          if (res?.success && res.data) {
            result = res.data;
          } else {
            throw new Error(res?.error ?? 'Erro ao carregar dados');
          }
        } else {
          throw new Error('useDataTable: fetchFn or fetchData required');
        }

        if (abortRef.current === id) {
          setData(result);
        }
      } catch (err) {
        console.error('[useDataTable] fetch error:', err);
        if (abortRef.current === id) {
          setData(null);
        }
      } finally {
        if (abortRef.current === id) {
          setIsLoading(false);
        }
      }
    };

    run();
  }, [page, pageSize, search, sortField, sortDir, tick]); // eslint-disable-line react-hooks/exhaustive-deps

  const refresh = useCallback(() => setTick((t) => t + 1), []);
  const handleAdd = useCallback(() => {
    setEditingRow(null);
    setFormOpen(true);
  }, []);
  const handleEdit = useCallback((row: T) => {
    setEditingRow(row);
    setFormOpen(true);
  }, []);
  const handleDelete = useCallback((row: T) => {
    setDeletingRow(row);
  }, []);
  const handleConfirmDelete = useCallback(() => {
    setDeletingRow(null);
  }, []);

  return {
    data,
    isLoading,
    refresh,
    total: data?.total ?? 0,
    page: data?.page ?? page,
    pageSize: data?.pageSize ?? pageSize,
    pageCount: data?.totalPages ?? 0,
    pagination: { pageIndex: Math.max(0, (data?.page ?? page) - 1), pageSize: data?.pageSize ?? pageSize },
    sorting: sortField ? [{ id: sortField, desc: sortDir === 'desc' }] : [],
    search,
    onPaginationChange: () => {},
    onSortingChange: () => {},
    onSearchChange: () => {},
    formOpen,
    setFormOpen,
    editingRow,
    deletingRow,
    setDeletingRow,
    handleAdd,
    handleEdit,
    handleDelete,
    handleConfirmDelete,
  };
}
