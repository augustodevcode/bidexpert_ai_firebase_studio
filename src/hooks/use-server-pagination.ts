/**
 * @fileoverview Hook de paginação server-side com estado na URL (searchParams).
 * Sincroniza page, pageSize, sort e search com a URL para que navegação
 * forward/back do browser funcione corretamente.
 */
'use client';

import { useCallback, useMemo } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '@/lib/admin-plus/constants';
import type { PaginationParams, SortParam } from '@/lib/admin-plus/types';

interface UseServerPaginationReturn {
  /** Current pagination + sorting state derived from URL. */
  params: PaginationParams;
  /** Navigate to a specific page (1-based). */
  setPage: (page: number) => void;
  /** Change the page size (resets to page 1). */
  setPageSize: (size: number) => void;
  /** Set sort field and direction (resets to page 1). */
  setSort: (sort: SortParam | null) => void;
  /** Set search query (resets to page 1). */
  setSearch: (search: string) => void;
  /** Build the query string for a given set of overrides (useful for Link hrefs). */
  buildQueryString: (overrides?: Partial<PaginationParams>) => string;
}

export function useServerPagination(): UseServerPaginationReturn {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const params = useMemo<PaginationParams>(() => {
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const rawSize = Number(searchParams.get('pageSize')) || DEFAULT_PAGE_SIZE;
    const pageSize = (PAGE_SIZE_OPTIONS as readonly number[]).includes(rawSize) ? rawSize : DEFAULT_PAGE_SIZE;
    const search = searchParams.get('q') ?? '';

    const sortField = searchParams.get('sortField') ?? undefined;
    const sortDir = searchParams.get('sortDir') as 'asc' | 'desc' | undefined;
    const sort: SortParam | undefined =
      sortField && sortDir ? { field: sortField, direction: sortDir } : undefined;

    return { page, pageSize, search, sort };
  }, [searchParams]);

  const buildQueryString = useCallback(
    (overrides?: Partial<PaginationParams>) => {
      const merged = { ...params, ...overrides };
      const sp = new URLSearchParams();

      if (merged.page && merged.page > 1) sp.set('page', String(merged.page));
      if (merged.pageSize && merged.pageSize !== DEFAULT_PAGE_SIZE)
        sp.set('pageSize', String(merged.pageSize));
      if (merged.search) sp.set('q', merged.search);
      if (merged.sort) {
        sp.set('sortField', merged.sort.field);
        sp.set('sortDir', merged.sort.direction);
      }

      const qs = sp.toString();
      return qs ? `?${qs}` : '';
    },
    [params],
  );

  const navigate = useCallback(
    (overrides: Partial<PaginationParams>) => {
      const qs = buildQueryString(overrides);
      router.push(`${pathname}${qs}`);
    },
    [router, pathname, buildQueryString],
  );

  const setPage = useCallback(
    (page: number) => navigate({ page }),
    [navigate],
  );

  const setPageSize = useCallback(
    (pageSize: number) => navigate({ pageSize, page: 1 }),
    [navigate],
  );

  const setSort = useCallback(
    (sort: SortParam | null) => navigate({ sort: sort ?? undefined, page: 1 }),
    [navigate],
  );

  const setSearch = useCallback(
    (search: string) => navigate({ search, page: 1 }),
    [navigate],
  );

  return { params, setPage, setPageSize, setSort, setSearch, buildQueryString };
}
