/**
 * @file src/components/lots/machinery-certifications/index.tsx
 * @description Componente de exibição de certificações e documentação de máquinas.
 * Mostra certificados de origem, garantias e documentos regulatórios.
 * 
 * Gap 4.2 - Certificações e garantia para máquinas
 */

"use client";

import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  Award, 
  FileCheck, 
  Calendar, 
  Shield, 
  Download,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Building,
  Globe,
  FileText
} from "lucide-react";

// ============================================================================
// Types
// ============================================================================

export type CertificationStatus = "valid" | "expired" | "pending" | "revoked";

export interface Certification {
  id: string;
  certificationType: string;
  certificationName: string;
  issuingBody: string;
  issuingBodyCountry?: string;
  certificateNumber?: string;
  issueDate: Date;
  expiryDate?: Date;
  status: CertificationStatus;
  documentUrl?: string;
  notes?: string;
}

export interface WarrantyInfo {
  hasWarranty: boolean;
  warrantyType?: "manufacturer" | "extended" | "third_party";
  warrantyProvider?: string;
  startDate?: Date;
  endDate?: Date;
  coverageDescription?: string;
  transferable?: boolean;
  documentUrl?: string;
}

export interface MachineryCertificationsData {
  assetId: string;
  certifications: Certification[];
  warranty?: WarrantyInfo;
  originCountry?: string;
  manufacturingYear?: number;
  importDocuments?: {
    hasImportLicense: boolean;
    customsClearanceDate?: Date;
    importerName?: string;
  };
}

