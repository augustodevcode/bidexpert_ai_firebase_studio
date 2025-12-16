/**
 * @fileoverview Card de informações jurídicas do lote
 * @description Exibe matrícula, ocupação e tipo de ação judicial
 * @module components/lots/legal-info/lot-legal-info-card
 */
'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  FileText, 
  Home, 
  Scale, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle,
  Users
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OccupationStatus, JudicialActionType, LotRisk } from '@/types';

// =============================================================================
// TYPES
// =============================================================================

interface LotLegalInfoCardProps {
  /** Número da matrícula do imóvel */
  propertyMatricula?: string | null;
  /** Número de registro do imóvel */
  propertyRegistrationNumber?: string | null;
  /** Status de ocupação */
  occupationStatus?: OccupationStatus | null;
  /** Notas sobre ocupação */
  occupationNotes?: string | null;
  /** Tipo de ação judicial */
  actionType?: JudicialActionType | null;
  /** Descrição da ação */
  actionDescription?: string | null;
  /** Código CNJ da ação */
  actionCnjCode?: string | null;
  /** Riscos identificados */
  risks?: LotRisk[];
  /** Classes adicionais */
  className?: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const OCCUPATION_STATUS_CONFIG: Record<OccupationStatus, {
  label: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}> = {
  OCCUPIED: {
    label: 'Ocupado',
    variant: 'destructive',
    icon: Users,
    description: 'O imóvel está ocupado. Pode ser necessário processo de desocupação.'
  },
  UNOCCUPIED: {
    label: 'Desocupado',
    variant: 'default',
    icon: CheckCircle2,
    description: 'O imóvel está desocupado e livre para ocupação.'
  },
  UNCERTAIN: {
    label: 'Incerto',
    variant: 'secondary',
    icon: HelpCircle,
    description: 'Status de ocupação não confirmado. Recomenda-se verificação in loco.'
  },
  SHARED_POSSESSION: {
    label: 'Posse Compartilhada',
    variant: 'outline',
    icon: Users,
    description: 'O imóvel possui posse compartilhada com terceiros.'
  }
};

const JUDICIAL_ACTION_CONFIG: Record<JudicialActionType, {
  label: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
}> = {
  USUCAPIAO: {
    label: 'Usucapião',
    severity: 'high',
    description: 'Processo de reconhecimento de propriedade por posse prolongada.'
  },
  REMOCAO: {
    label: 'Remoção',
    severity: 'medium',
    description: 'Processo de remoção de ocupantes do imóvel.'
  },
  HIPOTECA: {
    label: 'Hipoteca',
    severity: 'medium',
    description: 'Imóvel dado em garantia de dívida.'
  },
  DESPEJO: {
    label: 'Despejo',
    severity: 'medium',
    description: 'Ação de despejo em andamento.'
  },
  PENHORA: {
    label: 'Penhora',
    severity: 'high',
    description: 'Imóvel penhorado por dívida judicial.'
  },
  COBRANCA: {
    label: 'Cobrança',
    severity: 'low',
    description: 'Ação de cobrança vinculada ao imóvel.'
  },
  INVENTARIO: {
    label: 'Inventário',
    severity: 'low',
    description: 'Imóvel em processo de inventário.'
  },
  DIVORCIO: {
    label: 'Divórcio',
    severity: 'low',
    description: 'Imóvel em partilha de divórcio.'
  },
  OUTROS: {
    label: 'Outros',
    severity: 'low',
    description: 'Outro tipo de ação judicial.'
  }
};

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

const OccupationStatusBadge: React.FC<{ 
  status: OccupationStatus;
  showIcon?: boolean;
}> = ({ status, showIcon = true }) => {
  const config = OCCUPATION_STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="gap-1">
      {showIcon && <Icon className="h-3 w-3" />}
      {config.label}
    </Badge>
  );
};

const JudicialActionBadge: React.FC<{ 
  actionType: JudicialActionType;
}> = ({ actionType }) => {
  const config = JUDICIAL_ACTION_CONFIG[actionType];
  
  const severityColors = {
    low: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
  };

  return (
    <Badge className={cn('gap-1', severityColors[config.severity])}>
      <Scale className="h-3 w-3" />
      {config.label}
    </Badge>
  );
};

const RiskAlert: React.FC<{ risk: LotRisk }> = ({ risk }) => {
  const levelConfig = {
    BAIXO: { variant: 'default' as const, icon: CheckCircle2 },
    MEDIO: { variant: 'default' as const, icon: AlertTriangle },
    ALTO: { variant: 'destructive' as const, icon: AlertTriangle },
    CRITICO: { variant: 'destructive' as const, icon: AlertTriangle }
  };

  const config = levelConfig[risk.riskLevel];
  const Icon = config.icon;

  return (
    <Alert variant={config.variant} className="mt-2">
      <Icon className="h-4 w-4" />
      <AlertTitle className="text-sm font-medium">
        Risco {risk.riskLevel.toLowerCase()}: {risk.riskType.replace(/_/g, ' ')}
      </AlertTitle>
      <AlertDescription className="text-xs">
        {risk.riskDescription}
        {risk.mitigationStrategy && (
          <p className="mt-1 text-muted-foreground">
            <strong>Mitigação:</strong> {risk.mitigationStrategy}
          </p>
        )}
      </AlertDescription>
    </Alert>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function LotLegalInfoCard({
  propertyMatricula,
  propertyRegistrationNumber,
  occupationStatus,
  occupationNotes,
  actionType,
  actionDescription,
  actionCnjCode,
  risks = [],
  className
}: LotLegalInfoCardProps) {
  const hasAnyInfo = propertyMatricula || propertyRegistrationNumber || 
                     occupationStatus || actionType || risks.length > 0;

  if (!hasAnyInfo) {
    return null;
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="h-5 w-5 text-primary" />
          Informações Jurídicas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Matrícula e Registro */}
        {(propertyMatricula || propertyRegistrationNumber) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {propertyMatricula && (
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Matrícula</p>
                  <p className="font-medium">{propertyMatricula}</p>
                </div>
              </div>
            )}
            {propertyRegistrationNumber && (
              <div className="flex items-start gap-2">
                <Home className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Registro</p>
                  <p className="font-medium">{propertyRegistrationNumber}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Status de Ocupação */}
        {occupationStatus && (
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Status de Ocupação</span>
              <OccupationStatusBadge status={occupationStatus} />
            </div>
            <p className="text-xs text-muted-foreground">
              {OCCUPATION_STATUS_CONFIG[occupationStatus].description}
            </p>
            {occupationNotes && (
              <p className="text-xs text-muted-foreground mt-1 italic">
                Obs: {occupationNotes}
              </p>
            )}
          </div>
        )}

        {/* Ação Judicial */}
        {actionType && (
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Tipo de Ação Judicial</span>
              <JudicialActionBadge actionType={actionType} />
            </div>
            <p className="text-xs text-muted-foreground">
              {JUDICIAL_ACTION_CONFIG[actionType].description}
            </p>
            {actionDescription && (
              <p className="text-xs mt-1">{actionDescription}</p>
            )}
            {actionCnjCode && (
              <p className="text-xs text-muted-foreground mt-1">
                Código CNJ: {actionCnjCode}
              </p>
            )}
          </div>
        )}

        {/* Riscos */}
        {risks.length > 0 && (
          <div className="border-t pt-4">
            <p className="text-sm font-medium mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Riscos Identificados ({risks.length})
            </p>
            <div className="space-y-2">
              {risks.map((risk) => (
                <RiskAlert key={risk.id} risk={risk} />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default LotLegalInfoCard;
