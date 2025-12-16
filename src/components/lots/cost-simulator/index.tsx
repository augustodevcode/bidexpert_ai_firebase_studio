/**
 * @fileoverview Simulador de Custos para Imóveis em Leilão
 * @description Calcula custos totais de aquisição incluindo taxas, impostos e custos cartorários
 * @module components/lots/cost-simulator/index
 */
'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Calculator, 
  DollarSign, 
  FileDown, 
  Info,
  TrendingUp,
  Building,
  FileText,
  Scale
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// =============================================================================
// TYPES
// =============================================================================

interface CostConfig {
  /** Taxa de sucesso/comissão do leiloeiro (%) */
  successFeePercent: number;
  /** ITBI - Imposto de Transmissão (%) */
  itbiPercent: number;
  /** Emolumentos cartorários (%) */
  registryFeePercent: number;
  /** Honorários advocatícios fixos */
  legalFeesFixed?: number;
  /** Taxas notariais fixas */
  notaryFeesFixed?: number;
  /** Estado para regras específicas */
  stateUf?: string;
}

interface CostBreakdown {
  bidAmount: number;
  successFee: number;
  itbi: number;
  registryFee: number;
  legalFees: number;
  notaryFees: number;
  totalCosts: number;
  totalInvestment: number;
  costPercentage: number;
}

