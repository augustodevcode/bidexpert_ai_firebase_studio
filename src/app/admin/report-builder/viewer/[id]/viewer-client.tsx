// src/app/admin/report-builder/viewer/[id]/viewer-client.tsx
/**
 * @fileoverview Client component para o visualizador de relatórios.
 * Gerencia estado, carregamento de dados e interações.
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Edit, Copy, Share2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ReportViewer } from '@/components/BidReportBuilder/components/ReportViewer';

import { 
  getReportByIdAction, 
  generateReportDataAction,
} from '../../actions';

import type { 
  ReportDefinition, 
  ExportFormat, 
  ReportParameter 
} from '@/types/report-builder.types';
import type { Report } from '@prisma/client';
import { reportExportService } from '@/services/report-export.service';

// ============================================================================
// TYPES
// ============================================================================

interface ViewerClientProps {
  reportId: string;
  initialParams?: { [key: string]: string | string[] | undefined };
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ReportViewerClient({ reportId, initialParams }: ViewerClientProps) {
  const router = useRouter();
  const { toast } = useToast();

  // State
  const [report, setReport] = useState<Report | null>(null);
  const [definition, setDefinition] = useState<ReportDefinition | null>(null);
  const [data, setData] = useState<{ rows: Record<string, unknown>[]; totalCount: number } | null>(null);
  const [parameters, setParameters] = useState<ReportParameter[]>([]);
  const [parameterValues, setParameterValues] = useState<Record<string, unknown>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  const loadData = useCallback(async (def: ReportDefinition, params: Record<string, unknown>) => {
    try {
      const result = await generateReportDataAction(reportId, params);
      
      if (!result.success) {
        setError(result.message || 'Erro ao gerar dados.');
        return;
      }

      setData({
        rows: (result.data as Record<string, unknown>[]) || [],
        totalCount: result.data?.length || 0,
      });
    } catch (err: unknown) {
      console.error('Erro ao carregar dados:', err);
      const message = err instanceof Error ? err.message : 'Erro ao carregar dados.';
      setError(message);
    }
  }, [reportId]);

  const loadReport = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await getReportByIdAction(reportId);
      
      if (!result.success || !result.data) {
        setError(result.message || 'Relatório não encontrado.');
        return;
      }

      const reportData = result.data;
      setReport(reportData);

      // Parse definition
      const def = typeof reportData.definition === 'string' 
        ? JSON.parse(reportData.definition) 
        : reportData.definition;
      setDefinition(def);

      // Parse parameters (assuming parameters are in definition or empty for now)
      const params: ReportParameter[] = (def as any).parameters || [];
      setParameters(params);

      // Set initial parameter values
      const initialValues: Record<string, unknown> = {};
      params.forEach((param: ReportParameter) => {
        const urlValue = initialParams?.[param.name];
        initialValues[param.name] = urlValue 
          ? (Array.isArray(urlValue) ? urlValue[0] : urlValue)
          : param.defaultValue;
      });
      setParameterValues(initialValues);

      // Load data
      await loadData(def, initialValues);

    } catch (err: unknown) {
      console.error('Erro ao carregar relatório:', err);
      const message = err instanceof Error ? err.message : 'Erro ao carregar relatório.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [reportId, initialParams, loadData]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleParameterChange = useCallback(async (newParams: Record<string, unknown>) => {
    setParameterValues(newParams);
    if (definition) {
      setIsLoading(true);
      await loadData(definition, newParams);
      setIsLoading(false);
    }
  }, [definition, loadData]);

  const handleRefresh = useCallback(async () => {
    if (definition) {
      setIsLoading(true);
      await loadData(definition, parameterValues);
      setIsLoading(false);
    }
  }, [definition, parameterValues, loadData]);

  const handleExport = useCallback(async (format: ExportFormat) => {
    if (!definition || !data) {
      toast({
        title: 'Erro',
        description: 'Não há dados para exportar.',
        variant: 'destructive',
      });
      return;
    }

    try {
      toast({
        title: 'Exportando...',
        description: `Gerando arquivo ${format}...`,
      });

      const result = await reportExportService.export(definition, data, {
        format,
        fileName: report?.name || 'relatorio',
      });

      if (result.success && result.blob) {
        // Download file
        const url = URL.createObjectURL(result.blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = result.fileName || `relatorio.${format.toLowerCase()}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast({
          title: 'Sucesso!',
          description: result.message,
        });
      } else {
        toast({
          title: 'Erro',
          description: result.message,
          variant: 'destructive',
        });
      }
    } catch (err: unknown) {
      toast({
        title: 'Erro',
        description: err.message || 'Erro ao exportar.',
        variant: 'destructive',
      });
    }
  }, [definition, data, report, toast]);

  const handleDrillDown = useCallback((field: string, value: unknown, rowData: Record<string, unknown>) => {
    toast({
      title: 'Drill-down',
      description: `Campo: ${field}, Valor: ${value}`,
    });
    // TODO: Implementar navegação para drill-down
    console.log('Drill-down:', { field, value, rowData });
  }, [toast]);

  const handleEdit = useCallback(() => {
    router.push(`/admin/report-builder/designer/${reportId}`);
  }, [router, reportId]);

  const handleBack = useCallback(() => {
    router.push('/admin/report-builder/reports');
  }, [router]);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {report?.name || 'Carregando...'}
            </h1>
            {report?.description && (
              <p className="text-sm text-muted-foreground">
                {report.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
          <Button variant="outline" size="sm">
            <Copy className="h-4 w-4 mr-2" />
            Copiar
          </Button>
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            Compartilhar
          </Button>
        </div>
      </div>

      {/* Viewer */}
      {definition && (
        <ReportViewer
          definition={definition}
          data={data || undefined}
          parameters={parameters}
          onParameterChange={handleParameterChange}
          onExport={handleExport}
          onDrillDown={handleDrillDown}
          onRefresh={handleRefresh}
          isLoading={isLoading}
          error={error}
          className="h-[calc(100vh-200px)]"
        />
      )}
    </div>
  );
}

export default ReportViewerClient;
