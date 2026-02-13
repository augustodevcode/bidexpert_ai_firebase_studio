/**
 * @fileoverview Tipagens completas do componente SuperGrid.
 * Define todas as interfaces de configuração, tipos de campo, formatação,
 * agrupamento, edição, exportação, query builder, permissões e callbacks.
 * Zero dependência de bibliotecas comerciais — usa apenas TanStack Table (MIT).
 */

import { z } from 'zod';
import type { ReactNode, ComponentType } from 'react';

// ==========================================
// 1. TIPOS BÁSICOS DE CAMPO
// ==========================================

export type FieldType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'currency'
  | 'percentage'
  | 'email'
  | 'url'
  | 'select'
  | 'multiselect'
  | 'relation'
  | 'json';

export type GridDensity = 'compact' | 'normal' | 'comfortable';

export type AggregationFn = 'sum' | 'avg' | 'min' | 'max' | 'count' | 'distinctCount';

// ==========================================
// 2. FORMATAÇÃO DE CAMPO
// ==========================================

export interface FieldFormatConfig {
  dateFormat?: string;
  currencyCode?: string;
  decimalPlaces?: number;
  thousandsSeparator?: boolean;
  prefix?: string;
  suffix?: string;
}

// ==========================================
// 3. CONFIGURAÇÃO DE COLUNA
// ==========================================

export interface GridColumn<TEntity = Record<string, unknown>> {
  /** Identificador único da coluna */
  id: string;
  /** Chave de acesso no objeto da entidade (suporta notação ponto p/ relações) */
  accessorKey: string;
  /** Label exibido no cabeçalho */
  header: string;
  /** Tooltip explicativo */
  description?: string;

  // Tipo e formatação
  type: FieldType;
  format?: FieldFormatConfig;

  // Visual
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  align?: 'left' | 'center' | 'right';
  visible?: boolean;
  pinned?: 'left' | 'right' | false;

  // Funcionalidades
  sortable?: boolean;
  filterable?: boolean;
  groupable?: boolean;
  aggregable?: boolean;
  aggregationFn?: AggregationFn;
  editable?: boolean | ((row: TEntity) => boolean);

  // Validação Zod
  validation?: z.ZodType<unknown>;

  // Relacionamentos
  relation?: {
    /** Nome da relação no Prisma (e.g., 'Auctioneer') */
    relationName: string;
    /** Campo a exibir (ex: 'name') */
    displayField: string;
    /** Campo do ID (ex: 'id') */
    valueField: string;
    /** Loader de opções para selects */
    loadOptions?: () => Promise<Array<{ value: string; label: string }>>;
  };

  // Célula customizada
  Cell?: ComponentType<{ row: TEntity; value: unknown }>;

  // Campo calculado
  calculated?: {
    dependsOn: string[];
    formula: (row: TEntity) => unknown;
  };

  // Opções para tipo select/multiselect
  selectOptions?: Array<{ value: string; label: string; color?: string }>;
}

// ==========================================
// 4. CONFIGURAÇÃO DE AGRUPAMENTO
// ==========================================

export interface GroupingConfig {
  enabled: boolean;
  defaultGroupedColumns?: string[];
  showAggregates?: boolean;
  aggregateFunctions?: AggregationFn[];
}

// ==========================================
// 5. CONFIGURAÇÃO DE EDIÇÃO
// ==========================================

export interface EditingConfig<TEntity = Record<string, unknown>> {
  enabled: boolean;
  mode: 'inline' | 'modal' | 'cell';
  allowAdd: boolean;
  allowDelete: boolean;
  allowBulkDelete: boolean;
  confirmDelete: boolean;
  validationSchema?: z.ZodSchema<unknown>;
  onBeforeSave?: (data: Partial<TEntity>, original?: TEntity) => Promise<boolean>;
  onAfterSave?: (data: TEntity) => Promise<void>;
}

// ==========================================
// 6. CONFIGURAÇÃO DE EXPORTAÇÃO
// ==========================================

export interface ExportConfig {
  formats: Array<'csv' | 'excel'>;
  excel?: {
    includeStyles: boolean;
    sheetName?: string;
  };
  csv?: {
    delimiter: ',' | ';' | '\t';
    encoding: 'utf-8' | 'utf-8-sig' | 'iso-8859-1';
    includeHeaders: boolean;
  };
  maxRows?: number;
}

// ==========================================
// 7. CONFIGURAÇÃO DO QUERY BUILDER
// ==========================================

