/**
 * @file src/components/lots/livestock-health/index.tsx
 * @description Componente de exibição de registros de saúde para semoventes (gado, cavalos, etc).
 * Mostra histórico de vacinação, atestados sanitários e condição atual.
 * 
 * Gap 5.1 - Atestado de sanidade e histórico de vacinação
 */

"use client";

import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  Heart, 
  Syringe, 
  FileCheck, 
  Calendar, 
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Download,
  Shield,
  Activity,
  Scale,
  Stethoscope
} from "lucide-react";

// ============================================================================
// Types
// ============================================================================

export type VaccinationStatus = "completed" | "scheduled" | "overdue" | "not_required";

export interface Vaccination {
  id: string;
  vaccineName: string;
  disease: string;
  applicationDate: Date;
  nextDoseDate?: Date;
  batchNumber?: string;
  appliedBy?: string;
  status: VaccinationStatus;
  documentUrl?: string;
}

export interface HealthCertificate {
  id: string;
  certificateType: string;
  issueDate: Date;
  expiryDate?: Date;
  issuingAuthority: string;
  certificateNumber: string;
  isValid: boolean;
  documentUrl?: string;
}

export interface HealthMetric {
  metricName: string;
  value: number | string;
  unit?: string;
  normalRange?: { min: number; max: number };
  measuredAt: Date;
  status: "normal" | "warning" | "critical";
}

export interface LivestockHealthData {
  assetId: string;
  animalType: string;
  breed?: string;
  age?: number;
  weight?: number;
  overallHealthStatus: "excellent" | "good" | "fair" | "poor" | "unknown";
  vaccinations: Vaccination[];
  healthCertificates: HealthCertificate[];
  healthMetrics?: HealthMetric[];
  veterinarianName?: string;
  lastExamDate?: Date;
  healthNotes?: string;
}

