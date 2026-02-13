/**
 * @fileoverview Configuração padrão do SuperGrid.
 * Fornece valores default sensatos para todas as opções opcionais da config,
 * permitindo que o desenvolvedor configure apenas o necessário.
 */

import type { SuperGridConfig } from './SuperGrid.types';

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export const DEFAULT_GRID_CONFIG: DeepPartial<SuperGridConfig> = {
  features: {
    pagination: {
      enabled: true,
      pageSize: 25,
      pageSizeOptions: [10, 25, 50, 100, 500],
    },
    sorting: {
      enabled: true,
      multiSort: true,
    },
    filtering: {
      quickFilter: true,
      columnFilters: true,
      queryBuilder: {
        enabled: false,
        fields: [],
        allowNestedGroups: true,
        maxDepth: 3,
      },
    },
    grouping: {
      enabled: false,
      showAggregates: true,
      aggregateFunctions: ['sum', 'avg', 'count'],
    },
    editing: {
      enabled: false,
      mode: 'modal',
      allowAdd: false,
      allowDelete: false,
      allowBulkDelete: false,
      confirmDelete: true,
    },
    export: {
      formats: ['csv', 'excel'],
      excel: {
        includeStyles: true,
        sheetName: 'Dados',
      },
      csv: {
        delimiter: ';',
        encoding: 'utf-8-sig',
        includeHeaders: true,
      },
      maxRows: 50000,
    },
    selection: {
      enabled: false,
      mode: 'none',
      selectAllMode: 'page',
    },
  },
  behavior: {
    virtualizeRows: false,
    virtualizeColumns: false,
    stickyHeader: true,
    resizableColumns: true,
    reorderableColumns: false,
    autoRefresh: 0,
  },
};

/** Mescla config parcial do usuário com defaults */
export function mergeWithDefaults<TEntity>(
  userConfig: SuperGridConfig<TEntity>
): SuperGridConfig<TEntity> {
  return deepMerge(
    DEFAULT_GRID_CONFIG as unknown as Record<string, unknown>,
    userConfig as unknown as Record<string, unknown>
  ) as unknown as SuperGridConfig<TEntity>;
}

function deepMerge(defaults: Record<string, unknown>, overrides: Record<string, unknown>): Record<string, unknown> {
  const result = { ...defaults };
  for (const key of Object.keys(overrides)) {
    const val = overrides[key];
    if (
      val !== undefined &&
      val !== null &&
      typeof val === 'object' &&
      !Array.isArray(val) &&
      typeof defaults[key] === 'object' &&
      defaults[key] !== null &&
      !Array.isArray(defaults[key])
    ) {
      result[key] = deepMerge(
        defaults[key] as Record<string, unknown>,
        val as Record<string, unknown>
      );
    } else if (val !== undefined) {
      result[key] = val;
    }
  }
  return result;
}
