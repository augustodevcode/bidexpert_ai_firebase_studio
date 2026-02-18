/**
 * @fileoverview Rodapé de agregação do SuperGrid.
 * Exibe SUM, AVG, COUNT, MIN, MAX para colunas com aggregationFn.
 */
'use client';

import type { Table as TanStackTable } from '@tanstack/react-table';
import { TableFooter, TableRow, TableCell } from '@/components/ui/table';
import type { GridColumn, GridDensity } from '../SuperGrid.types';
import type { GridLocale } from '../SuperGrid.i18n';
import { formatCellValue, getDensityClasses, getAlignClass } from '../utils/columnHelpers';

interface AggregateFooterProps {
  table: TanStackTable<Record<string, unknown>>;
  columns: GridColumn[];
  density: GridDensity;
  hasSelection: boolean;
  locale: GridLocale;
}

export function AggregateFooter({
  table,
  columns,
  density,
  hasSelection,
  locale,
}: AggregateFooterProps) {
  const aggregableColumns = columns.filter(
    col => col.aggregable && col.aggregationFn
  );

  if (aggregableColumns.length === 0) return null;

  const allRows = table.getFilteredRowModel().rows;

  return (
    <TableFooter data-ai-id="supergrid-aggregate-footer">
      <TableRow className="bg-muted/30 font-medium">
        {/* Checkbox column space */}
        {hasSelection && <TableCell className={getDensityClasses(density)} />}

        {columns.map(col => {
          const isVisible = table.getColumn(col.id)?.getIsVisible() !== false;
          if (!isVisible) return null;

          if (!col.aggregable || !col.aggregationFn) {
            return (
              <TableCell
                key={col.id}
                className={`${getDensityClasses(density)} ${getAlignClass(col)}`}
              >
                {col === columns[0] ? (
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">
                    {locale.aggregates.totals(allRows.length)}
                  </span>
                ) : null}
              </TableCell>
            );
          }

          const values = allRows
            .map(row => {
              const val = row.getValue(col.id);
              return val !== null && val !== undefined ? Number(val) : NaN;
            })
            .filter(v => !isNaN(v));

          let result: number | string = '—';
          if (values.length > 0) {
            switch (col.aggregationFn) {
              case 'sum':
                result = values.reduce((a, b) => a + b, 0);
                break;
              case 'avg':
                result = values.reduce((a, b) => a + b, 0) / values.length;
                break;
              case 'min':
                result = Math.min(...values);
                break;
              case 'max':
                result = Math.max(...values);
                break;
              case 'count':
                result = values.length;
                break;
              case 'distinctCount':
                result = new Set(values).size;
                break;
            }
          }

          const formatted =
            typeof result === 'number'
              ? formatCellValue(result, col)
              : result;

          const fnLabels: Record<string, string> = {
            sum: 'Σ',
            avg: 'x̄',
            min: 'Min',
            max: 'Max',
            count: '#',
            distinctCount: '#∪',
          };

          return (
            <TableCell
              key={col.id}
              className={`${getDensityClasses(density)} ${getAlignClass(col)} font-semibold`}
              data-ai-id={`supergrid-agg-${col.id}`}
            >
              <span className="text-xs text-muted-foreground mr-1">
                {fnLabels[col.aggregationFn!] || ''}
              </span>
              {formatted}
            </TableCell>
          );
        })}

        {/* Actions column space */}
        <TableCell className={getDensityClasses(density)} />
      </TableRow>
    </TableFooter>
  );
}
