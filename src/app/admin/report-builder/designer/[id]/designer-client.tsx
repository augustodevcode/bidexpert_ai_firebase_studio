// src/app/admin/report-builder/designer/[id]/designer-client.tsx
/**
 * @fileoverview Cliente do Designer de Relatórios.
 * Encapsula o GrapesJSDesigner com lógica de salvamento e navegação.
 * 
 * Arquitetura: Composite (GrapesJS + Puppeteer + Handlebars)
 * @see REPORT_BUILDER_ARCHITECTURE.md
 */
'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { GrapesJSDesigner } from '@/components/BidReportBuilder/GrapesJSDesigner';
import { updateReportAction, createReportAction } from '../../actions';
import type { ReportDefinition } from '@/types/report-builder.types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, FileText } from 'lucide-react';
import Link from 'next/link';
import { REPORT_CONTEXTS, type ReportContextType } from '@/lib/report-builder/schemas/auction-context.schema';

// ============================================================================
// TYPES
// ============================================================================

interface ReportData {
  id: string;
  name: string;
  description: string | null;
  definition: any;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
  } | null;
}

interface DesignerClientProps {
  reportId?: string;
  initialReport?: ReportData | null;
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function DesignerClient({ reportId, initialReport }: DesignerClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingSaveData, setPendingSaveData] = useState<{
    html: string;
    css: string;
    definition: ReportDefinition;
  } | null>(null);
  
  // Form state for new reports
  const [newReportName, setNewReportName] = useState(initialReport?.name || '');
  const [newReportDescription, setNewReportDescription] = useState(initialReport?.description || '');
  const [selectedContext, setSelectedContext] = useState<ReportContextType>('AUCTION');
  
  // Export state
  const [exportContext, setExportContext] = useState<ReportContextType>('AUCTION');
  const [exportEntityId, setExportEntityId] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSave = useCallback(async (data: {
    html: string;
    css: string;
    definition: ReportDefinition;
  }) => {
    // Se for novo relatório, abrir dialog para nome
    if (!reportId) {
      setPendingSaveData(data);
      setIsSaveDialogOpen(true);
      return;
    }
    
    // Salvar relatório existente
    setIsSaving(true);
    try {
      const result = await updateReportAction(reportId, {
        definition: {
          ...data.definition,
          html: data.html,
          css: data.css,
        },
      });
      
      if (result.success) {
        toast({
          title: 'Salvo!',
          description: 'Template atualizado com sucesso',
        });
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Falha ao salvar',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  }, [reportId, toast]);

  const handleSaveNewReport = async () => {
    if (!pendingSaveData || !newReportName.trim()) {
      toast({
        title: 'Erro',
        description: 'Nome do relatório é obrigatório',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSaving(true);
    try {
      const result = await createReportAction({
        name: newReportName.trim(),
        description: newReportDescription.trim() || undefined,
        definition: {
          ...pendingSaveData.definition,
          html: pendingSaveData.html,
          css: pendingSaveData.css,
          context: selectedContext,
        },
      });
      
      if (result.success && result.data) {
        toast({
          title: 'Criado!',
          description: 'Relatório criado com sucesso',
        });
        setIsSaveDialogOpen(false);
        // Redirecionar para o relatório recém-criado
        router.push(`/admin/report-builder/designer/${result.data.id}`);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Falha ao criar relatório',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreview = useCallback(() => {
    if (reportId) {
      window.open(`/admin/report-builder/viewer/${reportId}`, '_blank');
    } else {
      toast({
        title: 'Aviso',
        description: 'Salve o relatório primeiro para visualizar',
      });
    }
  }, [reportId, toast]);

  const handleExport = useCallback((format: 'pdf' | 'html') => {
    if (!reportId) {
      toast({
        title: 'Aviso',
        description: 'Salve o relatório primeiro para exportar',
      });
      return;
    }
    setIsExportDialogOpen(true);
  }, [reportId, toast]);

  const handleDoExport = async () => {
    if (!reportId || !exportEntityId) {
      toast({
        title: 'Erro',
        description: 'Selecione uma entidade para exportar',
        variant: 'destructive',
      });
      return;
    }
    
    setIsExporting(true);
    try {
      const response = await fetch('/api/reports/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId,
          dataContext: exportContext,
          entityId: exportEntityId,
          format: 'pdf',
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Falha ao exportar');
      }
      
      // Download PDF
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Exportado!',
        description: 'PDF gerado com sucesso',
      });
      setIsExportDialogOpen(false);
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Falha ao exportar',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <>
      {/* Header with back button */}
      <div className="flex items-center gap-4 px-4 py-2 border-b bg-background">
        <Link href="/admin/report-builder/reports">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </Link>
        
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <span className="font-semibold">
            {initialReport?.name || 'Novo Relatório'}
          </span>
        </div>
        
        {initialReport && (
          <span className="text-sm text-muted-foreground">
            Última edição: {new Date(initialReport.updatedAt).toLocaleString('pt-BR')}
          </span>
        )}
      </div>

      {/* GrapesJS Designer */}
      <GrapesJSDesigner
        reportId={reportId}
        initialHtml={initialReport?.definition?.html}
        initialCss={initialReport?.definition?.css}
        contextType={(initialReport?.definition?.context as ReportContextType) || 'AUCTION'}
        onSave={handleSave}
        onPreview={handlePreview}
        onExport={handleExport}
        className="flex-1"
      />

      {/* Save Dialog for new reports */}
      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Salvar Relatório</DialogTitle>
            <DialogDescription>
              Informe os detalhes do novo relatório
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reportName">Nome do Relatório *</Label>
              <Input
                id="reportName"
                value={newReportName}
                onChange={(e) => setNewReportName(e.target.value)}
                placeholder="Ex: Edital de Leilão Judicial"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reportDescription">Descrição</Label>
              <Textarea
                id="reportDescription"
                value={newReportDescription}
                onChange={(e) => setNewReportDescription(e.target.value)}
                placeholder="Descreva o propósito deste relatório..."
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reportContext">Contexto de Dados</Label>
              <Select value={selectedContext} onValueChange={(v) => setSelectedContext(v as ReportContextType)}>
                <SelectTrigger id="reportContext">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(REPORT_CONTEXTS).map(([key, ctx]) => (
                    <SelectItem key={key} value={key}>
                      {ctx.name} - {ctx.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSaveDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveNewReport} disabled={isSaving || !newReportName.trim()}>
              {isSaving ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Exportar Relatório</DialogTitle>
            <DialogDescription>
              Selecione os dados para preencher o relatório
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="exportContext">Contexto de Dados</Label>
              <Select value={exportContext} onValueChange={(v) => setExportContext(v as ReportContextType)}>
                <SelectTrigger id="exportContext">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(REPORT_CONTEXTS).map(([key, ctx]) => (
                    <SelectItem key={key} value={key}>
                      {ctx.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="exportEntityId">ID da Entidade *</Label>
              <Input
                id="exportEntityId"
                value={exportEntityId}
                onChange={(e) => setExportEntityId(e.target.value)}
                placeholder="Ex: 1, 2, 123..."
                type="number"
              />
              <p className="text-xs text-muted-foreground">
                Informe o ID do {REPORT_CONTEXTS[exportContext].name.toLowerCase()} para preencher o relatório
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsExportDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleDoExport} disabled={isExporting || !exportEntityId}>
              {isExporting ? 'Gerando PDF...' : 'Gerar PDF'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