export interface QueryBuilderFieldConfig {
  name: string;
  label: string;
  type: FieldType;
  operators?: string[];
  valueEditorType?: 'text' | 'select' | 'multiselect' | 'date' | 'number';
  values?: Array<{ name: string; label: string }>;
}

export interface QueryBuilderConfig {
  enabled: boolean;
  fields: QueryBuilderFieldConfig[];
  allowNestedGroups: boolean;
  maxDepth?: number;
}

// ==========================================
// 8. AÇÃO DE LINHA
// ==========================================

export interface RowAction<TEntity = Record<string, unknown>> {
  id: string;
  label: string;
  icon?: string;
  variant?: 'default' | 'destructive' | 'outline';
  onClick: (row: TEntity) => void;
  visible?: (row: TEntity) => boolean;
}

// ==========================================
// 9. CONFIGURAÇÃO PRINCIPAL DO GRID
// ==========================================

export interface SuperGridConfig<TEntity = Record<string, unknown>> {
  /** ID único do grid (usado como queryKey no TanStack Query) */
  id: string;
  /** Título exibido no header */
  title?: string;
  /** Nome do modelo Prisma (ex: 'Auction', 'Lot') */
  entity: string;
  /** Campos BigInt que precisam de serialização */
  bigIntFields?: string[];

  // Colunas
  columns: GridColumn<TEntity>[];

  // Funcionalidades
  features: {
    pagination: {
      enabled: boolean;
      pageSize: number;
      pageSizeOptions: number[];
    };
    sorting: {
      enabled: boolean;
      multiSort: boolean;
    };
    filtering: {
      quickFilter: boolean;
      columnFilters: boolean;
      queryBuilder: QueryBuilderConfig;
    };
    grouping: GroupingConfig;
    editing: EditingConfig<TEntity>;
    export: ExportConfig;
    selection: {
      enabled: boolean;
      mode: 'single' | 'multiple' | 'none';
      selectAllMode: 'page' | 'all';
    };
    detailPanel?: {
      enabled: boolean;
      component: ComponentType<{ row: TEntity }>;
    };
    rowActions?: RowAction<TEntity>[];
  };

  // Comportamento
  behavior: {
    virtualizeRows: boolean;
    virtualizeColumns: boolean;
    stickyHeader: boolean;
    resizableColumns: boolean;
    reorderableColumns: boolean;
    autoRefresh?: number;
  };

  // Permissões RBAC
  permissions?: {
    view?: boolean | string[];
    create?: boolean | string[];
    edit?: boolean | string[];
    delete?: boolean | string[];
    export?: boolean | string[];
  };

  // Callbacks
  callbacks?: {
    onRowClick?: (row: TEntity) => void;
    onSelectionChange?: (rows: TEntity[]) => void;
    onError?: (error: Error) => void;
  };
}

// ==========================================
// 10. PARÂMETROS DE FETCH (Server Action)
// ==========================================

export interface GridFetchParams {
  entity: string;
  pagination: {
    pageIndex: number;
    pageSize: number;
  };
  sorting?: Array<{
    id: string;
    desc: boolean;
  }>;
  /** react-querybuilder RuleGroupType */
  filters?: Record<string, unknown>;
  globalFilter?: string;
  grouping?: string[];
  /** Colunas searcháveis para global filter */
  searchableColumns?: string[];
  /** Includes do Prisma (relações a carregar) */
  includes?: Record<string, boolean | Record<string, unknown>>;
  /** Campos BigInt para serialização */
  bigIntFields?: string[];
}

// ==========================================
// 11. RESULTADO DE FETCH
// ==========================================

export interface GridFetchResult<T = Record<string, unknown>> {
  data: T[];
  totalCount: number;
  pageCount: number;
  aggregates?: Record<string, number | string>;
}

// ==========================================
// 12. ZOD SCHEMAS DE VALIDAÇÃO
// ==========================================

export const FetchParamsSchema = z.object({
  entity: z.string().min(1),
  pagination: z.object({
    pageIndex: z.number().min(0),
    pageSize: z.number().min(1).max(1000),
  }),
  sorting: z.array(z.object({
    id: z.string(),
    desc: z.boolean(),
  })).optional(),
  filters: z.record(z.unknown()).optional(),
  globalFilter: z.string().optional(),
  grouping: z.array(z.string()).optional(),
  searchableColumns: z.array(z.string()).optional(),
  includes: z.record(z.unknown()).optional(),
  bigIntFields: z.array(z.string()).optional(),
});
