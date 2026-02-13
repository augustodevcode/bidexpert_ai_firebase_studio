/**
 * @fileoverview API Route para exportação de dados do SuperGrid em Excel/CSV.
 * Recebe configuração de colunas + parâmetros de filtro via POST,
 * busca todos os dados correspondentes e retorna arquivo binário.
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchGridData } from '@/app/actions/grid-actions';
import { generateExcelBuffer } from '@/components/super-grid/utils/excelGenerator';
import { generateCsvString } from '@/components/super-grid/utils/csvGenerator';
import type { GridColumn, GridFetchParams } from '@/components/super-grid/SuperGrid.types';

export const dynamic = 'force-dynamic';

interface ExportRequestBody {
  params: GridFetchParams;
  columns: GridColumn[];
  format: 'excel' | 'csv';
  options?: {
    sheetName?: string;
    includeStyles?: boolean;
    delimiter?: ',' | ';' | '\t';
    encoding?: 'utf-8' | 'utf-8-sig' | 'iso-8859-1';
    includeHeaders?: boolean;
    maxRows?: number;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ExportRequestBody;
    const { params, columns, format, options } = body;

    // Buscar TODOS os dados (sem paginação limitada, até maxRows)
    const maxRows = options?.maxRows || 50000;
    const allData = await fetchGridData({
      ...params,
      pagination: { pageIndex: 0, pageSize: maxRows },
    });

    if (format === 'excel') {
      const buffer = await generateExcelBuffer(
        allData.data,
        columns,
        {
          includeStyles: options?.includeStyles !== false,
          sheetName: options?.sheetName || 'Dados',
        }
      );

      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="export_${Date.now()}.xlsx"`,
        },
      });
    } else {
      // CSV
      const csvString = generateCsvString(
        allData.data,
        columns,
        {
          delimiter: options?.delimiter || ';',
          encoding: options?.encoding || 'utf-8-sig',
          includeHeaders: options?.includeHeaders !== false,
        }
      );

      return new NextResponse(csvString, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="export_${Date.now()}.csv"`,
        },
      });
    }
  } catch (error) {
    console.error('[SuperGrid Export] Erro:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro na exportação' },
      { status: 500 }
    );
  }
}
