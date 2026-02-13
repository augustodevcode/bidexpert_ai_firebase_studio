/**
 * @fileoverview Hook de exportação do SuperGrid.
 * Gerencia download de Excel/CSV via API route com feedback via toast.
 */
'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import type { GridColumn, GridFetchParams, ExportConfig } from '../SuperGrid.types';

interface UseGridExportParams {
  config: {
    entity: string;
    columns: GridColumn[];
    export: ExportConfig;
  };
  currentParams: {
    sorting: Array<{ id: string; desc: boolean }>;
    filters: Record<string, unknown>;
    globalFilter: string;
    searchableColumns: string[];
    includes: Record<string, boolean | Record<string, unknown>>;
  };
}

export function useGridExport({ config, currentParams }: UseGridExportParams) {
  const [isExporting, setIsExporting] = useState(false);

  const exportData = useCallback(async (format: 'excel' | 'csv') => {
    setIsExporting(true);
    const toastId = toast.loading(
      format === 'excel' ? 'Gerando Excel...' : 'Gerando CSV...'
    );

    try {
      const fetchParams: GridFetchParams = {
        entity: config.entity,
        pagination: { pageIndex: 0, pageSize: config.export.maxRows || 50000 },
        sorting: currentParams.sorting,
        filters: currentParams.filters,
        globalFilter: currentParams.globalFilter || undefined,
        searchableColumns: currentParams.searchableColumns,
        includes: currentParams.includes,
      };

      const response = await fetch('/api/grid/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          params: fetchParams,
          columns: config.columns,
          format,
          options: format === 'excel'
            ? config.export.excel
            : config.export.csv,
        }),
      });

      if (!response.ok) {
        throw new Error(`Erro na exportação: ${response.statusText}`);
      }

      // Download do arquivo
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = format === 'excel'
        ? `export_${Date.now()}.xlsx`
        : `export_${Date.now()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Exportação concluída!', { id: toastId });
    } catch (error) {
      console.error('[SuperGrid Export] Erro:', error);
      toast.error(
        error instanceof Error ? error.message : 'Erro na exportação',
        { id: toastId }
      );
    } finally {
      setIsExporting(false);
    }
  }, [config, currentParams]);

  return { exportData, isExporting };
}
