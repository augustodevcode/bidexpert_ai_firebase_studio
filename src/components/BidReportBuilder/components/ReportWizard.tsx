// src/components/BidReportBuilder/components/ReportWizard.tsx
/**
 * @fileoverview Wizard de criação de relatórios em 4 passos.
 * Guia o usuário através do processo de criação de um novo relatório.
 */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { getDataSourcesAction } from '@/app/admin/datasources/actions';
import type { DataSource } from '@prisma/client';
import type { 
  WizardData, 
  SelectedField, 
  ReportType, 
  ReportDefinition,
  ReportElement,
} from '@/types/report-builder.types';
import { REPORT_TYPE_LABELS } from '@/types/report-builder.types';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Table2,
  LayoutDashboard,
  FileSpreadsheet,
  FileText,
  BarChart3,
  Tag,
  Mail,
  Receipt,
  GitBranch,
  GripVertical,
  ArrowUpDown,
  Loader2,
  Sparkles,
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface ReportWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (definition: ReportDefinition, metadata: { name: string; description?: string; dataSource: string; type: ReportType }) => void;
}

interface DataSourceField {
  name: string;
  type: string;
  label?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const REPORT_TYPE_ICONS: Record<ReportType, React.ElementType> = {
  TABLE: Table2,
  MASTER_DETAIL: LayoutDashboard,
  CROSS_TAB: FileSpreadsheet,
  FORM: FileText,
  CHART: BarChart3,
  LABEL: Tag,
  LETTER: Mail,
  INVOICE: Receipt,
  DASHBOARD: LayoutDashboard,
  HIERARCHICAL: GitBranch,
};

const REPORT_TYPE_DESCRIPTIONS: Record<ReportType, string> = {
  TABLE: 'Dados em formato de tabela com colunas e linhas',
  MASTER_DETAIL: 'Relatório com cabeçalho e detalhes expandíveis',
  CROSS_TAB: 'Tabela dinâmica com pivot de dados',
  FORM: 'Layout livre com campos posicionáveis',
  CHART: 'Visualização baseada em gráficos',
  LABEL: 'Etiquetas para impressão em série',
  LETTER: 'Modelo de carta ou documento',
  INVOICE: 'Formato de fatura ou nota fiscal',
  DASHBOARD: 'Painel com múltiplos componentes',
  HIERARCHICAL: 'Dados em estrutura de árvore',
};

const THEMES = [
  { id: 'default', name: 'Padrão', primaryColor: '#2563eb', previewBg: 'bg-blue-600' },
  { id: 'professional', name: 'Profissional', primaryColor: '#0f172a', previewBg: 'bg-slate-900' },
  { id: 'modern', name: 'Moderno', primaryColor: '#7c3aed', previewBg: 'bg-violet-600' },
  { id: 'corporate', name: 'Corporativo', primaryColor: '#059669', previewBg: 'bg-emerald-600' },
  { id: 'minimal', name: 'Minimalista', primaryColor: '#6b7280', previewBg: 'bg-gray-500' },
];

const INITIAL_WIZARD_DATA: WizardData = {
  name: '',
  description: '',
  dataSource: '',
  reportType: 'TABLE',
  selectedFields: [],
  theme: 'default',
  title: '',
  pageSize: 'A4',
  orientation: 'portrait',
};

// ============================================================================
// COMPONENT
// ============================================================================

export default function ReportWizard({ isOpen, onClose, onComplete }: ReportWizardProps) {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [wizardData, setWizardData] = useState<WizardData>(INITIAL_WIZARD_DATA);
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDataSourceFields, setSelectedDataSourceFields] = useState<DataSourceField[]>([]);