interface CostSimulatorProps {
  /** Preço inicial do lote */
  initialPrice?: number;
  /** Configuração de custos do leilão */
  costConfig?: Partial<CostConfig>;
  /** UF do imóvel */
  stateUf?: string;
  /** Título do lote */
  lotTitle?: string;
  /** Classes adicionais */
  className?: string;
  /** Callback quando o cálculo é atualizado */
  onCalculate?: (breakdown: CostBreakdown) => void;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_COST_CONFIG: CostConfig = {
  successFeePercent: 5.00,
  itbiPercent: 3.00,
  registryFeePercent: 1.50,
  legalFeesFixed: 3000,
  notaryFeesFixed: 1500,
};

// Regras específicas por estado
const STATE_SPECIFIC_RULES: Record<string, Partial<CostConfig>> = {
  SP: { itbiPercent: 3.00 },
  RJ: { itbiPercent: 2.00 },
  MG: { itbiPercent: 2.50 },
  RS: { itbiPercent: 3.00 },
  PR: { itbiPercent: 2.50 },
};

// =============================================================================
// HELPERS
// =============================================================================

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const parseCurrencyInput = (value: string): number => {
  const cleaned = value.replace(/[^\d,]/g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
};

const calculateCosts = (bidAmount: number, config: CostConfig): CostBreakdown => {
  const successFee = bidAmount * (config.successFeePercent / 100);
  const itbi = bidAmount * (config.itbiPercent / 100);
  const registryFee = bidAmount * (config.registryFeePercent / 100);
  const legalFees = config.legalFeesFixed || 0;
  const notaryFees = config.notaryFeesFixed || 0;
  
  const totalCosts = successFee + itbi + registryFee + legalFees + notaryFees;
  const totalInvestment = bidAmount + totalCosts;
  const costPercentage = bidAmount > 0 ? (totalCosts / bidAmount) * 100 : 0;

  return {
    bidAmount,
    successFee,
    itbi,
    registryFee,
    legalFees,
    notaryFees,
    totalCosts,
    totalInvestment,
    costPercentage,
  };
};

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

interface CostLineProps {
  label: string;
  value: number;
  percentage?: number;
  icon?: React.ComponentType<{ className?: string }>;
  tooltip?: string;
  isTotal?: boolean;
}

const CostLine: React.FC<CostLineProps> = ({ 
  label, 
  value, 
  percentage, 
  icon: Icon, 
  tooltip, 
  isTotal 
}) => {
  return (
    <div className={cn(
      'flex items-center justify-between py-2',
      isTotal && 'font-semibold text-lg border-t-2 pt-3 mt-2'
    )}>
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
        <span className={cn(isTotal && 'text-primary')}>{label}</span>
        {tooltip && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3 w-3 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs text-xs">{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      <div className="text-right">
        <span className={cn(isTotal && 'text-primary')}>
          {formatCurrency(value)}
        </span>
        {percentage !== undefined && (
          <span className="text-xs text-muted-foreground ml-2">
            ({percentage.toFixed(2)}%)
          </span>
        )}
      </div>
    </div>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function CostSimulator({
  initialPrice = 0,
  costConfig: providedConfig,
  stateUf,
  lotTitle: _lotTitle,
  className,
  onCalculate,
}: CostSimulatorProps) {
  const [inputValue, setInputValue] = React.useState<string>(
    initialPrice > 0 ? initialPrice.toString() : ''
  );
  const [breakdown, setBreakdown] = React.useState<CostBreakdown | null>(null);

  // Merge configs: provided > state-specific > default
  const effectiveConfig = React.useMemo<CostConfig>(() => {
    const stateRules = stateUf ? STATE_SPECIFIC_RULES[stateUf] || {} : {};
    return {
      ...DEFAULT_COST_CONFIG,
      ...stateRules,
      ...providedConfig,
    };
  }, [providedConfig, stateUf]);

  const handleCalculate = React.useCallback(() => {
    const bidAmount = parseCurrencyInput(inputValue);
    if (bidAmount > 0) {
      const result = calculateCosts(bidAmount, effectiveConfig);
      setBreakdown(result);
      onCalculate?.(result);
    }
  }, [inputValue, effectiveConfig, onCalculate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCalculate();
    }
  };

  const handleExportPdf = () => {
    // TODO: Implementar exportação PDF
    console.log('Exportando PDF...', breakdown);
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          Simulador de Custos
        </CardTitle>
        <CardDescription>
          Calcule o investimento total incluindo taxas, impostos e custos cartorários
          {stateUf && <span className="ml-1">(UF: {stateUf})</span>}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Input de Valor */}
        <div className="space-y-2">
          <Label htmlFor="bid-amount">Valor do Lance</Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="bid-amount"
              type="text"
              placeholder="Digite o valor do lance"
              value={inputValue}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              className="pl-10"
            />
          </div>
        </div>

        <Button onClick={handleCalculate} className="w-full">
          <Calculator className="mr-2 h-4 w-4" />
          Calcular Custos
        </Button>

        {/* Breakdown de Custos */}
        {breakdown && (
          <div className="mt-6 space-y-1">
            <Separator className="my-4" />
            
            <h4 className="font-medium text-sm text-muted-foreground mb-3">
              Detalhamento de Custos
            </h4>

            <CostLine
              label="Valor do Lance"
              value={breakdown.bidAmount}
              icon={TrendingUp}
            />
            
            <Separator className="my-2" />
            
            <CostLine
              label="Comissão do Leiloeiro"
              value={breakdown.successFee}
              percentage={effectiveConfig.successFeePercent}
              icon={Scale}
              tooltip="Taxa de sucesso paga ao leiloeiro pela arrematação"
            />
            
            <CostLine
              label="ITBI"
              value={breakdown.itbi}
              percentage={effectiveConfig.itbiPercent}
              icon={Building}
              tooltip="Imposto sobre Transmissão de Bens Imóveis"
            />
            
            <CostLine
              label="Emolumentos Cartorários"
              value={breakdown.registryFee}
              percentage={effectiveConfig.registryFeePercent}
              icon={FileText}
              tooltip="Custos de registro em cartório"
            />
            
            {breakdown.legalFees > 0 && (
              <CostLine
                label="Honorários Advocatícios"
                value={breakdown.legalFees}
                icon={Scale}
                tooltip="Estimativa de honorários para assessoria jurídica"
              />
            )}
            
            {breakdown.notaryFees > 0 && (
              <CostLine
                label="Taxas Notariais"
                value={breakdown.notaryFees}
                icon={FileText}
                tooltip="Taxas fixas de cartório e autenticações"
              />
            )}
            
            <CostLine
              label="Total de Custos"
              value={breakdown.totalCosts}
              isTotal
            />
            
            <div className="bg-primary/10 rounded-lg p-4 mt-4">
              <CostLine
                label="INVESTIMENTO TOTAL"
                value={breakdown.totalInvestment}
                isTotal
              />
              <p className="text-xs text-muted-foreground text-center mt-2">
                Custos representam {breakdown.costPercentage.toFixed(2)}% do valor do lance
              </p>
            </div>
          </div>
        )}
      </CardContent>

      {breakdown && (
        <CardFooter>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={handleExportPdf}
          >
            <FileDown className="mr-2 h-4 w-4" />
            Exportar Simulação (PDF)
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

export default CostSimulator;
export type { CostConfig, CostBreakdown, CostSimulatorProps };
