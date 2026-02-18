/**
 * @fileoverview Menu de exportação do SuperGrid.
 * Dropdown com opções de Excel e CSV, suportando formatos configuráveis.
 */
'use client';

import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { ExportConfig } from '../SuperGrid.types';
import type { GridLocale } from '../SuperGrid.i18n';

interface ExportMenuProps {
  config: ExportConfig;
  onExport: (format: 'excel' | 'csv') => void;
  isExporting: boolean;
  disabled?: boolean;
  locale: GridLocale;
}

export function ExportMenu({
  config,
  onExport,
  isExporting,
  disabled,
  locale,
}: ExportMenuProps) {
  const formats = config.formats || ['csv', 'excel'];

  if (formats.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || isExporting}
          data-ai-id="supergrid-export-btn"
        >
          <Download className="mr-2 h-4 w-4" />
          {isExporting ? locale.export.exporting : locale.export.exportButton}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" data-ai-id="supergrid-export-menu">
        {formats.includes('excel') && (
          <DropdownMenuItem
            onClick={() => onExport('excel')}
            data-ai-id="supergrid-export-excel"
          >
            <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" />
            {locale.export.excel}
          </DropdownMenuItem>
        )}
        {formats.includes('csv') && (
          <DropdownMenuItem
            onClick={() => onExport('csv')}
            data-ai-id="supergrid-export-csv"
          >
            <FileText className="mr-2 h-4 w-4 text-blue-600" />
            {locale.export.csv}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
