/**
 * @fileoverview Tipos compartilhados para o módulo Admin Plus.
 * Define interfaces de paginação, resultado de ações, filtros e ordenação
 * utilizados por todos os CRUDs do Admin Plus.
 */

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

export type SortDirection = 'asc' | 'desc';

export interface SortParam {
  field: string;
  direction: SortDirection;
}

/**
 * Broader input type accepted by useDataTable's defaultSort.
 * Covers three common conventions used across admin-plus pages:
 *  - { field, direction } — canonical SortParam
 *  - { field, order }     — alias used by some pages
 *  - { id, desc }         — TanStack Table ColumnSort convention
 */
export type SortInput =
  | { field: string; direction: SortDirection }
  | { field: string; order: SortDirection }
  | { id: string; desc: boolean };

export interface FilterParam {
  field: string;
  operator: 'eq' | 'contains' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'not';
  value: string | number | boolean | string[];
}

export interface PaginationParams {
  page: number;
  pageSize: number;
  sort?: SortParam;
  filters?: FilterParam[];
  search?: string;
}

export interface FacetedFilterOption {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
  count?: number;
}

export interface FacetedFilterConfig {
  columnId: string;
  title: string;
  options: FacetedFilterOption[];
}

export interface BulkAction<T = unknown> {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  variant?: 'default' | 'destructive';
  onExecute: (selectedRows: T[]) => Promise<void> | void;
}

export interface EntityConfig {
  slug: string;
  label: string;
  labelPlural: string;
  icon: string;
  group: EntityGroup;
  hasTenantId: boolean;
  paginationMode: 'client' | 'server';
  permissions: {
    read: string;
    create: string;
    update: string;
    delete: string;
  };
}

export type EntityGroup =
  | 'auctions_and_lots'
  | 'judicial'
  | 'participants_and_registries'
  | 'bids_and_financial'
  | 'post_sale'
  | 'communication_and_support'
  | 'reports_and_audit'
  | 'auxiliary_tables'
  | 'configurations';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}
