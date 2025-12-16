/**
 * @fileoverview Card de Especificações Técnicas de Veículos
 * @description Exibe especificações detalhadas do veículo com badges de condição
 * @module components/lots/vehicle-specs/index
 */
'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Car, 
  Gauge, 
  Fuel, 
  Settings, 
  Key, 
  Calendar,
  Palette,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';

// =============================================================================
// TYPES
// =============================================================================

type ConditionLevel = 'BOM' | 'REGULAR' | 'RUIM' | 'NAO_INFORMADO';

interface VehicleSpecs {
  // Identificação
  plate?: string;
  vin?: string; // Chassi
  renavam?: string;
  
  // Características
  make?: string;
  model?: string;
  version?: string;
  year?: number;
  modelYear?: number;
  color?: string;
  fuelType?: string;
  transmissionType?: string;
  bodyType?: string;
  enginePower?: string;
  numberOfDoors?: number;
  
  // Uso
  mileage?: number;
  
  // Condição
  runningCondition?: ConditionLevel;
  bodyCondition?: ConditionLevel;
  tiresCondition?: ConditionLevel;
  hasKey?: boolean;
  
  // Documentação
  detranStatus?: string;
  debts?: string;
  vehicleOptions?: string;
}

interface VehicleSpecsCardProps {
  specs: VehicleSpecs;
  showFullDetails?: boolean;
  className?: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const CONDITION_CONFIG: Record<ConditionLevel, {
  label: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}> = {
  BOM: {
    label: 'Bom',
    variant: 'default',
    icon: CheckCircle2,
    color: 'text-green-600'
  },
  REGULAR: {
    label: 'Regular',
    variant: 'secondary',
    icon: HelpCircle,
    color: 'text-yellow-600'
  },
  RUIM: {
    label: 'Ruim',
    variant: 'destructive',
    icon: XCircle,
    color: 'text-red-600'
  },
  NAO_INFORMADO: {
    label: 'Não Informado',
    variant: 'outline',
    icon: HelpCircle,
    color: 'text-muted-foreground'
  }
};

const FUEL_TYPE_LABELS: Record<string, string> = {
  GASOLINA: 'Gasolina',
  ETANOL: 'Etanol',
  FLEX: 'Flex',
  DIESEL: 'Diesel',
  GNV: 'GNV',
  ELETRICO: 'Elétrico',
  HIBRIDO: 'Híbrido',
};

const TRANSMISSION_LABELS: Record<string, string> = {
  MANUAL: 'Manual',
  AUTOMATICO: 'Automático',
  AUTOMATIZADO: 'Automatizado',
  CVT: 'CVT',
};

// =============================================================================
// HELPERS
// =============================================================================

const formatMileage = (mileage: number): string => {
  return new Intl.NumberFormat('pt-BR').format(mileage) + ' km';
};

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

interface SpecItemProps {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  value?: string | number | null;
  className?: string;
}

const SpecItem: React.FC<SpecItemProps> = ({ icon: Icon, label, value, className }) => {
  if (value === undefined || value === null) return null;
  
  return (
    <div className={cn('flex items-start gap-2', className)}>
      {Icon && <Icon className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />}
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-medium text-sm">{value}</p>
      </div>
    </div>
  );
};

interface ConditionBadgeProps {
  condition?: ConditionLevel;
  label: string;
}

const ConditionBadge: React.FC<ConditionBadgeProps> = ({ condition, label }) => {
  const config = CONDITION_CONFIG[condition || 'NAO_INFORMADO'];
  const Icon = config.icon;

  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm">{label}</span>
      <Badge variant={config.variant} className="gap-1">
        <Icon className={cn('h-3 w-3', config.color)} />
        {config.label}
      </Badge>
    </div>
  );
};

/**
 * Linha de resumo do veículo para exibição em cards
 * Ex: "2020 - 85.000 km - Flex - Sedan"
 */