export interface MachineryCertificationsProps {
  data: MachineryCertificationsData | null;
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

const getDaysUntilExpiry = (expiryDate: Date): number => {
  const now = new Date();
  const diffTime = expiryDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const getStatusConfig = (status: CertificationStatus) => {
  const configs: Record<string, { 
    variant: "default" | "destructive" | "secondary" | "outline"; 
    label: string; 
    icon: React.ReactNode;
    bgColor: string;
  }> = {
    valid: { 
      variant: "default", 
      label: "Válido", 
      icon: <CheckCircle2 className="h-3 w-3" />,
      bgColor: "bg-green-500/10"
    },
    expired: { 
      variant: "destructive", 
      label: "Expirado", 
      icon: <XCircle className="h-3 w-3" />,
      bgColor: "bg-red-500/10"
    },
    pending: { 
      variant: "secondary", 
      label: "Pendente", 
      icon: <Clock className="h-3 w-3" />,
      bgColor: "bg-yellow-500/10"
    },
    revoked: { 
      variant: "destructive", 
      label: "Revogado", 
      icon: <XCircle className="h-3 w-3" />,
      bgColor: "bg-red-500/10"
    },
  };
  return configs[status];
};

// ============================================================================
// Sub-components
// ============================================================================

interface CertificationCardProps {
  certification: Certification;
  onDownload?: () => void;
}

const CertificationCard: React.FC<CertificationCardProps> = ({ certification, onDownload }) => {
  const statusConfig = getStatusConfig(certification.status);
  const daysUntilExpiry = certification.expiryDate ? getDaysUntilExpiry(certification.expiryDate) : null;
  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry > 0 && daysUntilExpiry <= 90;

  return (
    <div className={`p-4 rounded-lg border ${statusConfig.bgColor} transition-colors hover:bg-opacity-50`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-background">
            <Award className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h4 className="font-semibold text-sm">{certification.certificationName}</h4>
            <p className="text-xs text-muted-foreground">{certification.certificationType}</p>
          </div>
        </div>
        <Badge variant={statusConfig.variant} className="gap-1">
          {statusConfig.icon}
          {statusConfig.label}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm mb-3">
        <div>
          <span className="text-muted-foreground text-xs">Emissor</span>
          <div className="flex items-center gap-1 font-medium">
            <Building className="h-3 w-3 text-muted-foreground" />
            {certification.issuingBody}
          </div>
          {certification.issuingBodyCountry && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Globe className="h-3 w-3" />
              {certification.issuingBodyCountry}
            </div>
          )}
        </div>
        {certification.certificateNumber && (
          <div>
            <span className="text-muted-foreground text-xs">Número</span>
            <div className="font-mono text-xs">{certification.certificateNumber}</div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          <span>Emitido: {formatDate(certification.issueDate)}</span>
        </div>
        {certification.expiryDate && (
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>Expira: {formatDate(certification.expiryDate)}</span>
          </div>
        )}
      </div>

      {isExpiringSoon && (
        <Alert className="mb-3 py-2">
          <AlertTriangle className="h-3 w-3" />
          <AlertDescription className="text-xs">
            Expira em {daysUntilExpiry} dias
          </AlertDescription>
        </Alert>
      )}

      {certification.notes && (
        <p className="text-xs text-muted-foreground mb-3 p-2 bg-background rounded">
          {certification.notes}
        </p>
      )}

      {certification.documentUrl && (
        <Button variant="outline" size="sm" className="w-full" onClick={onDownload}>
          <Download className="h-3 w-3 mr-2" />
          Baixar Certificado
        </Button>
      )}
    </div>
  );
};

interface WarrantyCardProps {
  warranty: WarrantyInfo;
}

const WarrantyCard: React.FC<WarrantyCardProps> = ({ warranty }) => {
  if (!warranty.hasWarranty) {
    return (
      <div className="p-4 rounded-lg border bg-muted/30">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Shield className="h-5 w-5" />
          <span className="font-medium">Sem Garantia</span>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Este equipamento não possui garantia ativa.
        </p>
      </div>
    );
  }

  const isExpired = warranty.endDate && new Date(warranty.endDate) < new Date();
  const daysRemaining = warranty.endDate ? getDaysUntilExpiry(warranty.endDate) : null;
  const warrantyProgress = warranty.startDate && warranty.endDate
    ? Math.min(100, Math.max(0, 
        ((new Date().getTime() - warranty.startDate.getTime()) / 
        (warranty.endDate.getTime() - warranty.startDate.getTime())) * 100
      ))
    : 0;

  const warrantyTypeLabels = {
    manufacturer: "Garantia de Fábrica",
    extended: "Garantia Estendida",
    third_party: "Garantia de Terceiros",
  };

  return (
    <div className={`p-4 rounded-lg border ${isExpired ? "bg-red-500/10" : "bg-green-500/10"}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-background">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h4 className="font-semibold text-sm">
              {warranty.warrantyType ? warrantyTypeLabels[warranty.warrantyType] : "Garantia"}
            </h4>
            {warranty.warrantyProvider && (
              <p className="text-xs text-muted-foreground">{warranty.warrantyProvider}</p>
            )}
          </div>
        </div>
        <Badge variant={isExpired ? "destructive" : "default"} className="gap-1">
          {isExpired ? (
            <><XCircle className="h-3 w-3" /> Expirada</>
          ) : (
            <><CheckCircle2 className="h-3 w-3" /> Ativa</>
          )}
        </Badge>
      </div>

      {warranty.startDate && warranty.endDate && (
        <div className="space-y-2 mb-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Período de Garantia</span>
            {daysRemaining !== null && daysRemaining > 0 && (
              <span className="text-green-600 font-medium">{daysRemaining} dias restantes</span>
            )}
          </div>
          <Progress value={100 - warrantyProgress} className="h-2" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{formatDate(warranty.startDate)}</span>
            <span>{formatDate(warranty.endDate)}</span>
          </div>
        </div>
      )}

      {warranty.coverageDescription && (
        <p className="text-xs text-muted-foreground mb-3 p-2 bg-background rounded">
          <strong>Cobertura:</strong> {warranty.coverageDescription}
        </p>
      )}

      <div className="flex items-center gap-4 text-xs">
        {warranty.transferable !== undefined && (
          <div className="flex items-center gap-1">
            {warranty.transferable ? (
              <><CheckCircle2 className="h-3 w-3 text-green-500" /> Transferível</>
            ) : (
              <><XCircle className="h-3 w-3 text-red-500" /> Não Transferível</>
            )}
          </div>
        )}
        {warranty.documentUrl && (
          <a 
            href={warranty.documentUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-primary hover:underline"
          >
            <FileText className="h-3 w-3" /> Ver Documento
          </a>
        )}
      </div>
    </div>
  );
};

interface CertificationSummaryProps {
  certifications: Certification[];
}

const CertificationSummary: React.FC<CertificationSummaryProps> = ({ certifications }) => {
  const summary = useMemo(() => {
    return {
      total: certifications.length,
      valid: certifications.filter((c) => c.status === "valid").length,
      expired: certifications.filter((c) => c.status === "expired").length,
      pending: certifications.filter((c) => c.status === "pending").length,
    };
  }, [certifications]);

  return (
    <div className="grid grid-cols-4 gap-2 text-center">
      <div className="p-3 rounded-lg bg-muted/50">
        <div className="text-2xl font-bold">{summary.total}</div>
        <div className="text-xs text-muted-foreground">Total</div>
      </div>
      <div className="p-3 rounded-lg bg-green-500/10">
        <div className="text-2xl font-bold text-green-600">{summary.valid}</div>
        <div className="text-xs text-muted-foreground">Válidos</div>
      </div>
      <div className="p-3 rounded-lg bg-red-500/10">
        <div className="text-2xl font-bold text-red-600">{summary.expired}</div>
        <div className="text-xs text-muted-foreground">Expirados</div>
      </div>
      <div className="p-3 rounded-lg bg-yellow-500/10">
        <div className="text-2xl font-bold text-yellow-600">{summary.pending}</div>
        <div className="text-xs text-muted-foreground">Pendentes</div>
      </div>
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

/**
 * MachineryCertifications - Exibe certificações e garantia de máquinas
 * 
 * Funcionalidades:
 * - Lista de certificações com status visual
 * - Alertas de expiração próxima
 * - Informações de garantia com progresso
 * - Download de documentos
 * - Indicador de transferibilidade
 * - País de origem e documentos de importação
 */
export const MachineryCertifications: React.FC<MachineryCertificationsProps> = ({
  data,
  onDownloadCertificate,
  className = "",
}) => {
  if (!data) {
    return (
      <Card className={className}>
        <CardContent className="py-8 text-center">
          <Award className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-muted-foreground">
            Informações de certificação não disponíveis.
          </p>
        </CardContent>
      </Card>
    );
  }

  const hasCertifications = data.certifications.length > 0;
  const hasWarranty = data.warranty !== undefined;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <FileCheck className="h-5 w-5 text-primary" />
          Certificações e Garantia
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Origin and manufacturing info */}
        {(data.originCountry || data.manufacturingYear) && (
          <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/30">
            {data.originCountry && (
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-xs text-muted-foreground">País de Origem</div>
                  <div className="font-medium text-sm">{data.originCountry}</div>
                </div>
              </div>
            )}
            {data.manufacturingYear && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-xs text-muted-foreground">Ano de Fabricação</div>
                  <div className="font-medium text-sm">{data.manufacturingYear}</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Import documents alert */}
        {data.importDocuments && (
          <Alert className={data.importDocuments.hasImportLicense ? "" : "border-destructive"}>
            {data.importDocuments.hasImportLicense ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            <AlertDescription className="text-sm">
              {data.importDocuments.hasImportLicense ? (
                <>
                  Licença de importação regularizada
                  {data.importDocuments.customsClearanceDate && (
                    <> • Desembaraço em {formatDate(data.importDocuments.customsClearanceDate)}</>
                  )}
                  {data.importDocuments.importerName && (
                    <> • {data.importDocuments.importerName}</>
                  )}
                </>
              ) : (
                "Licença de importação não verificada"
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Warranty section */}
        {hasWarranty && (
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-3">Garantia</h4>
            <WarrantyCard warranty={data.warranty!} />
          </div>
        )}

        {/* Certifications section */}
        {hasCertifications && (
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-3">Certificações</h4>
            <CertificationSummary certifications={data.certifications} />
            <div className="space-y-3 mt-4">
              {data.certifications.map((cert) => (
                <CertificationCard
                  key={cert.id}
                  certification={cert}
                  onDownload={() => onDownloadCertificate?.(cert.id)}
                />
              ))}
            </div>
          </div>
        )}

        {!hasCertifications && !hasWarranty && (
          <div className="text-center py-4 text-muted-foreground">
            <p className="text-sm">Nenhuma certificação ou garantia registrada.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MachineryCertifications;
