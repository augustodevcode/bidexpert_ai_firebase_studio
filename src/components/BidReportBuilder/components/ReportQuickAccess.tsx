// src/components/BidReportBuilder/components/ReportQuickAccess.tsx
/**
 * @fileoverview Componente de acesso rápido a relatórios.
 * Exibe atalhos para relatórios relevantes em dashboards.
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Download,
  Eye,
  ChevronRight,
  FileSpreadsheet,
  FileType,
  Printer,
  Loader2,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';

import type { ReportTemplate } from '@/lib/report-templates';
import { reportExportService } from '@/services/report-export.service';
import type { ExportFormat } from '@/types/report-builder.types';

// ============================================================================
// TYPES
// ============================================================================

interface ReportQuickAccessProps {
  /** Templates de relatórios para exibir */
  templates: ReportTemplate[];
  /** Contexto atual (ex: auctionId, lotId) */
  context?: Record<string, unknown>;
  /** Título da seção */
  title?: string;
  /** Descrição da seção */
  description?: string;
  /** Layout: grid ou lista */
  layout?: 'grid' | 'list' | 'compact';
  /** Máximo de itens a exibir (0 = todos) */
  maxItems?: number;
  /** Callback ao selecionar relatório */
  onSelect?: (template: ReportTemplate) => void;
  /** Classe CSS adicional */
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ReportQuickAccess({
  templates,
  context,
  title = 'Relatórios',
  description,
  layout = 'grid',
  maxItems = 6,
  onSelect,
  className,
}: ReportQuickAccessProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<ReportTemplate | null>(null);

  const displayTemplates = maxItems > 0 ? templates.slice(0, maxItems) : templates;
  const hasMore = maxItems > 0 && templates.length > maxItems;

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleViewReport = (template: ReportTemplate) => {
    if (onSelect) {
      onSelect(template);
    } else {
      const params = new URLSearchParams();
      if (context) {
        Object.entries(context).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.set(key, String(value));
          }
        });
      }
      router.push(`/admin/report-builder/viewer/${template.id}?${params.toString()}`);
    }
  };

  const handleExport = async (template: ReportTemplate, format: ExportFormat) => {
    setIsExporting(template.id);
    
    try {
      // Gerar dados mock para exportação (em produção, buscar dados reais)
      const mockData = generateMockData(template, context);
      
      const result = await reportExportService.export(
        template.definition,
        mockData,
        { format, fileName: template.name.replace(/\s+/g, '_') }
      );

      if (result.success && result.blob) {
        const url = URL.createObjectURL(result.blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = result.fileName || `${template.name}.${format.toLowerCase()}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast({
          title: 'Exportação concluída',
          description: `Relatório "${template.name}" exportado com sucesso.`,
        });
      } else {
        throw new Error(result.message);
      }
    } catch (error: unknown) {
      toast({
        title: 'Erro na exportação',
        description: error.message || 'Falha ao exportar relatório.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(null);
    }
  };

  const handlePrint = (template: ReportTemplate) => {
    handleExport(template, 'PDF');
  };

  const handleViewAll = () => {
    router.push('/admin/report-builder/reports');
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  const renderCompactItem = (template: ReportTemplate) => (
    <div
      key={template.id}
      className="flex items-center justify-between py-2 px-3 hover:bg-muted/50 rounded-md cursor-pointer transition-colors"
      onClick={() => handleViewReport(template)}
    >
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">{template.name}</span>
      </div>
      <div className="flex items-center gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <Download className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleExport(template, 'PDF')}>
              <FileText className="h-4 w-4 mr-2" />
              PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport(template, 'XLSX')}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Excel
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport(template, 'CSV')}>
              <FileType className="h-4 w-4 mr-2" />
              CSV
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  const renderListItem = (template: ReportTemplate) => (
    <div
      key={template.id}
      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-md bg-primary/10">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h4 className="font-medium">{template.name}</h4>
          <p className="text-sm text-muted-foreground line-clamp-1">
            {template.description}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs">
          {template.category}
        </Badge>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleViewReport(template)}
        >
          <Eye className="h-4 w-4 mr-1" />
          Visualizar
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={isExporting === template.id}>
              {isExporting === template.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Download className="h-4 w-4 mr-1" />
                  Exportar
                </>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleExport(template, 'PDF')}>
              <FileText className="h-4 w-4 mr-2" />
              Exportar PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport(template, 'XLSX')}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Exportar Excel
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport(template, 'CSV')}>
              <FileType className="h-4 w-4 mr-2" />
              Exportar CSV
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handlePrint(template)}>
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  const renderGridItem = (template: ReportTemplate) => (
    <Card
      key={template.id}
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => handleViewReport(template)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="p-2 rounded-md bg-primary/10">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <Badge variant="secondary" className="text-xs">
            {template.category}
          </Badge>
        </div>
        <CardTitle className="text-base mt-2">{template.name}</CardTitle>
        <CardDescription className="line-clamp-2 text-xs">
          {template.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation();
              handleViewReport(template);
            }}
          >
            <Eye className="h-3.5 w-3.5 mr-1" />
            Ver
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="outline" size="sm" disabled={isExporting === template.id}>
                {isExporting === template.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport(template, 'PDF')}>
                PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport(template, 'XLSX')}>
                Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport(template, 'CSV')}>
                CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );

  if (templates.length === 0) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {title}
            </CardTitle>
            {description && (
              <CardDescription>{description}</CardDescription>
            )}
          </div>
          {hasMore && (
            <Button variant="ghost" size="sm" onClick={handleViewAll}>
              Ver todos
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {layout === 'compact' && (
          <div className="space-y-1">
            {displayTemplates.map(renderCompactItem)}
          </div>
        )}

        {layout === 'list' && (
          <div className="space-y-3">
            {displayTemplates.map(renderListItem)}
          </div>
        )}

        {layout === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayTemplates.map(renderGridItem)}
          </div>
        )}

        {hasMore && (
          <div className="mt-4 text-center">
            <Button variant="link" onClick={handleViewAll}>
              Ver todos os {templates.length} relatórios
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </CardContent>

      {/* Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{previewTemplate?.name}</DialogTitle>
            <DialogDescription>{previewTemplate?.description}</DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[500px]">
            {/* Preview content here */}
            <div className="p-4 text-center text-muted-foreground">
              Pré-visualização do relatório
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateMockData(
  template: ReportTemplate,
  _context?: Record<string, unknown>
): { rows: Record<string, unknown>[]; totalCount: number } {
  // Gera dados mock baseado no template
  const rows: Record<string, any>[] = [];
  const columns = template.definition.elements
    .find(el => el.type === 'table')
    ?.properties?.tableConfig?.columns || [];

  for (let i = 0; i < 10; i++) {
    const row: Record<string, unknown> = {};
    columns.forEach((col: unknown) => {
      const column = col as { format?: string; fieldBinding?: string };
      if (column.format === 'currency') {
        row[column.fieldBinding || ''] = Math.random() * 10000 + 1000;
      } else if (column.format === 'date') {
        row[column.fieldBinding || ''] = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
      } else if (column.format === 'datetime') {
        row[column.fieldBinding || ''] = new Date();
      } else if (column.format === 'percent') {
        row[column.fieldBinding || ''] = Math.random() * 100;
      } else if ((column.fieldBinding || '').includes('number') || (column.fieldBinding || '').includes('Number')) {
        row[column.fieldBinding || ''] = `${i + 1}`.padStart(4, '0');
      } else if ((column.fieldBinding || '').includes('status') || (column.fieldBinding || '').includes('Status')) {
        row[column.fieldBinding || ''] = ['Ativo', 'Pendente', 'Concluído'][Math.floor(Math.random() * 3)];
      } else {
        row[column.fieldBinding || ''] = `${column.header || 'Col'} ${i + 1}`;
      }
    });
    rows.push(row);
  }

  return { rows, totalCount: rows.length };
}

export default ReportQuickAccess;