export const VehicleSummaryLine: React.FC<{ specs: VehicleSpecs; className?: string }> = ({ 
  specs, 
  className 
}) => {
  const parts = [
    specs.year?.toString(),
    specs.mileage ? formatMileage(specs.mileage) : null,
    specs.fuelType ? FUEL_TYPE_LABELS[specs.fuelType] || specs.fuelType : null,
    specs.bodyType,
  ].filter(Boolean);

  if (parts.length === 0) return null;

  return (
    <p className={cn('text-sm text-muted-foreground', className)}>
      {parts.join(' • ')}
    </p>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function VehicleSpecsCard({
  specs,
  showFullDetails = true,
  className
}: VehicleSpecsCardProps) {
  const hasDebts = specs.debts && specs.debts.toLowerCase() !== 'nenhum';
  const hasDetranIssues = specs.detranStatus && !specs.detranStatus.toLowerCase().includes('regular');

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Car className="h-5 w-5 text-primary" />
          Especificações do Veículo
        </CardTitle>
        {specs.make && specs.model && (
          <p className="text-muted-foreground">
            {specs.make} {specs.model} {specs.version}
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Resumo Rápido */}
        <VehicleSummaryLine specs={specs} className="text-base font-medium" />

        <Separator />

        {/* Especificações Principais */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <SpecItem
            icon={Calendar}
            label="Ano/Modelo"
            value={specs.year && specs.modelYear 
              ? `${specs.year}/${specs.modelYear}` 
              : specs.year?.toString()}
          />
          <SpecItem
            icon={Gauge}
            label="Quilometragem"
            value={specs.mileage ? formatMileage(specs.mileage) : undefined}
          />
          <SpecItem
            icon={Fuel}
            label="Combustível"
            value={specs.fuelType ? FUEL_TYPE_LABELS[specs.fuelType] || specs.fuelType : undefined}
          />
          <SpecItem
            icon={Settings}
            label="Câmbio"
            value={specs.transmissionType 
              ? TRANSMISSION_LABELS[specs.transmissionType] || specs.transmissionType 
              : undefined}
          />
          <SpecItem
            icon={Palette}
            label="Cor"
            value={specs.color}
          />
          <SpecItem
            icon={Car}
            label="Carroceria"
            value={specs.bodyType}
          />
          {specs.enginePower && (
            <SpecItem
              icon={Gauge}
              label="Potência"
              value={specs.enginePower}
            />
          )}
          {specs.numberOfDoors && (
            <SpecItem
              icon={Car}
              label="Portas"
              value={specs.numberOfDoors.toString()}
            />
          )}
        </div>

        {showFullDetails && (
          <>
            <Separator />

            {/* Condição do Veículo */}
            <div>
              <h4 className="font-medium text-sm mb-3">Condição</h4>
              <div className="space-y-1">
                <ConditionBadge 
                  condition={specs.runningCondition as ConditionLevel} 
                  label="Funcionamento" 
                />
                <ConditionBadge 
                  condition={specs.bodyCondition as ConditionLevel} 
                  label="Lataria" 
                />
                <ConditionBadge 
                  condition={specs.tiresCondition as ConditionLevel} 
                  label="Pneus" 
                />
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm">Chave</span>
                  <Badge variant={specs.hasKey ? 'default' : 'secondary'}>
                    <Key className="h-3 w-3 mr-1" />
                    {specs.hasKey ? 'Possui' : 'Não Possui'}
                  </Badge>
                </div>
              </div>
            </div>

            <Separator />

            {/* Documentação */}
            <div>
              <h4 className="font-medium text-sm mb-3">Documentação</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {specs.plate && (
                  <SpecItem icon={FileText} label="Placa" value={specs.plate} />
                )}
                {specs.renavam && (
                  <SpecItem icon={FileText} label="RENAVAM" value={specs.renavam} />
                )}
                {specs.vin && (
                  <SpecItem icon={FileText} label="Chassi" value={specs.vin} />
                )}
              </div>
            </div>

            {/* Alertas de Débitos/Restrições */}
            {(hasDebts || hasDetranIssues) && (
              <>
                <Separator />
                <div className="space-y-2">
                  {hasDebts && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Débitos Identificados</AlertTitle>
                      <AlertDescription className="text-xs">
                        {specs.debts}
                      </AlertDescription>
                    </Alert>
                  )}
                  {hasDetranIssues && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Situação DETRAN</AlertTitle>
                      <AlertDescription className="text-xs">
                        {specs.detranStatus}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </>
            )}

            {/* Opcionais */}
            {specs.vehicleOptions && (
              <>
                <Separator />
                <div>
                  <h4 className="font-medium text-sm mb-2">Opcionais</h4>
                  <p className="text-sm text-muted-foreground">
                    {specs.vehicleOptions}
                  </p>
                </div>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default VehicleSpecsCard;
export type { VehicleSpecs, ConditionLevel };
