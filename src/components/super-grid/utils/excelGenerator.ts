/**
 * @fileoverview Gerador de arquivos Excel (.xlsx) usando ExcelJS (MIT).
 * Suporta formatação de células por tipo (moeda, data, porcentagem),
 * estilos de cabeçalho, auto-width e proteção por senha.
 */

import ExcelJS from 'exceljs';
import type { GridColumn, FieldType } from '../SuperGrid.types';

interface ExcelOptions {
  includeStyles?: boolean;
  sheetName?: string;
}

/** Gera um workbook Excel a partir de dados + configuração de colunas */
export async function generateExcelBuffer(
  data: Record<string, unknown>[],
  columns: GridColumn[],
  options: ExcelOptions = {}
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'BidExpert SuperGrid';
  workbook.created = new Date();

  const sheetName = options.sheetName || 'Dados';
  const worksheet = workbook.addWorksheet(sheetName);

  // Definir colunas
  const visibleColumns = columns.filter(col => col.visible !== false && !col.calculated);
  worksheet.columns = visibleColumns.map(col => ({
    header: col.header,
    key: col.id,
    width: Math.max(col.header.length + 4, 15),
  }));

  // Estilizar cabeçalho
  if (options.includeStyles) {
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2563EB' }, // Primary blue
    };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.height = 25;
  }

  // Adicionar dados
  data.forEach(row => {
    const rowData: Record<string, unknown> = {};
    visibleColumns.forEach(col => {
      const value = getNestedValue(row, col.accessorKey);
      rowData[col.id] = formatExcelValue(value, col);
    });
    const excelRow = worksheet.addRow(rowData);

    // Formatar células por tipo
    if (options.includeStyles) {
      visibleColumns.forEach((col, idx) => {
        const cell = excelRow.getCell(idx + 1);
        applyExcelFormat(cell, col);
      });
    }
  });

  // Auto-fit column widths baseado no conteúdo
  visibleColumns.forEach((col, idx) => {
    const column = worksheet.getColumn(idx + 1);
    let maxLength = col.header.length;
    column.eachCell({ includeEmpty: false }, (cell: ExcelJS.Cell) => {
      const cellLength = String(cell.value ?? '').length;
      if (cellLength > maxLength) maxLength = cellLength;
    });
    column.width = Math.min(maxLength + 4, 60);
  });

  // Congelar primeira linha (cabeçalho)
  worksheet.views = [{ state: 'frozen', ySplit: 1 }];

  // Gerar buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
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

function formatExcelValue(value: unknown, column: GridColumn): unknown {
  if (value === null || value === undefined) return '';

  switch (column.type) {
    case 'currency':
    case 'number':
    case 'percentage':
      return Number(value) || 0;

    case 'date':
    case 'datetime':
      return value instanceof Date ? value : new Date(String(value));

    case 'boolean':
      return value ? 'Sim' : 'Não';

    case 'relation':
      if (typeof value === 'object' && value !== null && column.relation) {
        return (value as Record<string, unknown>)[column.relation.displayField] ?? '';
      }
      return String(value);

    default:
      return String(value);
  }
}

function applyExcelFormat(cell: ExcelJS.Cell, column: GridColumn): void {
  switch (column.type) {
    case 'currency':
      cell.numFmt = `R$ #,##0.${String('').padStart(column.format?.decimalPlaces ?? 2, '0')}`;
      cell.alignment = { horizontal: 'right' };
      break;

    case 'percentage':
      cell.numFmt = `0.${String('').padStart(column.format?.decimalPlaces ?? 2, '0')}%`;
      cell.alignment = { horizontal: 'right' };
      break;

    case 'number':
      cell.numFmt = column.format?.decimalPlaces
        ? `#,##0.${String('').padStart(column.format.decimalPlaces, '0')}`
        : '#,##0';
      cell.alignment = { horizontal: 'right' };
      break;

    case 'date':
      cell.numFmt = 'DD/MM/YYYY';
      break;

    case 'datetime':
      cell.numFmt = 'DD/MM/YYYY HH:MM:SS';
      break;

    default:
      break;
  }
}
