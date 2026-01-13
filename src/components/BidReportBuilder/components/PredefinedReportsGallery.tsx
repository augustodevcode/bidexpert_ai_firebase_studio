// src/components/BidReportBuilder/components/PredefinedReportsGallery.tsx
/**
 * @fileoverview Galeria de relatórios predefinidos (templates).
 * Exibe templates organizados por categoria com opção de copiar para edição.
 */
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  Copy, 
  Eye, 
  Search, 
  FileText, 
  Users, 
  ShoppingCart, 
  DollarSign, 
  BarChart3, 
  Building2,
  Gavel,
  Calendar,
  Tag,
  Loader2,
  LockKeyhole,
  Star,
} from 'lucide-react';
import type { ReportType } from '@/types/report-builder.types';
import { REPORT_TYPE_LABELS } from '@/types/report-builder.types';

// ============================================================================
// TYPES
// ============================================================================

interface PredefinedReport {
  id: string;
  code: string;
  name: string;
  description: string;
  category: string;
  module?: string;
  type: ReportType;
  iconName: string;
  isFeatured?: boolean;
}

interface PredefinedReportsGalleryProps {
  onCopyReport: (reportCode: string, newName: string) => Promise<void>;
  onPreviewReport: (reportCode: string) => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  'Recursos Humanos': Users,
  'Vendas': ShoppingCart,
  'Financeiro': DollarSign,
  'Leilões': Gavel,
  'Analytics': BarChart3,
  'Administrativo': Building2,
  'Calendário': Calendar,
  'Catálogo': Tag,
  'Geral': FileText,
};

// Relatórios predefinidos de exemplo (em produção viriam do banco)
const PREDEFINED_REPORTS: PredefinedReport[] = [
  // Recursos Humanos
  {
    id: '1',
    code: 'EMP_LIST',
    name: 'Lista de Funcionários',
    description: 'Relatório completo com dados dos funcionários cadastrados',
    category: 'Recursos Humanos',
    module: 'User',
    type: 'TABLE',
    iconName: 'Users',
    isFeatured: true,
  },
  {
    id: '2',
    code: 'EMP_BIRTHDAY',
    name: 'Aniversariantes do Mês',
    description: 'Lista de funcionários que fazem aniversário no mês selecionado',
    category: 'Recursos Humanos',
    module: 'User',
    type: 'TABLE',
    iconName: 'Calendar',
  },
  {
    id: '3',
    code: 'EMP_BY_DEPT',
    name: 'Funcionários por Departamento',
    description: 'Agrupamento de funcionários por área/departamento',
    category: 'Recursos Humanos',
    module: 'User',
    type: 'HIERARCHICAL',
    iconName: 'Building2',
  },
  
  // Leilões
  {
    id: '4',
    code: 'AUCTION_SUMMARY',
    name: 'Resumo de Leilões',
    description: 'Visão geral dos leilões com estatísticas de participação',
    category: 'Leilões',
    module: 'Auction',
    type: 'MASTER_DETAIL',
    iconName: 'Gavel',
    isFeatured: true,
  },
  {
    id: '5',
    code: 'AUCTION_LOTS',
    name: 'Catálogo de Lotes',
    description: 'Lista detalhada de lotes de um leilão específico',
    category: 'Leilões',
    module: 'Lot',
    type: 'TABLE',
    iconName: 'Tag',
  },
  {
    id: '6',
    code: 'AUCTION_BIDS',
    name: 'Histórico de Lances',
    description: 'Registro completo de lances por leilão/lote',
    category: 'Leilões',
    module: 'Bid',
    type: 'TABLE',
    iconName: 'BarChart3',
  },
  {
    id: '7',
    code: 'WINNER_REPORT',
    name: 'Relatório de Arrematantes',
    description: 'Lista de arrematantes com valores e lotes ganhos',
    category: 'Leilões',
    module: 'User',
    type: 'MASTER_DETAIL',
    iconName: 'Users',
  },
  
  // Financeiro
  {
    id: '8',
    code: 'SALES_INVOICE',
    name: 'Nota de Arrematação',
    description: 'Documento fiscal para registro de vendas em leilão',
    category: 'Financeiro',
    module: 'Lot',
    type: 'INVOICE',
    iconName: 'DollarSign',
    isFeatured: true,
  },
  {
    id: '9',
    code: 'PAYMENT_STATUS',
    name: 'Status de Pagamentos',
    description: 'Controle de pagamentos pendentes e realizados',
    category: 'Financeiro',
    module: 'Payment',
    type: 'TABLE',
    iconName: 'DollarSign',
  },
  {
    id: '10',
    code: 'COMMISSION_REPORT',
    name: 'Relatório de Comissões',
    description: 'Cálculo de comissões por leiloeiro/comitente',
    category: 'Financeiro',
    module: 'Auction',
    type: 'CROSS_TAB',
    iconName: 'BarChart3',
  },
  
  // Analytics
  {
    id: '11',
    code: 'SALES_DASHBOARD',
    name: 'Dashboard de Vendas',
    description: 'Painel visual com métricas de vendas e conversão',
    category: 'Analytics',
    module: 'Auction',
    type: 'DASHBOARD',
    iconName: 'BarChart3',
  },
  {
    id: '12',
    code: 'PARTICIPATION_TRENDS',
    name: 'Tendências de Participação',
    description: 'Análise temporal de participação em leilões',
    category: 'Analytics',
    module: 'Auction',
    type: 'CHART',
    iconName: 'BarChart3',
  },
  
  // Catálogo
  {
    id: '13',
    code: 'PRODUCT_LABELS',
    name: 'Etiquetas de Produtos',
    description: 'Etiquetas para identificação de lotes/produtos',
    category: 'Catálogo',
    module: 'Lot',
    type: 'LABEL',
    iconName: 'Tag',
  },
  {
    id: '14',
    code: 'AUCTION_CATALOG',
    name: 'Catálogo do Leilão',
    description: 'Documento formatado com todos os lotes do leilão',
    category: 'Catálogo',
    module: 'Auction',
    type: 'FORM',
    iconName: 'FileText',
  },
];