  // Carregar data sources
  useEffect(() => {
    const fetchDataSources = async () => {
      setIsLoading(true);
      try {
        const sources = await getDataSourcesAction();
        setDataSources(sources);
      } catch (error) {
        console.error('Erro ao carregar fontes de dados:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar as fontes de dados.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    if (isOpen) {
      fetchDataSources();
    }
  }, [isOpen, toast]);

  // Atualizar campos quando mudar data source
  useEffect(() => {
    if (wizardData.dataSource) {
      const source = dataSources.find(ds => ds.modelName === wizardData.dataSource);
      if (source) {
        const fields = (source.fields as unknown as DataSourceField[]) ?? [];
        setSelectedDataSourceFields(fields);
        // Auto-selecionar primeiros 5 campos
        const initialFields: SelectedField[] = fields.slice(0, 5).map((f, i) => ({
          fieldName: f.name,
          label: f.label || f.name,
          sortOrder: i,
          visible: true,
        }));
        setWizardData(prev => ({ ...prev, selectedFields: initialFields }));
      }
    }
  }, [wizardData.dataSource, dataSources]);

  // Atualizar título quando mudar nome
  useEffect(() => {
    if (wizardData.name && !wizardData.title) {
      setWizardData(prev => ({ ...prev, title: prev.name }));
    }
  }, [wizardData.name, wizardData.title]);

  const handleChange = useCallback((field: keyof WizardData, value: unknown) => {
    setWizardData(prev => ({ ...prev, [field]: value }));
  }, []);

  const toggleField = useCallback((fieldName: string) => {
    setWizardData(prev => {
      const existing = prev.selectedFields.find(f => f.fieldName === fieldName);
      if (existing) {
        return {
          ...prev,
          selectedFields: prev.selectedFields.filter(f => f.fieldName !== fieldName),
        };
      } else {
        const field = selectedDataSourceFields.find(f => f.name === fieldName);
        return {
          ...prev,
          selectedFields: [
            ...prev.selectedFields,
            {
              fieldName,
              label: field?.label || fieldName,
              sortOrder: prev.selectedFields.length,
              visible: true,
            },
          ],
        };
      }
    });
  }, [selectedDataSourceFields]);

  const moveField = useCallback((index: number, direction: 'up' | 'down') => {
    setWizardData(prev => {
      const newFields = [...prev.selectedFields];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= newFields.length) return prev;
      
      [newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]];
      return { ...prev, selectedFields: newFields.map((f, i) => ({ ...f, sortOrder: i })) };
    });
  }, []);

  const isStepValid = useCallback((step: number): boolean => {
    switch (step) {
      case 1:
        return wizardData.name.trim().length > 0 && wizardData.dataSource.length > 0;
      case 2:
        return true; // Tipo sempre tem valor padrão
      case 3:
        return wizardData.selectedFields.length > 0;
      case 4:
        return wizardData.title.trim().length > 0;
      default:
        return false;
    }
  }, [wizardData]);

