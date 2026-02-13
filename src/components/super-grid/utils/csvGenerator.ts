/**
 * @fileoverview Gerador de arquivos CSV usando PapaParse (MIT).
 * Suporta configurações de delimitador, encoding e headers.
 */

import Papa from 'papaparse';
import type { GridColumn } from '../SuperGrid.types';

interface CsvOptions {
  delimiter?: ',' | ';' | '\t';
  encoding?: 'utf-8' | 'utf-8-sig' | 'iso-8859-1';
  includeHeaders?: boolean;
}

/** Gera string CSV a partir de dados + configuração de colunas */
export function generateCsvString(
  data: Record<string, unknown>[],
  columns: GridColumn[],
  options: CsvOptions = {}
): string {
  const delimiter = options.delimiter ?? ';';
  const includeHeaders = options.includeHeaders !== false;

  const visibleColumns = columns.filter(col => col.visible !== false && !col.calculated);

  // Preparar dados em formato tabular
  const rows = data.map(row => {
    const csvRow: Record<string, string> = {};
    visibleColumns.forEach(col => {
      const value = getNestedValue(row, col.accessorKey);
      csvRow[col.header] = formatCsvValue(value, col);
    });
    return csvRow;
  });

  // Gerar CSV
  const csv = Papa.unparse(rows, {
    delimiter,
    header: includeHeaders,
    columns: visibleColumns.map(col => col.header),
  });

  // Adicionar BOM para UTF-8 com BOM
  if (options.encoding === 'utf-8-sig') {
    return '\uFEFF' + csv;
  }

  return csv;
}

function getNestedValue(obj: Record<string, unknown>, key: string): unknown {
  const parts = key.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

function formatCsvValue(value: unknown, column: GridColumn): string {
  if (value === null || value === undefined) return '';

  switch (column.type) {
    case 'currency': {
      const num = Number(value);
      const places = column.format?.decimalPlaces ?? 2;
      return isNaN(num) ? '' : num.toFixed(places);
    }

    case 'percentage': {
      const num = Number(value);
      const places = column.format?.decimalPlaces ?? 2;
      return isNaN(num) ? '' : `${num.toFixed(places)}%`;
    }

    case 'number': {
      const num = Number(value);
      return isNaN(num) ? '' : String(num);
    }

    case 'date':
      try {
        return new Date(String(value)).toLocaleDateString('pt-BR');
      } catch {
        return String(value);
      }

    case 'datetime':
      try {
        return new Date(String(value)).toLocaleString('pt-BR');
      } catch {
        return String(value);
      }

    case 'boolean':
      return value ? 'Sim' : 'Não';

    case 'relation':
      if (typeof value === 'object' && value !== null && column.relation) {
        return String((value as Record<string, unknown>)[column.relation.displayField] ?? '');
      }
      return String(value);

    default:
      return String(value);
  }
}
