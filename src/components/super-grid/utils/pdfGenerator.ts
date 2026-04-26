/**
 * @fileoverview Gerador PDF mínimo para exportações tabulares do SuperGrid.
 * Cria um PDF válido sem dependências adicionais, adequado para auditoria e download.
 */

import type { GridColumn } from '../SuperGrid.types';

interface PdfOptions {
  title?: string;
  orientation?: 'landscape' | 'portrait';
}

const PAGE_SIZES = {
  landscape: { width: 842, height: 595 },
  portrait: { width: 595, height: 842 },
};

const PAGE_MARGIN = 36;
const TITLE_FONT_SIZE = 12;
const BODY_FONT_SIZE = 8;
const LINE_HEIGHT = 12;

export function generatePdfBuffer(
  data: Record<string, unknown>[],
  columns: GridColumn[],
  options: PdfOptions = {}
): Buffer {
  const orientation = options.orientation ?? 'landscape';
  const pageSize = PAGE_SIZES[orientation];
  const maxLineChars = orientation === 'landscape' ? 148 : 96;
  const rowsPerPage = Math.floor((pageSize.height - PAGE_MARGIN * 2 - 42) / LINE_HEIGHT);
  const visibleColumns = columns.filter(column => column.visible !== false && !column.calculated);

  const lines = buildPdfLines(data, visibleColumns, options.title ?? 'Exportação SuperGrid', maxLineChars);
  const chunks = chunkLines(lines, rowsPerPage);
  const pdfObjects = buildPdfObjects(chunks, pageSize);

  return writePdfDocument(pdfObjects);
}

function buildPdfLines(
  data: Record<string, unknown>[],
  columns: GridColumn[],
  title: string,
  maxLineChars: number
): string[] {
  const lines = [
    title,
    `Gerado em ${new Date().toLocaleString('pt-BR')}`,
    `Registros: ${data.length}`,
    '',
  ];

  const headers = columns.map(column => column.header).join(' | ');
  lines.push(...wrapLine(headers, maxLineChars));
  lines.push('-'.repeat(Math.min(headers.length, maxLineChars)));

  for (const row of data) {
    const rowText = columns
      .map(column => formatPdfValue(getNestedValue(row, column.accessorKey), column))
      .join(' | ');
    lines.push(...wrapLine(rowText, maxLineChars));
  }

  return lines;
}

function chunkLines(lines: string[], rowsPerPage: number): string[][] {
  const chunks: string[][] = [];
  for (let index = 0; index < lines.length; index += rowsPerPage) {
    chunks.push(lines.slice(index, index + rowsPerPage));
  }
  return chunks.length > 0 ? chunks : [[]];
}

function buildPdfObjects(
  pageLines: string[][],
  pageSize: { width: number; height: number }
): string[] {
  const objects: string[] = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  const pageObjectIds: number[] = [];

  for (const lines of pageLines) {
    const pageObjectId = objects.length + 1;
    const contentObjectId = pageObjectId + 1;
    pageObjectIds.push(pageObjectId);

    const content = buildPageContent(lines, pageSize.height);
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageSize.width} ${pageSize.height}] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentObjectId} 0 R >>`,
      `<< /Length ${Buffer.byteLength(content, 'utf8')} >>\nstream\n${content}\nendstream`
    );
  }

  objects[1] = `<< /Type /Pages /Kids [${pageObjectIds.map(id => `${id} 0 R`).join(' ')}] /Count ${pageObjectIds.length} >>`;
  return objects;
}

function buildPageContent(lines: string[], pageHeight: number): string {
  return lines.map((line, index) => {
    const fontSize = index === 0 ? TITLE_FONT_SIZE : BODY_FONT_SIZE;
    const y = pageHeight - PAGE_MARGIN - index * LINE_HEIGHT;
    return `BT /F1 ${fontSize} Tf ${PAGE_MARGIN} ${y} Td (${escapePdfText(line)}) Tj ET`;
  }).join('\n');
}

function writePdfDocument(objects: string[]): Buffer {
  const parts = ['%PDF-1.4\n'];
  const offsets = [0];

  objects.forEach((objectBody, index) => {
    offsets.push(Buffer.byteLength(parts.join(''), 'utf8'));
    parts.push(`${index + 1} 0 obj\n${objectBody}\nendobj\n`);
  });

  const xrefOffset = Buffer.byteLength(parts.join(''), 'utf8');
  parts.push(`xref\n0 ${objects.length + 1}\n`);
  parts.push('0000000000 65535 f \n');
  offsets.slice(1).forEach(offset => {
    parts.push(`${String(offset).padStart(10, '0')} 00000 n \n`);
  });
  parts.push(`trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);

  return Buffer.from(parts.join(''), 'utf8');
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

function formatPdfValue(value: unknown, column: GridColumn): string {
  if (value === null || value === undefined) return '';

  if (column.type === 'select' && column.selectOptions) {
    return column.selectOptions.find(option => option.value === String(value))?.label ?? String(value);
  }

  if (column.type === 'boolean') {
    return value ? 'Sim' : 'Não';
  }

  if (column.type === 'currency') {
    const numericValue = Number(value);
    return Number.isFinite(numericValue)
      ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: column.format?.currencyCode ?? 'BRL' }).format(numericValue)
      : '';
  }

  if (column.type === 'date' || column.type === 'datetime') {
    const date = value instanceof Date ? value : new Date(String(value));
    if (Number.isNaN(date.getTime())) return String(value);
    return column.type === 'date' ? date.toLocaleDateString('pt-BR') : date.toLocaleString('pt-BR');
  }

  return String(value);
}

function wrapLine(line: string, maxLineChars: number): string[] {
  const normalized = normalizePdfText(line);
  if (normalized.length <= maxLineChars) return [normalized];

  const wrapped: string[] = [];
  for (let index = 0; index < normalized.length; index += maxLineChars) {
    wrapped.push(normalized.slice(index, index + maxLineChars));
  }
  return wrapped;
}

function escapePdfText(value: string): string {
  return normalizePdfText(value).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function normalizePdfText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, '?');
}