  const handleNext = () => {
    if (isStepValid(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleComplete = () => {
    if (!isStepValid(4)) return;

    // Gerar definição do relatório
    const definition: ReportDefinition = {
      version: '1.0',
      pageSize: wizardData.pageSize,
      orientation: wizardData.orientation,
      margins: { top: 20, right: 15, bottom: 20, left: 15 },
      bands: {
        reportHeader: { id: 'reportHeader', height: 60, backgroundColor: '#ffffff' },
        pageHeader: { id: 'pageHeader', height: 40, backgroundColor: '#f8fafc' },
        detail: { id: 'detail', height: 30 },
        pageFooter: { id: 'pageFooter', height: 30, backgroundColor: '#f8fafc' },
      },
      elements: generateInitialElements(wizardData),
      groupings: wizardData.groupings,
      sorting: [{ field: wizardData.selectedFields[0]?.fieldName || 'id', direction: 'asc' }],
    };

    onComplete(definition, {
      name: wizardData.name,
      description: wizardData.description,
      dataSource: wizardData.dataSource,
      type: wizardData.reportType,
    });

    // Reset wizard
    setWizardData(INITIAL_WIZARD_DATA);
    setCurrentStep(1);
    onClose();
  };

  const handleClose = () => {
    setWizardData(INITIAL_WIZARD_DATA);
    setCurrentStep(1);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col" data-ai-id="report-wizard-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Criar Novo Relatório
          </DialogTitle>
          <DialogDescription>
            Siga os passos para criar um relatório personalizado
          </DialogDescription>
        </DialogHeader>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Passo {currentStep} de 4</span>
            <span>{Math.round((currentStep / 4) * 100)}%</span>
          </div>
          <Progress value={(currentStep / 4) * 100} className="h-2" />
          <div className="flex justify-between text-xs">
            <span className={cn(currentStep >= 1 ? 'text-primary font-medium' : 'text-muted-foreground')}>
              Informações
            </span>
            <span className={cn(currentStep >= 2 ? 'text-primary font-medium' : 'text-muted-foreground')}>
              Layout
            </span>
            <span className={cn(currentStep >= 3 ? 'text-primary font-medium' : 'text-muted-foreground')}>
              Campos
            </span>
            <span className={cn(currentStep >= 4 ? 'text-primary font-medium' : 'text-muted-foreground')}>
              Tema
            </span>
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="flex-grow pr-4 -mr-4">
          <div className="pr-4">
            {/* Step 1: Informações Básicas */}
            {currentStep === 1 && (
              <div className="space-y-6 py-4" data-ai-id="wizard-step-1">
                <div className="space-y-2">
                  <Label htmlFor="report-name" className="text-sm font-medium">
                    Nome do Relatório <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="report-name"
                    placeholder="Ex: Lista de Funcionários"
                    value={wizardData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    data-ai-id="report-name-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="report-description" className="text-sm font-medium">
                    Descrição
                  </Label>
                  <Textarea
                    id="report-description"
                    placeholder="Descreva o propósito deste relatório..."
                    value={wizardData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="data-source" className="text-sm font-medium">
                    Fonte de Dados <span className="text-destructive">*</span>
                  </Label>
                  {isLoading ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Carregando fontes de dados...</span>
                    </div>
                  ) : (
                    <Select
                      value={wizardData.dataSource}
                      onValueChange={(value) => handleChange('dataSource', value)}
                    >
                      <SelectTrigger data-ai-id="report-datasource-select">
                        <SelectValue placeholder="Selecione a entidade de origem" />
                      </SelectTrigger>
                      <SelectContent>
                        {dataSources.map((source) => (
                          <SelectItem key={source.modelName} value={source.modelName}>
                            {source.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {wizardData.dataSource && (
                    <p className="text-xs text-muted-foreground">
                      {selectedDataSourceFields.length} campos disponíveis nesta entidade
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Tipo de Layout */}
            {currentStep === 2 && (
              <div className="space-y-4 py-4" data-ai-id="wizard-step-2">
                <p className="text-sm text-muted-foreground">
                  Escolha o tipo de layout mais adequado para seus dados:
                </p>
                <RadioGroup
                  value={wizardData.reportType}
                  onValueChange={(value) => handleChange('reportType', value as ReportType)}
                  className="grid grid-cols-2 gap-4"
                >
                  {(Object.keys(REPORT_TYPE_LABELS) as ReportType[]).map((type) => {
                    const Icon = REPORT_TYPE_ICONS[type];
                    return (
                      <Label
                        key={type}
                        htmlFor={`type-${type}`}
                        className={cn(
                          'flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-all',
                          wizardData.reportType === type
                            ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                            : 'hover:border-muted-foreground/50'
                        )}
                        data-ai-id={`layout-type-${type.toLowerCase()}`}
                      >
                        <RadioGroupItem value={type} id={`type-${type}`} className="mt-1" />
                        <div className="flex-grow">
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-primary" />
                            <span className="font-medium">{REPORT_TYPE_LABELS[type]}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {REPORT_TYPE_DESCRIPTIONS[type]}
                          </p>
                        </div>
                      </Label>
                    );
                  })}
                </RadioGroup>
              </div>
            )}

            {/* Step 3: Seleção de Campos */}
            {currentStep === 3 && (
              <div className="space-y-4 py-4" data-ai-id="wizard-step-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Campos Disponíveis</p>
                    <p className="text-xs text-muted-foreground">
                      Selecione os campos que deseja incluir no relatório
                    </p>
                  </div>
                  <Badge variant="secondary">
                    {wizardData.selectedFields.length} selecionado(s)
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Campos disponíveis */}
                  <Card>
                    <CardContent className="p-3">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Disponíveis</p>
                      <ScrollArea className="h-48">
                        <div className="space-y-1">
                          {selectedDataSourceFields.map((field) => {
                            const isSelected = wizardData.selectedFields.some(f => f.fieldName === field.name);
                            return (
                              <div
                                key={field.name}
                                onClick={() => toggleField(field.name)}
                                className={cn(
                                  'flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors',
                                  isSelected
                                    ? 'bg-primary/10 text-primary'
                                    : 'hover:bg-muted'
                                )}
                              >
                                <Checkbox checked={isSelected} />
                                <div className="flex-grow">
                                  <span className="text-sm">{field.label || field.name}</span>
                                  <span className="text-xs text-muted-foreground ml-2">({field.type})</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>

                  {/* Campos selecionados (ordenáveis) */}
                  <Card>
                    <CardContent className="p-3">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Ordem das Colunas</p>
                      <ScrollArea className="h-48">
                        <div className="space-y-1">
                          {wizardData.selectedFields.map((field, index) => (
                            <div
                              key={field.fieldName}
                              className="flex items-center gap-2 p-2 bg-muted/50 rounded-md"
                            >
                              <GripVertical className="h-4 w-4 text-muted-foreground" />
                              <span className="flex-grow text-sm">{field.label}</span>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => moveField(index, 'up')}
                                  disabled={index === 0}
                                >
                                  <ArrowUpDown className="h-3 w-3 rotate-180" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => moveField(index, 'down')}
                                  disabled={index === wizardData.selectedFields.length - 1}
                                >
                                  <ArrowUpDown className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                          {wizardData.selectedFields.length === 0 && (
                            <p className="text-xs text-muted-foreground text-center py-4">
                              Nenhum campo selecionado
                            </p>
                          )}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Step 4: Tema e Cabeçalho */}
            {currentStep === 4 && (
              <div className="space-y-6 py-4" data-ai-id="wizard-step-4">
                <div className="space-y-2">
                  <Label htmlFor="report-title" className="text-sm font-medium">
                    Título do Relatório <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="report-title"
                    placeholder="Título que aparecerá no cabeçalho"
                    value={wizardData.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Esquema de Cores</Label>
                  <div className="grid grid-cols-5 gap-3">
                    {THEMES.map((theme) => (
                      <button
                        key={theme.id}
                        onClick={() => handleChange('theme', theme.id)}
                        className={cn(
                          'flex flex-col items-center gap-2 p-3 rounded-lg border transition-all',
                          wizardData.theme === theme.id
                            ? 'border-primary ring-2 ring-primary/20'
                            : 'hover:border-muted-foreground/50'
                        )}
                      >
                        <div className={cn('w-8 h-8 rounded-md', theme.previewBg)} />
                        <span className="text-xs">{theme.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Tamanho da Página</Label>
                    <Select
                      value={wizardData.pageSize}
                      onValueChange={(value: 'A4' | 'Letter' | 'Legal') => handleChange('pageSize', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A4">A4 (210 × 297 mm)</SelectItem>
                        <SelectItem value="Letter">Carta (216 × 279 mm)</SelectItem>
                        <SelectItem value="Legal">Ofício (216 × 356 mm)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Orientação</Label>
                    <Select
                      value={wizardData.orientation}
                      onValueChange={(value: 'portrait' | 'landscape') => handleChange('orientation', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="portrait">Retrato (Vertical)</SelectItem>
                        <SelectItem value="landscape">Paisagem (Horizontal)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Preview mini */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Prévia</Label>
                  <Card className="overflow-hidden">
                    <div 
                      className={cn(
                        'p-4 text-center',
                        THEMES.find(t => t.id === wizardData.theme)?.previewBg || 'bg-primary'
                      )}
                    >
                      <p className="text-white font-semibold">{wizardData.title || 'Título do Relatório'}</p>
                    </div>
                    <CardContent className="p-3">
                      <div className="border rounded-md overflow-hidden">
                        <div className="bg-muted px-2 py-1 border-b flex gap-2">
                          {wizardData.selectedFields.slice(0, 4).map(f => (
                            <span key={f.fieldName} className="text-xs font-medium flex-1 truncate">
                              {f.label}
                            </span>
                          ))}
                        </div>
                        <div className="px-2 py-1 flex gap-2 text-xs text-muted-foreground">
                          {wizardData.selectedFields.slice(0, 4).map(f => (
                            <span key={f.fieldName} className="flex-1">dados...</span>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
            data-ai-id="wizard-back-button"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Voltar
          </Button>

          <div className="flex gap-2">
            <Button variant="ghost" onClick={handleClose}>
              Cancelar
            </Button>
            {currentStep < 4 ? (
              <Button
                onClick={handleNext}
                disabled={!isStepValid(currentStep)}
                data-ai-id="wizard-next-button"
              >
                Próximo
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                disabled={!isStepValid(4)}
                data-ai-id="wizard-complete-button"
              >
                <Check className="h-4 w-4 mr-1" />
                Criar Relatório
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// HELPERS
// ============================================================================

function generateInitialElements(data: WizardData): ReportElement[] {
  const elements: ReportElement[] = [];

  // Título do relatório
  elements.push({
    id: 'title-1',
    type: 'text',
    bandId: 'reportHeader',
    position: { x: 0, y: 10 },
    size: { width: 400, height: 30 },
    properties: {
      content: data.title,
      font: { family: 'Inter', size: 18, weight: 'bold', color: '#1e293b' },
      textAlign: 'center',
    },
  });

  // Colunas da tabela
  if (data.reportType === 'TABLE' && data.selectedFields.length > 0) {
    const columnWidth = Math.floor(600 / data.selectedFields.length);
    
    elements.push({
      id: 'table-1',
      type: 'table',
      bandId: 'detail',
      position: { x: 0, y: 0 },
      size: { width: 600, height: 200 },
      properties: {
        tableConfig: {
          columns: data.selectedFields.map((field, index) => ({
            id: `col-${index}`,
            fieldBinding: field.fieldName,
            header: field.label,
            width: columnWidth,
            alignment: 'left',
            visible: field.visible,
          })),
          showHeader: true,
          alternateRowColors: true,
          alternateRowColor: '#f8fafc',
          headerStyle: { weight: 'bold', color: '#1e293b' },
        },
      },
    });
  }

  // Número de página no rodapé
  elements.push({
    id: 'page-number',
    type: 'text',
    bandId: 'pageFooter',
    position: { x: 250, y: 5 },
    size: { width: 100, height: 20 },
    properties: {
      content: 'Página {{pageNumber}} de {{totalPages}}',
      font: { family: 'Inter', size: 10, color: '#64748b' },
      textAlign: 'center',
    },
  });

  return elements;
}
