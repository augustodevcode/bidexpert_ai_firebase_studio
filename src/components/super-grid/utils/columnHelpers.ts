/**
 * @fileoverview Helpers de coluna para converter GridColumn[] → TanStack ColumnDef[].
 * Inclui funções de formatação por FieldType e mapeamento de filtros/agregações.
 */

import type { ColumnDef } from '@tanstack/react-table';
import type { GridColumn, FieldType, GridDensity } from '../SuperGrid.types';

/** Formata valor para exibição na célula baseado no tipo */
export function formatCellValue(value: unknown, column: GridColumn): string {
  if (value === null || value === undefined) return '—';

  switch (column.type) {
    case 'currency': {
      const num = Number(value);
      if (isNaN(num)) return '—';
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: column.format?.currencyCode || 'BRL',
        minimumFractionDigits: column.format?.decimalPlaces ?? 2,
        maximumFractionDigits: column.format?.decimalPlaces ?? 2,
      }).format(num);
    }

    case 'percentage': {
      const num = Number(value);
      if (isNaN(num)) return '—';
      const places = column.format?.decimalPlaces ?? 2;
      return `${num.toFixed(places)}%`;
    }

    case 'number': {
      const num = Number(value);
      if (isNaN(num)) return '—';
      if (column.format?.thousandsSeparator !== false) {
        return new Intl.NumberFormat('pt-BR', {
          minimumFractionDigits: column.format?.decimalPlaces ?? 0,
          maximumFractionDigits: column.format?.decimalPlaces ?? 0,
        }).format(num);
      }
      return String(num);
    }

    case 'date':
      try {
        const date = new Date(String(value));
        if (isNaN(date.getTime())) return '—';
        return date.toLocaleDateString('pt-BR');
      } catch {
        return '—';
      }

    case 'datetime':
      try {
        const dt = new Date(String(value));
        if (isNaN(dt.getTime())) return '—';
        return dt.toLocaleString('pt-BR');
      } catch {
        return '—';
      }

    case 'boolean':
      return value ? 'Sim' : 'Não';

    case 'email':
    case 'url':
    case 'string':
      return String(value);

    default:
      return String(value);
  }
}

/** Obtém valor aninhado de um objeto via notação de ponto */
export function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

/** Retorna classes CSS de alinhamento por tipo de campo */
export function getAlignClass(column: GridColumn): string {
  if (column.align) {
    return column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : 'text-left';
  }
  switch (column.type) {
    case 'currency':
    case 'number':
    case 'percentage':
      return 'text-right';
    case 'boolean':
      return 'text-center';
    default:
      return 'text-left';
  }
}

/** Retorna classes CSS de padding baseado na densidade */
export function getDensityClasses(density: GridDensity): string {
  switch (density) {
    case 'compact':
      return 'py-1 px-2 text-xs';
    case 'comfortable':
      return 'py-3 px-4 text-sm';
    case 'normal':
    default:
      return 'py-2 px-3 text-sm';
  }
}

/** Map de função de agregação para TanStack */
export function getAggregationFn(columnType: FieldType): string {
  switch (columnType) {
    case 'number':
    case 'currency':
    case 'percentage':
      return 'sum';
    default:
      return 'count';
  }
}

/** Constrói includes automáticos a partir das colunas com relação */
export function buildPrismaIncludes(columns: GridColumn[]): Record<string, boolean | Record<string, unknown>> {
  const includes: Record<string, boolean | Record<string, unknown>> = {};

  columns.forEach(col => {
    if (col.relation?.relationName) {
      includes[col.relation.relationName] = true;
    }
    // Suporte a accessorKey com ponto (ex: 'Auctioneer.name' → include Auctioneer)
    if (col.accessorKey.includes('.')) {
      const topLevel = col.accessorKey.split('.')[0];
      if (!includes[topLevel]) {
        includes[topLevel] = true;
      }
    }
  });

  return includes;
}

/** Extrai nomes de colunas filtráveis do tipo string para busca global */
export function getSearchableColumns(columns: GridColumn[]): string[] {
  return columns
    .filter(col =>
      col.filterable !== false &&
      (col.type === 'string' || col.type === 'email' || col.type === 'url')
    )
    .map(col => col.accessorKey);
}
