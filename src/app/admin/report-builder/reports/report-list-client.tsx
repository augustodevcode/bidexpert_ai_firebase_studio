// src/app/admin/report-builder/reports/report-list-client.tsx
/**
 * @fileoverview Componente cliente para listagem de relatórios.
 * Exibe grade de relatórios com busca, filtros e ações.
 */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { getReportsAction, deleteReportAction, copyPredefinedReportAction } from '../actions';
import ReportWizard from '@/components/BidReportBuilder/components/ReportWizard';
import PredefinedReportsGallery from '@/components/BidReportBuilder/components/PredefinedReportsGallery';
import type { Report } from '@prisma/client';
import type { ReportType, ReportDefinition } from '@/types/report-builder.types';
import { REPORT_TYPE_LABELS } from '@/types/report-builder.types';
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Eye,
  Trash2,
  Copy,
  Download,
  Calendar,
  FileText,
  Table2,
  LayoutDashboard,
  BarChart3,
  Tag,
  Loader2,
  Grid3X3,
  List,
  SlidersHorizontal,
  BookTemplate,
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface ReportWithType extends Report {
  type?: ReportType;
}

type ViewMode = 'grid' | 'list';
type SortOption = 'name' | 'createdAt' | 'updatedAt';

// ============================================================================
// CONSTANTS
// ============================================================================

const REPORT_TYPE_ICONS: Record<string, React.ElementType> = {
  TABLE: Table2,
  MASTER_DETAIL: LayoutDashboard,
  CROSS_TAB: FileText,
  FORM: FileText,
  CHART: BarChart3,
  LABEL: Tag,
  LETTER: FileText,
  INVOICE: FileText,
  DASHBOARD: LayoutDashboard,
  HIERARCHICAL: FileText,
};

// ============================================================================
// COMPONENT
// ============================================================================