const CATEGORIES = [...new Set(PREDEFINED_REPORTS.map(r => r.category))];

// ============================================================================
// COMPONENT
// ============================================================================

export default function PredefinedReportsGallery({ 
  onCopyReport, 
  onPreviewReport 
}: PredefinedReportsGalleryProps) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isCopyDialogOpen, setIsCopyDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<PredefinedReport | null>(null);
  const [newReportName, setNewReportName] = useState('');
  const [isCopying, setIsCopying] = useState(false);

  const filteredReports = PREDEFINED_REPORTS.filter(report => {
    const matchesSearch = report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          report.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || report.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredReports = PREDEFINED_REPORTS.filter(r => r.isFeatured);

  const handleCopyClick = (report: PredefinedReport) => {
    setSelectedReport(report);
    setNewReportName(`Cópia de ${report.name}`);
    setIsCopyDialogOpen(true);
  };

  const handleConfirmCopy = async () => {
    if (!selectedReport || !newReportName.trim()) return;

    setIsCopying(true);
    try {
      await onCopyReport(selectedReport.code, newReportName);
      toast({
        title: 'Relatório copiado!',
        description: `"${newReportName}" foi criado e está pronto para edição.`,
      });
      setIsCopyDialogOpen(false);
      setSelectedReport(null);
      setNewReportName('');
    } catch (_error) {
      toast({
        title: 'Erro ao copiar',
        description: 'Não foi possível copiar o relatório. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsCopying(false);
    }
  };

  const getIconComponent = (iconName: string): React.ElementType => {
    const icons: Record<string, React.ElementType> = {
      Users, ShoppingCart, DollarSign, BarChart3, Building2, Gavel, Calendar, Tag, FileText,
    };
    return icons[iconName] || FileText;
  };

  return (
    <div className="space-y-6" data-ai-id="predefined-reports-gallery">
      {/* Featured Reports */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
          <h3 className="font-semibold">Relatórios em Destaque</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {featuredReports.map(report => {
            const Icon = getIconComponent(report.iconName);
            return (
              <Card key={report.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-medium">{report.name}</CardTitle>
                        <Badge variant="outline" className="text-xs mt-1">
                          {REPORT_TYPE_LABELS[report.type]}
                        </Badge>
                      </div>
                    </div>
                    <LockKeyhole className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent className="pt-2">
                  <p className="text-xs text-muted-foreground mb-3">{report.description}</p>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => onPreviewReport(report.code)}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Ver
                    </Button>
                    <Button 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleCopyClick(report)}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copiar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center gap-4">
        <div className="relative flex-grow max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar relatório..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
            data-ai-id="predefined-search-input"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="all" className="text-xs">
            Todos ({PREDEFINED_REPORTS.length})
          </TabsTrigger>
          {CATEGORIES.map(category => {
            const Icon = CATEGORY_ICONS[category] || FileText;
            const count = PREDEFINED_REPORTS.filter(r => r.category === category).length;
            return (
              <TabsTrigger key={category} value={category} className="text-xs">
                <Icon className="h-3 w-3 mr-1" />
                {category} ({count})
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value={selectedCategory} className="mt-4">
          <ScrollArea className="h-[400px] pr-4">
            {filteredReports.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredReports.map(report => {
                  const Icon = getIconComponent(report.iconName);
                  return (
                    <Card 
                      key={report.id} 
                      className="group hover:border-primary/50 transition-colors"
                      data-ai-id={`predefined-report-${report.code.toLowerCase()}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
                            <Icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                          <div className="flex-grow min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <h4 className="font-medium text-sm truncate">{report.name}</h4>
                              <LockKeyhole className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                              {report.description}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="secondary" className="text-xs">
                                {REPORT_TYPE_LABELS[report.type]}
                              </Badge>
                              {report.module && (
                                <Badge variant="outline" className="text-xs">
                                  {report.module}
                                </Badge>
                              )}
                            </div>
                            <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => onPreviewReport(report.code)}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                Visualizar
                              </Button>
                              <Button 
                                variant="default" 
                                size="sm"
                                onClick={() => handleCopyClick(report)}
                              >
                                <Copy className="h-3 w-3 mr-1" />
                                Copiar para Editar
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum relatório encontrado para esta busca.</p>
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Copy Dialog */}
      <Dialog open={isCopyDialogOpen} onOpenChange={setIsCopyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Copiar Relatório Predefinido</DialogTitle>
            <DialogDescription>
              Ao copiar, você terá uma versão editável deste relatório em sua lista pessoal.
              Scripts e configurações serão preservados.
            </DialogDescription>
          </DialogHeader>
          
          {selectedReport && (
            <div className="py-4 space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-medium text-sm">{selectedReport.name}</p>
                <p className="text-xs text-muted-foreground">{selectedReport.description}</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="new-report-name">Nome da cópia</Label>
                <Input
                  id="new-report-name"
                  value={newReportName}
                  onChange={(e) => setNewReportName(e.target.value)}
                  placeholder="Digite o nome do novo relatório"
                  data-ai-id="copy-report-name-input"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsCopyDialogOpen(false)}
              disabled={isCopying}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirmCopy}
              disabled={!newReportName.trim() || isCopying}
              data-ai-id="confirm-copy-button"
            >
              {isCopying ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Copiando...
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Criar Cópia
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
