/**
 * @file src/components/lots/machinery-inspection/index.tsx
 * @description Componente de exibição de inspeção técnica para máquinas e equipamentos.
 * Mostra checklist de itens inspecionados, fotos e status geral do equipamento.
 * 
 * Gap 4.1 - Laudo técnico com checklist para máquinas
 */

"use client";

import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  Wrench, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Camera, 
  FileText,
  Calendar,
  User,
  Clock,
  Gauge,
  Cog,
  Zap,
  Droplet,
  ThermometerSun,
  Shield
} from "lucide-react";

// ============================================================================
// Types
// ============================================================================

export type InspectionItemStatus = "passed" | "failed" | "warning" | "not_inspected";

export interface InspectionItem {
  id: string;
  category: string;
  itemName: string;
  status: InspectionItemStatus;
  notes?: string;
  photoUrls?: string[];
  severity?: "critical" | "major" | "minor";
}

export interface InspectorInfo {
  name: string;
  company?: string;
  certificationNumber?: string;
  signatureUrl?: string;
}

export interface MachineryInspectionData {
  inspectionId: string;
  assetId: string;
  inspectionDate: Date;
  inspector: InspectorInfo;
  overallStatus: "approved" | "conditionally_approved" | "rejected" | "pending";
  hoursOfOperation?: number;
  items: InspectionItem[];
  generalNotes?: string;
  reportUrl?: string;
  validUntil?: Date;
}

export interface MachineryInspectionProps {
  inspection: MachineryInspectionData | null;
  onViewReport?: () => void;
  className?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

const getStatusIcon = (status: InspectionItemStatus) => {
  const icons = {
    passed: <CheckCircle2 className="h-4 w-4 text-green-500" />,
    failed: <XCircle className="h-4 w-4 text-red-500" />,
    warning: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
    not_inspected: <Clock className="h-4 w-4 text-muted-foreground" />,
  };
  return icons[status];
};

const getStatusLabel = (status: InspectionItemStatus): string => {
  const labels = {
    passed: "Aprovado",
    failed: "Reprovado",
    warning: "Atenção",
    not_inspected: "Não Inspecionado",
  };
  return labels[status];
};

const getOverallStatusBadge = (status: MachineryInspectionData["overallStatus"]) => {
  const config: Record<string, { variant: "default" | "destructive" | "secondary" | "outline"; label: string; icon: React.ReactNode }> = {
    approved: { variant: "default", label: "Aprovado", icon: <CheckCircle2 className="h-3 w-3" /> },
    conditionally_approved: { variant: "secondary", label: "Aprovado com Ressalvas", icon: <AlertTriangle className="h-3 w-3" /> },
    rejected: { variant: "destructive", label: "Reprovado", icon: <XCircle className="h-3 w-3" /> },
    pending: { variant: "outline", label: "Pendente", icon: <Clock className="h-3 w-3" /> },
  };
  return config[status];
};

const getCategoryIcon = (category: string) => {
  const icons: Record<string, React.ReactNode> = {
    "Motor": <Cog className="h-4 w-4" />,
    "Sistema Elétrico": <Zap className="h-4 w-4" />,
    "Sistema Hidráulico": <Droplet className="h-4 w-4" />,
    "Sistema de Refrigeração": <ThermometerSun className="h-4 w-4" />,
    "Segurança": <Shield className="h-4 w-4" />,
    "Instrumentação": <Gauge className="h-4 w-4" />,
  };
  return icons[category] || <Wrench className="h-4 w-4" />;
};

// ============================================================================
// Sub-components
// ============================================================================

interface InspectionSummaryProps {
  items: InspectionItem[];
}

const InspectionSummary: React.FC<InspectionSummaryProps> = ({ items }) => {
  const summary = useMemo(() => {
    const counts = {
      passed: items.filter((i) => i.status === "passed").length,
      failed: items.filter((i) => i.status === "failed").length,
      warning: items.filter((i) => i.status === "warning").length,
      not_inspected: items.filter((i) => i.status === "not_inspected").length,
    };
    const total = items.length;
    const passRate = total > 0 ? Math.round((counts.passed / total) * 100) : 0;
    return { ...counts, total, passRate };
  }, [items]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Taxa de Aprovação</span>
        <span className="text-2xl font-bold text-primary">{summary.passRate}%</span>
      </div>
      <Progress 
        value={summary.passRate} 
        className="h-3"
      />
      <div className="grid grid-cols-4 gap-2 text-center">
        <div className="p-2 rounded bg-green-500/10">
          <div className="text-lg font-bold text-green-600">{summary.passed}</div>
          <div className="text-[10px] text-muted-foreground">Aprovados</div>
        </div>
        <div className="p-2 rounded bg-red-500/10">
          <div className="text-lg font-bold text-red-600">{summary.failed}</div>
          <div className="text-[10px] text-muted-foreground">Reprovados</div>
        </div>
        <div className="p-2 rounded bg-yellow-500/10">
          <div className="text-lg font-bold text-yellow-600">{summary.warning}</div>
          <div className="text-[10px] text-muted-foreground">Atenção</div>
        </div>
        <div className="p-2 rounded bg-muted">
          <div className="text-lg font-bold text-muted-foreground">{summary.not_inspected}</div>
          <div className="text-[10px] text-muted-foreground">Pendentes</div>
        </div>
      </div>
    </div>
  );
};

interface InspectionItemRowProps {
  item: InspectionItem;
}

const InspectionItemRow: React.FC<InspectionItemRowProps> = ({ item }) => {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
      <div className="mt-0.5">{getStatusIcon(item.status)}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{item.itemName}</span>
          {item.severity && item.status === "failed" && (
            <Badge 
              variant={item.severity === "critical" ? "destructive" : item.severity === "major" ? "secondary" : "outline"}
              className="text-[10px]"
            >
              {item.severity === "critical" ? "Crítico" : item.severity === "major" ? "Maior" : "Menor"}
            </Badge>
          )}
        </div>
        {item.notes && (
          <p className="text-xs text-muted-foreground mt-1">{item.notes}</p>
        )}
        {item.photoUrls && item.photoUrls.length > 0 && (
          <div className="flex items-center gap-1 mt-2">
            <Camera className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-primary">{item.photoUrls.length} foto(s)</span>
          </div>
        )}
      </div>
      <Badge variant="outline" className="shrink-0">
        {getStatusLabel(item.status)}
      </Badge>
    </div>
  );
};