export default function ReportListClient() {
  const router = useRouter();
  const { toast } = useToast();
  
  // States
  const [reports, setReports] = useState<ReportWithType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('updatedAt');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [activeTab, setActiveTab] = useState<string>('my-reports');
  
  // Wizard states
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  
  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<ReportWithType | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load reports
  const loadReports = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getReportsAction();
      setReports(data as ReportWithType[]);
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os relatórios.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  // Filter and sort reports
  const filteredReports = reports
    .filter(report => {
      const matchesSearch = report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (report.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
      const matchesType = typeFilter === 'all' || report.type === typeFilter;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      const aDate = new Date(a[sortBy]).getTime();
      const bDate = new Date(b[sortBy]).getTime();
      return bDate - aDate;
    });

  // Handlers
  const handleCreateReport = () => {
    setIsWizardOpen(true);
  };

  const handleWizardComplete = async (
    definition: ReportDefinition, 
    metadata: { name: string; description?: string; dataSource: string; type: ReportType }
  ) => {
    try {
      // Criar relatório via action
      const result = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: metadata.name,
          description: metadata.description,
          type: metadata.type,
          dataSource: metadata.dataSource,
          definition,
        }),
      });

      if (result.ok) {
        toast({
          title: 'Relatório criado!',
          description: `"${metadata.name}" foi criado com sucesso.`,
        });
        loadReports();
        // Redirecionar para o designer
        const data = await result.json();
        router.push(`/admin/report-builder/designer/${data.id}`);
      } else {
        throw new Error('Falha ao criar relatório');
      }
    } catch (_error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível criar o relatório.',
        variant: 'destructive',
      });
    }
  };

  const handleEditReport = (report: ReportWithType) => {
    router.push(`/admin/report-builder/designer/${report.id}`);
  };

  const handlePreviewReport = (report: ReportWithType) => {
    router.push(`/admin/report-builder/viewer/${report.id}`);
  };

  const handleDuplicateReport = async (report: ReportWithType) => {
    try {
      const result = await fetch('/api/reports/duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId: report.id.toString() }),
      });

      if (result.ok) {
        toast({
          title: 'Relatório duplicado!',
          description: `Cópia de "${report.name}" criada.`,
        });
        loadReports();
      }
    } catch (_error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível duplicar o relatório.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteClick = (report: ReportWithType) => {
    setReportToDelete(report);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!reportToDelete) return;

    setIsDeleting(true);
    try {
      const result = await deleteReportAction(reportToDelete.id.toString());
      if (result.success) {
        toast({
          title: 'Relatório excluído',
          description: result.message,
        });
        loadReports();
      } else {
        throw new Error(result.message);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Não foi possível excluir o relatório.';
      toast({
        title: 'Erro',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setReportToDelete(null);
    }
  };

  const handleExportReport = (report: ReportWithType, format: string) => {
    router.push(`/admin/report-builder/export/${report.id}?format=${format}`);
  };

  const handleCopyPredefinedReport = async (reportCode: string, newName: string) => {
    try {
      const result = await copyPredefinedReportAction(reportCode, newName);
      if (result.success) {
        loadReports();
        setActiveTab('my-reports');
      } else {
        throw new Error(result.message);
      }
    } catch (error: unknown) {
      throw error;
    }
  };

  const handlePreviewPredefinedReport = (reportCode: string) => {
    router.push(`/admin/report-builder/preview-template/${reportCode}`);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(date));
  };

  // Render
  return (
    <div className="space-y-6" data-ai-id="report-list-container">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="my-reports" className="gap-2">
              <FileText className="h-4 w-4" />
              Meus Relatórios
              <Badge variant="secondary" className="ml-1">{reports.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="templates" className="gap-2">
              <BookTemplate className="h-4 w-4" />
              Templates
            </TabsTrigger>
          </TabsList>

          <Button onClick={handleCreateReport} data-ai-id="report-create-button">
            <Plus className="h-4 w-4 mr-2" />
            Novo Relatório
          </Button>
        </div>

        {/* My Reports Tab */}
        <TabsContent value="my-reports" className="mt-6">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="relative flex-grow max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar relatórios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                data-ai-id="report-search-input"
              />
            </div>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                {Object.entries(REPORT_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="updatedAt">Mais recentes</SelectItem>
                <SelectItem value="createdAt">Data de criação</SelectItem>
                <SelectItem value="name">Nome (A-Z)</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex border rounded-md">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="icon"
                className="rounded-r-none"
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="icon"
                className="rounded-l-none"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Reports Grid/List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="font-semibold text-lg mb-2">Nenhum relatório encontrado</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || typeFilter !== 'all' 
                  ? 'Tente ajustar os filtros de busca.'
                  : 'Comece criando seu primeiro relatório ou explore os templates.'}
              </p>
              <div className="flex gap-2 justify-center">
                <Button onClick={handleCreateReport}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Relatório
                </Button>
                <Button variant="outline" onClick={() => setActiveTab('templates')}>
                  <BookTemplate className="h-4 w-4 mr-2" />
                  Ver Templates
                </Button>
              </div>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredReports.map(report => {
                const Icon = REPORT_TYPE_ICONS[report.type || 'TABLE'] || FileText;
                return (
                  <Card 
                    key={report.id.toString()} 
                    className="group hover:shadow-md transition-all"
                    data-ai-id={`report-card-${report.id}`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Icon className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-base line-clamp-1">{report.name}</CardTitle>
                            <Badge variant="outline" className="text-xs mt-1">
                              {REPORT_TYPE_LABELS[report.type || 'TABLE']}
                            </Badge>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditReport(report)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handlePreviewReport(report)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Visualizar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicateReport(report)}>
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleExportReport(report, 'PDF')}>
                              <Download className="h-4 w-4 mr-2" />
                              Exportar PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExportReport(report, 'XLSX')}>
                              <Download className="h-4 w-4 mr-2" />
                              Exportar Excel
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDeleteClick(report)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-3">
                      <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                        {report.description || 'Sem descrição'}
                      </p>
                    </CardContent>
                    <CardFooter className="pt-3 border-t text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(report.updatedAt)}
                      </div>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="space-y-2">
                {filteredReports.map(report => {
                  const Icon = REPORT_TYPE_ICONS[report.type || 'TABLE'] || FileText;
                  return (
                    <div 
                      key={report.id.toString()} 
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      data-ai-id={`report-row-${report.id}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium">{report.name}</h4>
                          <p className="text-sm text-muted-foreground line-clamp-1 max-w-md">
                            {report.description || 'Sem descrição'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant="outline">
                          {REPORT_TYPE_LABELS[report.type || 'TABLE']}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(report.updatedAt)}
                        </span>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handlePreviewReport(report)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleEditReport(report)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleDeleteClick(report)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="mt-6">
          <PredefinedReportsGallery
            onCopyReport={handleCopyPredefinedReport}
            onPreviewReport={handlePreviewPredefinedReport}
          />
        </TabsContent>
      </Tabs>

      {/* Wizard Dialog */}
      <ReportWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onComplete={handleWizardComplete}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Relatório</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o relatório &quot;{reportToDelete?.name}&quot;?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
