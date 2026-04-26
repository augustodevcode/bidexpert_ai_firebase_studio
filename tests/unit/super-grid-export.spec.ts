/**
 * @fileoverview Testes unitários para exportação PDF do SuperGrid.
 */

import { describe, expect, it } from 'vitest';
import { generatePdfBuffer } from '@/components/super-grid/utils/pdfGenerator';
import type { GridColumn } from '@/components/super-grid/SuperGrid.types';

describe('SuperGrid export contracts', () => {
  it('gera um PDF válido com cabeçalho e dados tabulares', () => {
    const columns: GridColumn[] = [
      { id: 'title', accessorKey: 'title', header: 'Título', type: 'string' },
      { id: 'status', accessorKey: 'status', header: 'Status', type: 'select', selectOptions: [{ value: 'ABERTO', label: 'Aberto' }] },
    ];

    const pdf = generatePdfBuffer(
      [{ title: 'Leilão Teste', status: 'ABERTO' }],
      columns,
      { title: 'Leilões SuperGrid' }
    );

    const pdfText = pdf.toString('utf8');
    expect(pdfText.startsWith('%PDF-1.4')).toBe(true);
    expect(pdfText).toContain('/Type /Catalog');
    expect(pdfText).toContain('Leiloes SuperGrid');
    expect(pdfText).toContain('Leilao Teste | Aberto');
  });
});