interface InspectionCategoryGroupProps {
  category: string;
  items: InspectionItem[];
}

const InspectionCategoryGroup: React.FC<InspectionCategoryGroupProps> = ({ category, items }) => {
  const categoryStats = useMemo(() => {
    const passed = items.filter((i) => i.status === "passed").length;
    const failed = items.filter((i) => i.status === "failed").length;
    return { passed, failed, total: items.length };
  }, [items]);

  return (
    <AccordionItem value={category}>
      <AccordionTrigger className="hover:no-underline">
        <div className="flex items-center gap-3 flex-1">
          <div className="p-2 rounded-md bg-primary/10">
            {getCategoryIcon(category)}
          </div>
          <div className="flex-1 text-left">
            <div className="font-medium">{category}</div>
            <div className="text-xs text-muted-foreground">
              {categoryStats.passed}/{categoryStats.total} aprovados
              {categoryStats.failed > 0 && (
                <span className="text-red-500 ml-2">• {categoryStats.failed} reprovados</span>
              )}
            </div>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-2 pt-2">
          {items.map((item) => (
            <InspectionItemRow key={item.id} item={item} />
          ))}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

// ============================================================================
// Main Component
// ============================================================================

/**
 * MachineryInspection - Exibe laudo técnico de inspeção de máquinas
 * 
 * Funcionalidades:
 * - Resumo visual com taxa de aprovação
 * - Checklist agrupado por categoria (motor, elétrico, hidráulico, etc.)
 * - Status por item com indicadores visuais
 * - Severidade de problemas (crítico, maior, menor)
 * - Links para fotos de inspeção
 * - Informações do inspetor
 * - Download do laudo completo
 */
export const MachineryInspection: React.FC<MachineryInspectionProps> = ({
  inspection,
  onViewReport,
  className = "",
}) => {
  // Group items by category
  const itemsByCategory = useMemo(() => {
    if (!inspection) return {};
    return inspection.items.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, InspectionItem[]>);
  }, [inspection]);

  if (!inspection) {
    return (
      <Card className={className}>
        <CardContent className="py-8 text-center">
          <Wrench className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-muted-foreground">
            Laudo de inspeção técnica não disponível.
          </p>
        </CardContent>
      </Card>
    );
  }

  const overallConfig = getOverallStatusBadge(inspection.overallStatus);

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Wrench className="h-5 w-5 text-primary" />
              Inspeção Técnica
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              ID: {inspection.inspectionId}
            </p>
          </div>
          <Badge variant={overallConfig.variant} className="gap-1">
            {overallConfig.icon}
            {overallConfig.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Inspection metadata */}
        <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-muted/30">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-xs text-muted-foreground">Data da Inspeção</div>
              <div className="font-medium text-sm">{formatDate(inspection.inspectionDate)}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-xs text-muted-foreground">Inspetor</div>
              <div className="font-medium text-sm">{inspection.inspector.name}</div>
              {inspection.inspector.company && (
                <div className="text-xs text-muted-foreground">{inspection.inspector.company}</div>
              )}
            </div>
          </div>
          {inspection.hoursOfOperation !== undefined && (
            <div className="flex items-center gap-2">
              <Gauge className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-xs text-muted-foreground">Horas de Operação</div>
                <div className="font-medium text-sm">{inspection.hoursOfOperation.toLocaleString("pt-BR")} h</div>
              </div>
            </div>
          )}
          {inspection.validUntil && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-xs text-muted-foreground">Válido até</div>
                <div className="font-medium text-sm">{formatDate(inspection.validUntil)}</div>
              </div>
            </div>
          )}
        </div>

        {/* Summary */}
        <InspectionSummary items={inspection.items} />

        {/* Items by category */}
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground mb-3">
            Itens Inspecionados
          </h4>
          <Accordion type="multiple" className="space-y-2">
            {Object.entries(itemsByCategory).map(([category, items]) => (
              <InspectionCategoryGroup
                key={category}
                category={category}
                items={items}
              />
            ))}
          </Accordion>
        </div>

        {/* General notes */}
        {inspection.generalNotes && (
          <div className="p-4 rounded-lg border bg-muted/20">
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Observações Gerais
            </h4>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {inspection.generalNotes}
            </p>
          </div>
        )}

        {/* Report download */}
        {inspection.reportUrl && (
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={onViewReport}
          >
            <FileText className="h-4 w-4 mr-2" />
            Baixar Laudo Completo (PDF)
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default MachineryInspection;