export interface LivestockHealthProps {
  healthData: LivestockHealthData | null;
  onDownloadCertificate?: (certId: string) => void;
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

const getDaysUntil = (date: Date): number => {
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const getHealthStatusConfig = (status: LivestockHealthData["overallHealthStatus"]) => {
  const configs: Record<string, { 
    variant: "default" | "destructive" | "secondary" | "outline"; 
    label: string; 
    icon: React.ReactNode;
    color: string;
  }> = {
    excellent: { 
      variant: "default", 
      label: "Excelente", 
      icon: <CheckCircle2 className="h-4 w-4" />,
      color: "text-green-600"
    },
    good: { 
      variant: "default", 
      label: "Bom", 
      icon: <CheckCircle2 className="h-4 w-4" />,
      color: "text-green-500"
    },
    fair: { 
      variant: "secondary", 
      label: "Regular", 
      icon: <Activity className="h-4 w-4" />,
      color: "text-yellow-500"
    },
    poor: { 
      variant: "destructive", 
      label: "Ruim", 
      icon: <AlertTriangle className="h-4 w-4" />,
      color: "text-red-500"
    },
    unknown: { 
      variant: "outline", 
      label: "Desconhecido", 
      icon: <Clock className="h-4 w-4" />,
      color: "text-muted-foreground"
    },
  };
  return configs[status];
};

const getVaccinationStatusConfig = (status: VaccinationStatus) => {
  const configs: Record<string, { 
    variant: "default" | "destructive" | "secondary" | "outline"; 
    label: string; 
    icon: React.ReactNode;
  }> = {
    completed: { variant: "default", label: "Aplicada", icon: <CheckCircle2 className="h-3 w-3" /> },
    scheduled: { variant: "secondary", label: "Agendada", icon: <Clock className="h-3 w-3" /> },
    overdue: { variant: "destructive", label: "Atrasada", icon: <AlertTriangle className="h-3 w-3" /> },
    not_required: { variant: "outline", label: "Não Requerida", icon: <XCircle className="h-3 w-3" /> },
  };
  return configs[status];
};

// ============================================================================
// Sub-components
// ============================================================================

interface VaccinationCardProps {
  vaccination: Vaccination;
}

const VaccinationCard: React.FC<VaccinationCardProps> = ({ vaccination }) => {
  const statusConfig = getVaccinationStatusConfig(vaccination.status);
  const daysUntilNext = vaccination.nextDoseDate ? getDaysUntil(vaccination.nextDoseDate) : null;
  const isNextDoseSoon = daysUntilNext !== null && daysUntilNext > 0 && daysUntilNext <= 30;

  return (
    <div className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <Syringe className="h-4 w-4 text-primary" />
          <div>
            <span className="font-medium text-sm">{vaccination.vaccineName}</span>
            <p className="text-xs text-muted-foreground">{vaccination.disease}</p>
          </div>
        </div>
        <Badge variant={statusConfig.variant} className="gap-1">
          {statusConfig.icon}
          {statusConfig.label}
        </Badge>
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          Aplicada: {formatDate(vaccination.applicationDate)}
        </div>
        {vaccination.nextDoseDate && (
          <div className={`flex items-center gap-1 ${isNextDoseSoon ? "text-yellow-600" : ""}`}>
            <Clock className="h-3 w-3" />
            Próxima: {formatDate(vaccination.nextDoseDate)}
          </div>
        )}
        {vaccination.batchNumber && (
          <div>Lote: {vaccination.batchNumber}</div>
        )}
        {vaccination.appliedBy && (
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            {vaccination.appliedBy}
          </div>
        )}
      </div>

      {isNextDoseSoon && (
        <Alert className="mt-2 py-1">
          <AlertTriangle className="h-3 w-3" />
          <AlertDescription className="text-xs">
            Próxima dose em {daysUntilNext} dias
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

interface HealthCertificateCardProps {
  certificate: HealthCertificate;
  onDownload?: () => void;
}

const HealthCertificateCard: React.FC<HealthCertificateCardProps> = ({ certificate, onDownload }) => {
  const daysUntilExpiry = certificate.expiryDate ? getDaysUntil(certificate.expiryDate) : null;
  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry > 0 && daysUntilExpiry <= 30;
  const isExpired = daysUntilExpiry !== null && daysUntilExpiry <= 0;

  return (
    <div className={`p-3 rounded-lg border ${
      !certificate.isValid || isExpired 
        ? "bg-red-500/10 border-red-500/30" 
        : isExpiringSoon 
          ? "bg-yellow-500/10 border-yellow-500/30"
          : "bg-green-500/10 border-green-500/30"
    }`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <FileCheck className="h-4 w-4 text-primary" />
          <div>
            <span className="font-medium text-sm">{certificate.certificateType}</span>
            <p className="text-xs text-muted-foreground font-mono">{certificate.certificateNumber}</p>
          </div>
        </div>
        <Badge variant={certificate.isValid && !isExpired ? "default" : "destructive"} className="gap-1">
          {certificate.isValid && !isExpired ? (
            <><CheckCircle2 className="h-3 w-3" /> Válido</>
          ) : (
            <><XCircle className="h-3 w-3" /> Inválido</>
          )}
        </Badge>
      </div>

      <div className="text-xs text-muted-foreground mb-2">
        <div>Emitido por: {certificate.issuingAuthority}</div>
        <div className="flex items-center gap-4 mt-1">
          <span>Emissão: {formatDate(certificate.issueDate)}</span>
          {certificate.expiryDate && (
            <span className={isExpired ? "text-red-600" : isExpiringSoon ? "text-yellow-600" : ""}>
              Validade: {formatDate(certificate.expiryDate)}
            </span>
          )}
        </div>
      </div>

      {isExpiringSoon && !isExpired && (
        <Alert className="mb-2 py-1">
          <AlertTriangle className="h-3 w-3" />
          <AlertDescription className="text-xs">
            Expira em {daysUntilExpiry} dias
          </AlertDescription>
        </Alert>
      )}

      {certificate.documentUrl && (
        <Button variant="outline" size="sm" className="w-full" onClick={onDownload}>
          <Download className="h-3 w-3 mr-2" />
          Baixar Atestado
        </Button>
      )}
    </div>
  );
};

interface HealthMetricItemProps {
  metric: HealthMetric;
}

const HealthMetricItem: React.FC<HealthMetricItemProps> = ({ metric }) => {
  const getStatusColor = (status: HealthMetric["status"]) => {
    const colors = {
      normal: "text-green-600",
      warning: "text-yellow-600",
      critical: "text-red-600",
    };
    return colors[status];
  };

  return (
    <div className="flex items-center justify-between p-2 rounded bg-muted/30">
      <span className="text-sm text-muted-foreground">{metric.metricName}</span>
      <div className="text-right">
        <span className={`font-bold ${getStatusColor(metric.status)}`}>
          {metric.value}
          {metric.unit && <span className="text-xs ml-1">{metric.unit}</span>}
        </span>
        {metric.normalRange && (
          <div className="text-[10px] text-muted-foreground">
            Normal: {metric.normalRange.min}-{metric.normalRange.max}
          </div>
        )}
      </div>
    </div>
  );
};

interface VaccinationSummaryProps {
  vaccinations: Vaccination[];
}

const VaccinationSummary: React.FC<VaccinationSummaryProps> = ({ vaccinations }) => {
  const summary = useMemo(() => {
    return {
      total: vaccinations.length,
      completed: vaccinations.filter((v) => v.status === "completed").length,
      overdue: vaccinations.filter((v) => v.status === "overdue").length,
      scheduled: vaccinations.filter((v) => v.status === "scheduled").length,
    };
  }, [vaccinations]);

  const completionRate = summary.total > 0 
    ? Math.round((summary.completed / summary.total) * 100) 
    : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Taxa de Vacinação</span>
        <span className="font-bold text-primary">{completionRate}%</span>
      </div>
      <Progress value={completionRate} className="h-2" />
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="p-2 rounded bg-green-500/10">
          <div className="font-bold text-green-600">{summary.completed}</div>
          <div className="text-muted-foreground">Aplicadas</div>
        </div>
        <div className="p-2 rounded bg-yellow-500/10">
          <div className="font-bold text-yellow-600">{summary.scheduled}</div>
          <div className="text-muted-foreground">Agendadas</div>
        </div>
        <div className="p-2 rounded bg-red-500/10">
          <div className="font-bold text-red-600">{summary.overdue}</div>
          <div className="text-muted-foreground">Atrasadas</div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

/**
 * LivestockHealth - Exibe informações de saúde de semoventes
 * 
 * Funcionalidades:
 * - Status geral de saúde com indicador visual
 * - Histórico de vacinação com próximas doses
 * - Atestados sanitários com validade
 * - Métricas de saúde (peso, temperatura, etc.)
 * - Alertas para vacinas atrasadas ou certificados expirando
 * - Download de documentos
 */
export const LivestockHealth: React.FC<LivestockHealthProps> = ({
  healthData,
  onDownloadCertificate,
  className = "",
}) => {
  if (!healthData) {
    return (
      <Card className={className}>
        <CardContent className="py-8 text-center">
          <Heart className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-muted-foreground">
            Informações de saúde não disponíveis.
          </p>
        </CardContent>
      </Card>
    );
  }

  const healthStatusConfig = getHealthStatusConfig(healthData.overallHealthStatus);
  const overdueVaccines = healthData.vaccinations.filter((v) => v.status === "overdue");
  const invalidCertificates = healthData.healthCertificates.filter((c) => !c.isValid);

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              Saúde do Animal
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {healthData.animalType}
              {healthData.breed && ` • ${healthData.breed}`}
              {healthData.age && ` • ${healthData.age} ${healthData.age === 1 ? "ano" : "anos"}`}
            </p>
          </div>
          <Badge variant={healthStatusConfig.variant} className="gap-1">
            {healthStatusConfig.icon}
            {healthStatusConfig.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Alerts */}
        {(overdueVaccines.length > 0 || invalidCertificates.length > 0) && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {overdueVaccines.length > 0 && (
                <div>{overdueVaccines.length} vacina(s) atrasada(s)</div>
              )}
              {invalidCertificates.length > 0 && (
                <div>{invalidCertificates.length} atestado(s) inválido(s)</div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Basic info */}
        <div className="grid grid-cols-3 gap-3 p-3 rounded-lg bg-muted/30">
          {healthData.weight && (
            <div className="text-center">
              <Scale className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
              <div className="font-bold">{healthData.weight} kg</div>
              <div className="text-xs text-muted-foreground">Peso</div>
            </div>
          )}
          {healthData.lastExamDate && (
            <div className="text-center">
              <Stethoscope className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
              <div className="font-bold text-sm">{formatDate(healthData.lastExamDate)}</div>
              <div className="text-xs text-muted-foreground">Último Exame</div>
            </div>
          )}
          {healthData.veterinarianName && (
            <div className="text-center">
              <User className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
              <div className="font-bold text-sm truncate">{healthData.veterinarianName}</div>
              <div className="text-xs text-muted-foreground">Veterinário</div>
            </div>
          )}
        </div>

        {/* Health Metrics */}
        {healthData.healthMetrics && healthData.healthMetrics.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Métricas de Saúde
            </h4>
            <div className="space-y-2">
              {healthData.healthMetrics.map((metric, idx) => (
                <HealthMetricItem key={`${metric.metricName}-${idx}`} metric={metric} />
              ))}
            </div>
          </div>
        )}

        {/* Vaccinations */}
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
            <Syringe className="h-4 w-4" />
            Vacinação ({healthData.vaccinations.length})
          </h4>
          {healthData.vaccinations.length > 0 ? (
            <>
              <VaccinationSummary vaccinations={healthData.vaccinations} />
              <div className="space-y-2 mt-3">
                {healthData.vaccinations.map((vaccination) => (
                  <VaccinationCard key={vaccination.id} vaccination={vaccination} />
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum registro de vacinação.
            </p>
          )}
        </div>

        {/* Health Certificates */}
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Atestados Sanitários ({healthData.healthCertificates.length})
          </h4>
          {healthData.healthCertificates.length > 0 ? (
            <div className="space-y-2">
              {healthData.healthCertificates.map((cert) => (
                <HealthCertificateCard
                  key={cert.id}
                  certificate={cert}
                  onDownload={() => onDownloadCertificate?.(cert.id)}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum atestado sanitário registrado.
            </p>
          )}
        </div>

        {/* Health Notes */}
        {healthData.healthNotes && (
          <div className="p-3 rounded-lg border bg-muted/20">
            <h4 className="text-sm font-semibold mb-2">Observações</h4>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {healthData.healthNotes}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LivestockHealth;
